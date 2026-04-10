/**
 * ============================================================================
 * NOTIFICATION CENTER - Centro de notificaciones
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Trash2, Check, Mail } from 'lucide-react';
import { notificationsService, Notification } from '../../services/notifications.service';

interface NotificationCenterProps {
  userId?: string;
  limit?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ limit = 10 }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('unread');

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await notificationsService.getNotifications({
        unreadOnly: filter === 'unread',
        severity: filter === 'critical' ? 'CRITICAL' : undefined,
        limit,
      });
      setNotifications(result.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertCircle className="text-red-600" size={18} />;
      case 'WARNING':
        return <AlertCircle className="text-orange-600" size={18} />;
      default:
        return <Info className="text-blue-600" size={18} />;
    }
  };

  const getSeverityColor = (severity: string, read: boolean) => {
    if (read) return 'bg-gray-50 dark:bg-gray-800';
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'WARNING':
        return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Mail size={20} />
          Notifications
        </h3>
        <button
          onClick={handleMarkAllAsRead}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'unread', 'critical'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.map((notification, idx) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-3 rounded-lg border transition-all ${getSeverityColor(
                notification.severity,
                notification.read
              )}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getSeverityIcon(notification.severity)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {notification.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {formatDate(new Date(notification.createdAt))}
                  </p>
                </div>

                <div className="flex-shrink-0 flex gap-1">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Showing {notifications.length} of {notifications.length} notifications
        </p>
      )}
    </motion.div>
  );
};
