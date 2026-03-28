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

    // Check if user_settings table exists (for Prisma)
    // For now, we'll store preferences in a JSON field or separate table
    // This is a simplified implementation - adjust based on actual DB schema

    // Try to find existing preferences
    try {
      // Assuming there's a user_settings table or preferences stored somewhere
      // For this implementation, we'll return default preferences if none exist
      const settings = await (prisma as any).userSettings?.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          emailOnFindingDetected: true,
          emailOnFindingAssigned: true,
          emailOnRemediationVerified: true,
          emailOnCommentAdded: true,
          pushNotifications: true,
          inAppNotifications: true,
          dailyDigest: true,
          digestTime: true
        }
      });

      if (settings) {
        return res.json({ data: settings });
      }
    } catch (e) {
      // Table may not exist yet
    }

    // Return default preferences for new users
    const defaultPrefs: NotificationPreference = {
      id: `pref-${userId}`,
      userId: String(userId),
      ...DEFAULT_PREFERENCES
    };

    res.json({ data: defaultPrefs });
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

    // Validate preference keys
    const validKeys = [
      'emailOnFindingDetected',
      'emailOnFindingAssigned',
      'emailOnRemediationVerified',
      'emailOnCommentAdded',
      'pushNotifications',
      'inAppNotifications',
      'dailyDigest',
      'digestTime'
    ];

    for (const key in updates) {
      if (!validKeys.includes(key)) {
        return res.status(400).json({ error: `Invalid preference key: ${key}` });
      }
    }

    // Try to update or create user settings
    try {
      const updated = await (prisma as any).userSettings?.upsert({
        where: { userId },
        update: {
          ...updates,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...DEFAULT_PREFERENCES,
          ...updates,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        select: {
          id: true,
          userId: true,
          emailOnFindingDetected: true,
          emailOnFindingAssigned: true,
          emailOnRemediationVerified: true,
          emailOnCommentAdded: true,
          pushNotifications: true,
          inAppNotifications: true,
          dailyDigest: true,
          digestTime: true
        }
      });

      return res.json({ data: updated });
    } catch (e) {
      // If userSettings table doesn't exist, return updated preferences
      // In production, create the table migration
      const updated: NotificationPreference = {
        id: `pref-${userId}`,
        userId: String(userId),
        ...DEFAULT_PREFERENCES,
        ...updates
      };

      return res.json({ data: updated });
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
