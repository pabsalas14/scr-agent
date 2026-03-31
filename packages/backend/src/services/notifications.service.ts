import { prisma } from './prisma.service';
import { logger } from './logger.service';
import { FindingStatus, RemediationStatus, NotificationType, NotificationSeverity } from '@prisma/client';
import type { Notification as PrismaNotification } from '@prisma/client';

export type Notification = PrismaNotification;

export class NotificationsService {
  async notifyFindingStatusChange(
    userId: string,
    findingId: string,
    newStatus: FindingStatus,
    changedByName: string
  ): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.STATUS_CHANGE,
        title: 'Hallazgo Actualizado',
        message: `${changedByName} cambió el estado a: ${this.formatStatus(newStatus)}`,
        severity: this.getSeverityForStatus(newStatus),
        findingId,
        metadata: { newStatus, changedByName },
        read: false,
      },
    });
    logger.info(`Notification sent to ${userId}: Finding status changed`);
    return notification;
  }

  async notifyFindingAssignment(userId: string, findingId: string, assignedByName: string): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.ASSIGNMENT,
        title: 'Nuevo Hallazgo Asignado',
        message: `${assignedByName} te asignó un nuevo hallazgo para revisar`,
        severity: NotificationSeverity.INFO,
        findingId,
        metadata: { assignedByName },
        read: false,
      },
    });
    logger.info(`Notification sent to ${userId}: Finding assigned`);
    return notification;
  }

  async notifyRemediationUpdate(
    userId: string,
    findingId: string,
    newStatus: RemediationStatus,
    updatedByName: string
  ): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.REMEDIATION,
        title: 'Remediación Actualizada',
        message: `${updatedByName} actualizó la remediación: ${this.formatRemediationStatus(newStatus)}`,
        severity: this.getSeverityForRemediationStatus(newStatus),
        findingId,
        metadata: { newStatus, updatedByName },
        read: false,
      },
    });
    logger.info(`Notification sent to ${userId}: Remediation updated`);
    return notification;
  }

  async notifyRemediationVerified(
    userId: string,
    findingId: string,
    verifiedByName: string
  ): Promise<Notification> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.VERIFICATION,
        title: 'Remediación Verificada',
        message: `${verifiedByName} verificó tu remediación como completada`,
        severity: NotificationSeverity.SUCCESS,
        findingId,
        metadata: { verifiedByName },
        read: false,
      },
    });
    logger.info(`Notification sent to ${userId}: Remediation verified`);
    return notification;
  }

  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) return false;

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return true;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const { count } = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async clearUserNotifications(userId: string): Promise<void> {
    await prisma.notification.deleteMany({ where: { userId } });
  }

  private formatStatus(status: FindingStatus): string {
    const statusMap: Record<FindingStatus, string> = {
      DETECTED: 'Detectado',
      IN_REVIEW: 'En Revisión',
      IN_CORRECTION: 'En Corrección',
      CORRECTED: 'Corregido',
      VERIFIED: 'Verificado',
      FALSE_POSITIVE: 'Falso Positivo',
      CLOSED: 'Cerrado',
    };
    return statusMap[status] || status;
  }

  private formatRemediationStatus(status: RemediationStatus): string {
    const statusMap: Record<RemediationStatus, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completado',
      VERIFIED: 'Verificado',
      REJECTED: 'Rechazado',
    };
    return statusMap[status] || status;
  }

  private getSeverityForStatus(status: FindingStatus): NotificationSeverity {
    switch (status) {
      case 'VERIFIED':
      case 'CLOSED':
        return NotificationSeverity.SUCCESS;
      case 'IN_CORRECTION':
      case 'IN_REVIEW':
        return NotificationSeverity.WARNING;
      default:
        return NotificationSeverity.INFO;
    }
  }

  private getSeverityForRemediationStatus(status: RemediationStatus): NotificationSeverity {
    switch (status) {
      case 'VERIFIED':
      case 'COMPLETED':
        return NotificationSeverity.SUCCESS;
      case 'REJECTED':
        return NotificationSeverity.ERROR;
      case 'IN_PROGRESS':
        return NotificationSeverity.WARNING;
      default:
        return NotificationSeverity.INFO;
    }
  }
}

export const notificationsService = new NotificationsService();
