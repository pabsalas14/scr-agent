import { logger } from './logger.service';
import { FindingStatus, RemediationStatus } from '@prisma/client';

export interface Notification {
  id: string;
  userId: string;
  type: 'status_change' | 'assignment' | 'remediation' | 'verification';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  findingId?: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// In-memory store for notifications (would be database in production)
const notifications: Map<string, Notification[]> = new Map();

export class NotificationsService {
  generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  notifyFindingStatusChange(
    userId: string,
    findingId: string,
    newStatus: FindingStatus,
    changedByName: string
  ): Notification {
    const notification: Notification = {
      id: this.generateNotificationId(),
      userId,
      type: 'status_change',
      title: 'Hallazgo Actualizado',
      message: `${changedByName} cambió el estado a: ${this.formatStatus(newStatus)}`,
      severity: this.getSeverityForStatus(newStatus),
      findingId,
      metadata: { newStatus, changedByName },
      read: false,
      createdAt: new Date(),
    };

    this.storeNotification(notification);
    logger.info(`Notification sent to ${userId}: Finding status changed`);
    return notification;
  }

  notifyFindingAssignment(userId: string, findingId: string, assignedByName: string): Notification {
    const notification: Notification = {
      id: this.generateNotificationId(),
      userId,
      type: 'assignment',
      title: 'Nuevo Hallazgo Asignado',
      message: `${assignedByName} te asignó un nuevo hallazgo para revisar`,
      severity: 'info',
      findingId,
      metadata: { assignedByName },
      read: false,
      createdAt: new Date(),
    };

    this.storeNotification(notification);
    logger.info(`Notification sent to ${userId}: Finding assigned`);
    return notification;
  }

  notifyRemediationUpdate(
    userId: string,
    findingId: string,
    newStatus: RemediationStatus,
    updatedByName: string
  ): Notification {
    const notification: Notification = {
      id: this.generateNotificationId(),
      userId,
      type: 'remediation',
      title: 'Remediación Actualizada',
      message: `${updatedByName} actualizó la remediación: ${this.formatRemediationStatus(
        newStatus
      )}`,
      severity: this.getSeverityForRemediationStatus(newStatus),
      findingId,
      metadata: { newStatus, updatedByName },
      read: false,
      createdAt: new Date(),
    };

    this.storeNotification(notification);
    logger.info(`Notification sent to ${userId}: Remediation updated`);
    return notification;
  }

  notifyRemediationVerified(
    userId: string,
    findingId: string,
    verifiedByName: string
  ): Notification {
    const notification: Notification = {
      id: this.generateNotificationId(),
      userId,
      type: 'verification',
      title: '✓ Remediación Verificada',
      message: `${verifiedByName} verificó tu remediación como completada`,
      severity: 'success',
      findingId,
      metadata: { verifiedByName },
      read: false,
      createdAt: new Date(),
    };

    this.storeNotification(notification);
    logger.info(`Notification sent to ${userId}: Remediation verified`);
    return notification;
  }

  getUserNotifications(userId: string, limit: number = 20): Notification[] {
    const userNotifications = notifications.get(userId) || [];
    return userNotifications.slice(0, limit);
  }

  markAsRead(userId: string, notificationId: string): boolean {
    const userNotifications = notifications.get(userId);
    if (!userNotifications) return false;

    const notif = userNotifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(userId: string): number {
    const userNotifications = notifications.get(userId);
    if (!userNotifications) return 0;

    let count = 0;
    userNotifications.forEach((notif) => {
      if (!notif.read) {
        notif.read = true;
        count++;
      }
    });
    return count;
  }

  getUnreadCount(userId: string): number {
    const userNotifications = notifications.get(userId) || [];
    return userNotifications.filter((n) => !n.read).length;
  }

  clearUserNotifications(userId: string): void {
    notifications.delete(userId);
  }

  private storeNotification(notification: Notification): void {
    const userNotifications = notifications.get(notification.userId) || [];
    userNotifications.unshift(notification); // Add to beginning for most recent first

    // Keep only last 100 notifications per user
    if (userNotifications.length > 100) {
      userNotifications.pop();
    }

    notifications.set(notification.userId, userNotifications);
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

  private getSeverityForStatus(status: FindingStatus): Notification['severity'] {
    switch (status) {
      case 'VERIFIED':
      case 'CLOSED':
        return 'success';
      case 'IN_CORRECTION':
      case 'IN_REVIEW':
        return 'warning';
      case 'FALSE_POSITIVE':
        return 'info';
      default:
        return 'info';
    }
  }

  private getSeverityForRemediationStatus(status: RemediationStatus): Notification['severity'] {
    switch (status) {
      case 'VERIFIED':
      case 'COMPLETED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'IN_PROGRESS':
        return 'warning';
      case 'PENDING':
        return 'info';
      default:
        return 'info';
    }
  }
}

export const notificationsService = new NotificationsService();
