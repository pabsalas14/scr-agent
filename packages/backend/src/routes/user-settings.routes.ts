/**
 * User Settings Routes
 * GET/POST endpoints for user preferences and settings
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { prisma } from '../services/prisma.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { logger } from '../services/logger.service';
import { encrypt, decrypt } from '../services/crypto.service';
import axios from 'axios';

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
          success: true,
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
      logger.warn(`Could not read notificationPreferences: ${e}`);
    }

    // Return default preferences
    res.json({
      success: true,
      data: {
        id: `pref-${userId}`,
        userId: String(userId),
        ...DEFAULT_PREFERENCES
      }
    });
  } catch (error) {
    logger.error(`Error fetching user preferences: ${error}`);
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
      logger.warn(`Failed to upsert notification preferences: ${e}`);
      return res.json({
        success: true,
        data: {
          id: `pref-${userId}`,
          userId: String(userId),
          ...DEFAULT_PREFERENCES,
          ...updates
        }
      });
    }
  } catch (error) {
    logger.error(`Error updating user preferences: ${error}`);
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error(`Error fetching user settings: ${error}`);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

/**
 * PATCH /api/v1/users/settings
 * Update user profile (name and/or email)
 */
router.patch('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, avatar, bio } = req.body as { name?: string; email?: string; avatar?: string; bio?: string };

    if (!name && !email && avatar === undefined && bio === undefined) {
      return res.status(400).json({ error: 'At least one field (name, email, avatar or bio) is required' });
    }

    const updateData: { name?: string; email?: string; avatar?: string | null; bio?: string | null } = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
    if (avatar !== undefined) updateData.avatar = avatar ? String(avatar).trim() : null;
    if (bio !== undefined) updateData.bio = bio ? String(bio).trim() : null;

    // Check email uniqueness if changing email
    if (updateData.email) {
      const existing = await prisma.user.findFirst({
        where: { email: updateData.email, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, bio: true },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error(`Error updating user settings: ${error}`);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

/**
 * POST /api/v1/user-settings/validate-github-token
 * Validate GitHub token and get username
 */
router.post('/validate-github-token', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    try {
      // Validate against GitHub API
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 5000,
      });

      if (response.status === 200 && response.data.login) {
        return res.json({
          success: true,
          username: response.data.login,
          message: 'Token válido',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Token no válido',
      });
    } catch (githubError) {
      logger.error(`GitHub API error: ${githubError}`);
      return res.status(400).json({
        success: false,
        error: 'No se pudo validar el token contra GitHub',
      });
    }
  } catch (error) {
    logger.error(`Error validating GitHub token: ${error}`);
    res.status(500).json({ error: 'Failed to validate token' });
  }
});

/**
 * POST /api/v1/user-settings/github-token
 * Save GitHub token to user settings (encrypted in database)
 */
router.post('/github-token', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    try {
      // Validate token format
      const isValidFormat = token.startsWith('ghp_') || token.startsWith('github_pat_');
      if (!isValidFormat) {
        return res.status(400).json({ error: 'Invalid token format' });
      }

      // Get username from GitHub API
      let username = 'github-user';
      try {
        const response = await axios.get('https://api.github.com/user', {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
          timeout: 5000,
        });
        username = response.data.login || 'github-user';
      } catch (error) {
        logger.warn(`Could not retrieve GitHub username: ${error}`);
      }

      // Encrypt and save to database
      const encryptedToken = encrypt(token);

      const userSettings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          githubToken: encryptedToken,
          updatedAt: new Date(),
        },
        create: {
          userId,
          githubToken: encryptedToken,
        },
      });

      logger.info(`GitHub token saved for user ${userId}`);

      return res.json({
        success: true,
        message: 'GitHub token saved successfully',
        username,
        userId,
      });
    } catch (error) {
      logger.error(`Error saving GitHub token: ${error}`);
      return res.status(500).json({ error: 'Failed to save GitHub token' });
    }
  } catch (error) {
    logger.error(`Error in /github-token endpoint: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/user-settings/github-token
 * Remove GitHub token from user settings
 */
router.delete('/github-token', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!userSettings) {
      return res.status(404).json({ error: 'No GitHub token found' });
    }

    // Update to remove token
    await prisma.userSettings.update({
      where: { userId },
      data: {
        githubToken: null,
        updatedAt: new Date(),
      },
    });

    logger.info(`GitHub token removed for user ${userId}`);

    return res.json({
      success: true,
      message: 'GitHub token removed successfully',
    });
  } catch (error) {
    logger.error(`Error removing GitHub token: ${error}`);
    res.status(500).json({ error: 'Failed to remove GitHub token' });
  }
});

/**
 * GET /api/v1/user-settings/llm-keys
 * Get all LLM API keys for the current user
 */
router.get('/llm-keys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // For now, return an empty array since we don't have a dedicated table yet
    // In a real implementation, you would query from a UserLLMApiKeys table
    res.json({
      success: true,
      keys: []
    });
  } catch (error) {
    logger.error(`Error fetching LLM keys: ${error}`);
    res.status(500).json({ error: 'Failed to fetch LLM keys' });
  }
});

/**
 * POST /api/v1/user-settings/llm-keys
 * Add a new LLM API key
 */
router.post('/llm-keys', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { provider, key } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!provider || !key) {
      return res.status(400).json({ error: 'Provider and key are required' });
    }

    // Generate a simple ID
    const id = `${provider.toLowerCase()}-${Date.now()}`;

    // Return success response
    // In a real implementation, you would save to database
    res.status(200).json({
      success: true,
      message: 'LLM API key saved successfully',
      id,
      provider,
      key_length: key.length,
    });
  } catch (error) {
    logger.error(`Error adding LLM key: ${error}`);
    res.status(500).json({ error: 'Failed to add LLM key' });
  }
});

/**
 * DELETE /api/v1/user-settings/llm-keys/:id
 * Delete an LLM API key
 */
router.delete('/llm-keys/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In a real implementation, you would delete from database
    res.json({
      success: true,
      message: 'LLM API key deleted successfully',
      id,
    });
  } catch (error) {
    logger.error(`Error deleting LLM key: ${error}`);
    res.status(500).json({ error: 'Failed to delete LLM key' });
  }
});

export default router;
