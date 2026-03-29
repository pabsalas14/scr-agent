/**
 * User Settings Routes
 * GET/POST endpoints for user preferences and settings
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { prisma } from '../services/prisma.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

interface NotificationPreference {
  id: string;
  userId: string;
  emailOnFindingDetected: boolean;
  emailOnFindingAssigned: boolean;
  emailOnRemediationVerified: boolean;
  emailOnCommentAdded: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  dailyDigest: boolean;
  digestTime: string;
  createdAt?: string;
  updatedAt?: string;
}

// Default preferences
const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'id' | 'userId'> = {
  emailOnFindingDetected: true,
  emailOnFindingAssigned: true,
  emailOnRemediationVerified: true,
  emailOnCommentAdded: true,
  pushNotifications: false,
  inAppNotifications: true,
  dailyDigest: false,
  digestTime: '09:00'
};

/**
 * GET /api/v1/users/preferences
 * Get notification preferences for the current user
 */
router.get('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const dbPrefs = await prisma.notificationPreferences.findUnique({
        where: { userId }
      });

      if (dbPrefs) {
        return res.json({
          data: {
            id: dbPrefs.id,
            userId: dbPrefs.userId,
            emailOnFindingDetected: dbPrefs.enableStatusChanges,
            emailOnFindingAssigned: dbPrefs.enableAssignments,
            emailOnRemediationVerified: dbPrefs.enableRemediations,
            emailOnCommentAdded: dbPrefs.enableComments,
            pushNotifications: false,
            inAppNotifications: true,
            dailyDigest: dbPrefs.enableDigestEmail,
            digestTime: '09:00'
          }
        });
      }
    } catch (e) {
      console.warn('Could not read notificationPreferences:', e);
    }

    // Return default preferences
    res.json({
      data: {
        id: `pref-${userId}`,
        userId: String(userId),
        ...DEFAULT_PREFERENCES
      }
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * POST /api/v1/users/preferences
 * Update notification preferences for the current user
 */
router.post('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const dbUpdateData: any = {};
      if (updates.emailOnFindingDetected !== undefined) dbUpdateData.enableStatusChanges = updates.emailOnFindingDetected;
      if (updates.emailOnFindingAssigned !== undefined) dbUpdateData.enableAssignments = updates.emailOnFindingAssigned;
      if (updates.emailOnRemediationVerified !== undefined) dbUpdateData.enableRemediations = updates.emailOnRemediationVerified;
      if (updates.emailOnCommentAdded !== undefined) dbUpdateData.enableComments = updates.emailOnCommentAdded;
      if (updates.dailyDigest !== undefined) dbUpdateData.enableDigestEmail = updates.dailyDigest;

      const updatedDbPrefs = await prisma.notificationPreferences.upsert({
        where: { userId },
        update: dbUpdateData,
        create: {
          userId,
          ...dbUpdateData
        }
      });

      return res.json({
        data: {
          id: updatedDbPrefs.id,
          userId: updatedDbPrefs.userId,
          emailOnFindingDetected: updatedDbPrefs.enableStatusChanges,
          emailOnFindingAssigned: updatedDbPrefs.enableAssignments,
          emailOnRemediationVerified: updatedDbPrefs.enableRemediations,
          emailOnCommentAdded: updatedDbPrefs.enableComments,
          pushNotifications: updates.pushNotifications ?? DEFAULT_PREFERENCES.pushNotifications,
          inAppNotifications: updates.inAppNotifications ?? DEFAULT_PREFERENCES.inAppNotifications,
          dailyDigest: updatedDbPrefs.enableDigestEmail,
          digestTime: updates.digestTime ?? DEFAULT_PREFERENCES.digestTime
        }
      });
    } catch (e) {
      console.warn('Failed to upsert notification preferences:', e);
      return res.json({
        data: {
          id: `pref-${userId}`,
          userId: String(userId),
          ...DEFAULT_PREFERENCES,
          ...updates
        }
      });
    }
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

/**
 * GET /api/v1/users/settings
 * Get all user settings
 */
router.get('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await (prisma as any).user?.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

export default router;
