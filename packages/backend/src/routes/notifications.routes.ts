import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { notificationsService } from '../services/notifications.service';
import { logger } from '../services/logger.service';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/notifications
 * Get user's notifications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 20 } = req.query;

    const notifications = notificationsService.getUserNotifications(
      userId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching notifications',
    });
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const count = notificationsService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching unread count',
    });
  }
});

/**
 * PUT /api/v1/notifications/:notificationId/read
 * Mark notification as read
 */
router.put('/:notificationId/read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationId } = req.params;

    const success = notificationsService.markAsRead(userId, notificationId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating notification',
    });
  }
});

/**
 * PUT /api/v1/notifications/mark-all-read
 * Mark all notifications as read
 */
router.put('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const count = notificationsService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { markedAsReadCount: count },
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating notifications',
    });
  }
});

/**
 * DELETE /api/v1/notifications
 * Clear all notifications for user
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    notificationsService.clearUserNotifications(userId);

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Error clearing notifications',
    });
  }
});

export default router;
