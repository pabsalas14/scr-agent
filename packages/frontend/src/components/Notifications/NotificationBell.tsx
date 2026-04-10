/**
 * NotificationBell - Bell icon with unread count badge
 */

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useToast } from '../../hooks/useToast';
import { notificationsService } from '../../services/notifications.service';

interface NotificationBellProps {
  onNotificationClick?: () => void;
}

export default function NotificationBell({ onNotificationClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Load unread notifications
  useEffect(() => {
    loadUnreadNotifications();
  }, []);

  const loadUnreadNotifications = async () => {
    try {
      setIsLoading(true);
      const [notifications, unreadCount] = await Promise.all([
        notificationsService.getNotifications(5),
        notificationsService.getUnreadCount(),
      ]);
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to real-time notification events
  useSocketEvents({
    onNotificationReceived: (data) => {
      setUnreadCount((prev) => prev + 1);
      loadUnreadNotifications();
      // Show toast notification for new notifications
      const toastType = data.type.toLowerCase() as 'info' | 'success' | 'warning' | 'error';
      if (toastType === 'success') {
        toast.success(data.message || data.title);
      } else if (toastType === 'error') {
        toast.error(data.message || data.title);
      } else if (toastType === 'warning') {
        toast.warning(data.message || data.title);
      } else {
        toast.info(data.message || data.title);
      }
    },
  });

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('Error marcando como leído');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      toast.error('Error marcando notificaciones');
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          onNotificationClick?.();
        }}
        className="relative p-2 hover:bg-[#242424] rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-[#A0A0A0] hover:text-white" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg shadow-lg z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#2D2D2D]">
              <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#F97316] hover:text-[#EA6D00] transition-colors"
                  >
                    Marcar todo como leído
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-[#242424] rounded transition-colors"
                >
                  <X className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="w-5 h-5 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-[#6B7280]">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-[#2D2D2D]">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 hover:bg-[#242424] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {notification.title || notification.message}
                          </p>
                          {notification.description && (
                            <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                              {notification.description}
                            </p>
                          )}
                          <p className="text-xs text-[#4B5563] mt-1">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1 hover:bg-[#2D2D2D] rounded transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4 text-[#6B7280] hover:text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Format time ago for notifications
 */
function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const notifDate = new Date(date);
  const diff = now.getTime() - notifDate.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'hace unos segundos';
  if (minutes < 60) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  if (days < 7) return `hace ${days}d`;

  return notifDate.toLocaleDateString('es-ES');
}
