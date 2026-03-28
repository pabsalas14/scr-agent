import { apiService } from './api.service';
import { Notification, NotificationsResponse, UnreadCountResponse } from '../types/findings';

class NotificationsService {
  /**
   * Get user's notifications
   */
  async getNotifications(limit: number = 20): Promise<Notification[]> {
    try {
      const response = await apiService.get<any>(
        `/notifications?limit=${limit}`
      );
      return (response.data?.data || response.data || []) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiService.get<any>(
        '/notifications/unread-count'
      );
      return (response.data?.unreadCount || response.data?.data?.unreadCount || 0) as number;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiService.put(`/notifications/${notificationId}/read`, {});
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    try {
      const response = await apiService.put('/notifications/mark-all-read', {});
      return response.data?.markedAsReadCount || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Clear all notifications
   */
  async clearNotifications(): Promise<void> {
    try {
      await apiService.delete('/notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
