/**
 * ============================================================================
 * ALERT RULES API ROUTES (PHASE 2.5)
 * ============================================================================
 *
 * GET    /api/v1/alert-rules              → Get all rules for user
 * POST   /api/v1/alert-rules              → Create new rule
 * GET    /api/v1/alert-rules/:id          → Get specific rule
 * PUT    /api/v1/alert-rules/:id          → Update rule
 * DELETE /api/v1/alert-rules/:id          → Delete rule
 * GET    /api/v1/alert-rules/:id/triggers → Get triggers for rule
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/v1/alert-rules
 * Get all alert rules for current user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const rules = await prisma.alertRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    logger.error('Error fetching alert rules:', error);
    res.status(500).json({ success: false, error: 'Error fetching alert rules' });
  }
});

/**
 * POST /api/v1/alert-rules
 * Create new alert rule
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const {
      name,
      description,
      severityThreshold,
      findingCountMin,
      findingCountMax,
      riskTypeFilter,
      filePatternFilter,
      notificationChannel,
      webhookUrl,
      enabled,
    } = req.body;

    // Validate required fields
    if (!name || !severityThreshold || !notificationChannel) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, severityThreshold, notificationChannel',
      });
    }

    // Validate severity
    const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (!validSeverities.includes(severityThreshold)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid severity threshold',
      });
    }

    // Validate notification channel
    const validChannels = ['webhook', 'email', 'slack', 'in_app'];
    if (!validChannels.includes(notificationChannel)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid notification channel',
      });
    }

    const rule = await prisma.alertRule.create({
      data: {
        userId,
        name,
        description,
        severityThreshold,
        findingCountMin: findingCountMin || 1,
        findingCountMax,
        riskTypeFilter,
        filePatternFilter,
        notificationChannel,
        webhookUrl,
        enabled: enabled !== false, // Default to true
      },
    });

    logger.info(`Alert rule created: ${name} by ${userId}`);

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error('Error creating alert rule:', error);
    res.status(500).json({ success: false, error: 'Error creating alert rule' });
  }
});

/**
 * GET /api/v1/alert-rules/:id
 * Get specific alert rule
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const rule = await prisma.alertRule.findFirst({
      where: { id, userId },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    logger.error('Error fetching alert rule:', error);
    res.status(500).json({ success: false, error: 'Error fetching alert rule' });
  }
});

/**
 * PUT /api/v1/alert-rules/:id
 * Update alert rule
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.alertRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    const {
      name,
      description,
      severityThreshold,
      findingCountMin,
      findingCountMax,
      riskTypeFilter,
      filePatternFilter,
      notificationChannel,
      webhookUrl,
      enabled,
    } = req.body;

    const updated = await prisma.alertRule.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(severityThreshold && { severityThreshold }),
        ...(findingCountMin !== undefined && { findingCountMin }),
        ...(findingCountMax !== undefined && { findingCountMax }),
        ...(riskTypeFilter !== undefined && { riskTypeFilter }),
        ...(filePatternFilter !== undefined && { filePatternFilter }),
        ...(notificationChannel && { notificationChannel }),
        ...(webhookUrl !== undefined && { webhookUrl }),
        ...(enabled !== undefined && { enabled }),
      },
    });

    logger.info(`Alert rule updated: ${id} by ${userId}`);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error updating alert rule:', error);
    res.status(500).json({ success: false, error: 'Error updating alert rule' });
  }
});

/**
 * DELETE /api/v1/alert-rules/:id
 * Delete alert rule
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check ownership
    const existing = await prisma.alertRule.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    await prisma.alertRule.delete({
      where: { id },
    });

    logger.info(`Alert rule deleted: ${id} by ${userId}`);

    res.json({
      success: true,
      message: 'Alert rule deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting alert rule:', error);
    res.status(500).json({ success: false, error: 'Error deleting alert rule' });
  }
});

/**
 * GET /api/v1/alert-rules/:id/triggers
 * Get triggers history for a rule
 */
router.get('/:id/triggers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Check ownership
    const rule = await prisma.alertRule.findFirst({
      where: { id, userId },
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Alert rule not found',
      });
    }

    const triggers = await prisma.alertTrigger.findMany({
      where: { ruleId_actual: id },
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 triggers
    });

    res.json({
      success: true,
      data: {
        ruleId: id,
        totalTriggers: rule.triggeredCount,
        lastTriggered: rule.lastTriggeredAt,
        recentTriggers: triggers,
      },
    });
  } catch (error) {
    logger.error('Error fetching alert triggers:', error);
    res.status(500).json({ success: false, error: 'Error fetching alert triggers' });
  }
});

export default router;
