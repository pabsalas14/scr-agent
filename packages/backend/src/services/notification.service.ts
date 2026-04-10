/**
 * ============================================================================
 * NOTIFICATION SERVICE - Sistema de alertas y notificaciones
 * ============================================================================
 *
 * Gestiona notificaciones en tiempo real para:
 * - Hallazgos de alto riesgo
 * - Amenazas detectadas (APT, BLA)
 * - Cambios en remedaciones
 * - Análisis completados
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export enum NotificationType {
  CRITICAL_FINDING = 'CRITICAL_FINDING',
  APT_DETECTED = 'APT_DETECTED',
  BLA_DETECTED = 'BLA_DETECTED',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  REMEDIATION_OVERDUE = 'REMEDIATION_OVERDUE',
  HIGH_RISK_USER = 'HIGH_RISK_USER',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  relatedId?: string; // findingId, analysisId, userId, etc
  metadata?: Record<string, any>;
}

/**
 * Crear notificación en base de datos
 */
export async function createNotification(
  userId: string,
  payload: NotificationPayload
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        severity: payload.severity,
        relatedId: payload.relatedId,
        metadata: payload.metadata || {},
        read: false,
      },
    });

    logger.info(`✓ Notificación creada para usuario ${userId}: ${payload.type}`);
    return notification;
  } catch (error) {
    logger.error(`Error creando notificación: ${error}`);
    throw error;
  }
}

/**
 * Broadcast notificación a múltiples usuarios
 */
export async function broadcastNotification(
  userIds: string[],
  payload: NotificationPayload
) {
  try {
    const notifications = await Promise.all(
      userIds.map(userId => createNotification(userId, payload))
    );

    logger.info(`✓ Notificación enviada a ${userIds.length} usuarios`);
    return notifications;
  } catch (error) {
    logger.error(`Error en broadcast: ${error}`);
    throw error;
  }
}

/**
 * Obtener notificaciones del usuario
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  }
) {
  try {
    const limit = Math.min(options?.limit || 50, 200);
    const offset = options?.offset || 0;

    const where: any = { userId };

    if (options?.unreadOnly) {
      where.read = false;
    }

    if (options?.severity) {
      where.severity = options.severity;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, limit, offset };
  } catch (error) {
    logger.error(`Error obteniendo notificaciones: ${error}`);
    return { notifications: [], total: 0, limit: 50, offset: 0 };
  }
}

/**
 * Marcar notificación como leída
 */
export async function markAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });

    return notification;
  } catch (error) {
    logger.error(`Error marcando notificación como leída: ${error}`);
    throw error;
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllAsRead(userId: string) {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    });

    logger.info(`✓ ${result.count} notificaciones marcadas como leídas`);
    return result;
  } catch (error) {
    logger.error(`Error marcando todas como leídas: ${error}`);
    throw error;
  }
}

/**
 * Obtener estadísticas de notificaciones
 */
export async function getNotificationStats(userId: string) {
  try {
    const [unreadCount, criticalCount, warningCount] = await Promise.all([
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.notification.count({
        where: { userId, severity: 'CRITICAL', read: false },
      }),
      prisma.notification.count({
        where: { userId, severity: 'WARNING', read: false },
      }),
    ]);

    // Agrupar por tipo
    const byType = await prisma.notification.groupBy({
      by: ['type'],
      where: { userId, read: false },
      _count: { id: true },
    });

    return {
      unreadCount,
      criticalCount,
      warningCount,
      byType: Object.fromEntries(byType.map(t => [t.type, t._count.id])),
    };
  } catch (error) {
    logger.error(`Error obteniendo estadísticas: ${error}`);
    return { unreadCount: 0, criticalCount: 0, warningCount: 0, byType: {} };
  }
}

/**
 * Crear alertas por hallazgos críticos
 */
export async function notifyAboutCriticalFinding(
  findingId: string,
  admins: string[]
) {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        analysis: { select: { project: { select: { name: true } } } },
      },
    });

    if (!finding) return;

    const payload: NotificationPayload = {
      type: NotificationType.CRITICAL_FINDING,
      title: '🚨 Critical Security Finding Detected',
      message: `Critical ${finding.riskType} in ${finding.analysis?.project?.name} - File: ${finding.file}`,
      severity: 'CRITICAL',
      relatedId: findingId,
      metadata: {
        severity: finding.severity,
        riskType: finding.riskType,
        file: finding.file,
      },
    };

    await broadcastNotification(admins, payload);
  } catch (error) {
    logger.error(`Error notificando hallazgo crítico: ${error}`);
  }
}

/**
 * Crear alertas por amenaza APT
 */
export async function notifyAboutAPTThreat(
  userId: string,
  threatLevel: string,
  threatType: string,
  admins: string[]
) {
  try {
    const payload: NotificationPayload = {
      type: NotificationType.APT_DETECTED,
      title: '⚠️ Advanced Persistent Threat Detected',
      message: `${threatType} threat (${threatLevel}) detected from user ${userId}`,
      severity: threatLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      relatedId: userId,
      metadata: { threatType, threatLevel },
    };

    await broadcastNotification(admins, payload);
  } catch (error) {
    logger.error(`Error notificando amenaza APT: ${error}`);
  }
}

/**
 * Crear alertas para remediaciones vencidas
 */
export async function notifyOverdueRemediations(
  remediations: any[]
) {
  try {
    const overdueMap = new Map<string, any[]>();

    for (const rem of remediations) {
      if (rem.assigneeId) {
        if (!overdueMap.has(rem.assigneeId)) {
          overdueMap.set(rem.assigneeId, []);
        }
        overdueMap.get(rem.assigneeId)!.push(rem);
      }
    }

    // Notificar a cada usuario sobre sus remediaciones vencidas
    for (const [userId, overdueRems] of overdueMap.entries()) {
      const payload: NotificationPayload = {
        type: NotificationType.REMEDIATION_OVERDUE,
        title: `📋 ${overdueRems.length} Overdue Remediations`,
        message: `You have ${overdueRems.length} remediation(s) past their due date`,
        severity: 'WARNING',
        metadata: { count: overdueRems.length },
      };

      await createNotification(userId, payload);
    }
  } catch (error) {
    logger.error(`Error notificando remediaciones vencidas: ${error}`);
  }
}

/**
 * Crear alerta por análisis completado
 */
export async function notifyAnalysisComplete(
  analysisId: string,
  projectName: string,
  findingsCount: number
) {
  try {
    // Obtener todos los admins/analistas
    const analysts = await prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: { in: ['ADMIN', 'ANALYST'] },
          },
        },
      },
      select: { id: true },
    });

    const payload: NotificationPayload = {
      type: NotificationType.ANALYSIS_COMPLETE,
      title: '✅ Analysis Complete',
      message: `Analysis of ${projectName} completed with ${findingsCount} findings`,
      severity: findingsCount > 0 ? 'WARNING' : 'INFO',
      relatedId: analysisId,
      metadata: { projectName, findingsCount },
    };

    await broadcastNotification(
      analysts.map(a => a.id),
      payload
    );
  } catch (error) {
    logger.error(`Error notificando análisis completado: ${error}`);
  }
}
