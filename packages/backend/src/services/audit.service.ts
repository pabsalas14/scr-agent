/**
 * ============================================================================
 * AUDIT SERVICE - Trazabilidad de acciones en el sistema
 * ============================================================================
 *
 * Registra quién hizo qué cuándo en una tabla de auditoría
 * Para compliance, seguridad y debugging
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface AuditLogInput {
  userId: string;
  action: string; // create, update, delete, run, cancel, etc
  resourceType: string; // analysis, finding, project, etc
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registrar una acción en el audit log
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        details: input.details,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    logger.debug(`📝 Audit: ${input.userId} ${input.action} ${input.resourceType}${input.resourceId ? `#${input.resourceId}` : ''}`);
  } catch (error) {
    logger.error(`Error logging audit event: ${error}`);
    // No lanzar error - auditoría no debe bloquear operaciones
  }
}

/**
 * Obtener audit logs para un usuario
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const limit = Math.min(options?.limit || 50, 200);
    const offset = options?.offset || 0;

    const where: any = { userId };

    if (options?.action) where.action = options.action;
    if (options?.resourceType) where.resourceType = options.resourceType;

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          details: true,
          ipAddress: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, limit, offset };
  } catch (error) {
    logger.error(`Error obteniendo audit logs: ${error}`);
    return { logs: [], total: 0, limit: 50, offset: 0 };
  }
}

/**
 * Obtener audit logs para un recurso específico
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
) {
  try {
    const limit = Math.min(options?.limit || 50, 200);
    const offset = options?.offset || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          resourceType,
          resourceId,
        },
        select: {
          id: true,
          userId: true,
          user: { select: { id: true, name: true, email: true } },
          action: true,
          details: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where: { resourceType, resourceId } }),
    ]);

    return { logs, total, limit, offset };
  } catch (error) {
    logger.error(`Error obteniendo resource audit logs: ${error}`);
    return { logs: [], total: 0, limit: 50, offset: 0 };
  }
}

/**
 * Obtener resumen de actividad del sistema
 */
export async function getActivitySummary(options?: {
  days?: number;
}) {
  try {
    const days = options?.days || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalActions,
      actionsByType,
      topUsers,
      criticalActions,
    ] = await Promise.all([
      // Total de acciones
      prisma.auditLog.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Acciones por tipo
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
      }),

      // Top usuarios activos
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Acciones críticas (deletes, etc)
      prisma.auditLog.findMany({
        where: {
          createdAt: { gte: startDate },
          action: { in: ['delete', 'cancel', 'fail'] },
        },
        select: {
          action: true,
          resourceType: true,
          userId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      period: { days, startDate },
      totalActions,
      actionsByType,
      topUsers,
      criticalActions,
    };
  } catch (error) {
    logger.error(`Error obteniendo activity summary: ${error}`);
    return null;
  }
}
