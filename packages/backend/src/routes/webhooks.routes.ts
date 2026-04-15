/**
 * ============================================================================
 * WEBHOOKS ROUTES
 * ============================================================================
 *
 * GET /api/v1/webhooks                      → Get all webhooks
 * POST /api/v1/webhooks                     → Create new webhook
 * GET /api/v1/webhooks/:id                  → Get webhook by ID
 * PUT /api/v1/webhooks/:id                  → Update webhook
 * DELETE /api/v1/webhooks/:id               → Delete webhook
 * POST /api/v1/webhooks/:id/test            → Test webhook delivery
 * GET /api/v1/webhooks/:id/deliveries       → Get delivery history
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { webhooksService } from '../services/webhooks.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/v1/webhooks
 * Get all webhooks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const webhooks = await webhooksService.getAll();
    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    logger.error(`Error fetching webhooks: ${error}`);
    res.status(500).json({ success: false, error: 'Error fetching webhooks' });
  }
});

/**
 * POST /api/v1/webhooks
 * Create new webhook
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { url, events, headers } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ success: false, error: 'Events array is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL' });
    }

    const webhook = await webhooksService.create({
      url,
      events,
      headers,
    });

    res.status(201).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    logger.error(`Error creating webhook: ${error}`);
    res.status(500).json({ success: false, error: 'Error creating webhook' });
  }
});

/**
 * GET /api/v1/webhooks/:id
 * Get webhook by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const webhook = await webhooksService.getById(id);

    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    logger.error(`Error fetching webhook: ${error}`);
    res.status(500).json({ success: false, error: 'Error fetching webhook' });
  }
});

/**
 * PUT /api/v1/webhooks/:id
 * Update webhook
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { url, events, status, headers } = req.body;

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid URL' });
      }
    }

    const webhook = await webhooksService.update(id, {
      url,
      events,
      status,
      headers,
    });

    res.json({
      success: true,
      data: webhook,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }
    logger.error(`Error updating webhook: ${error}`);
    res.status(500).json({ success: false, error: 'Error updating webhook' });
  }
});

/**
 * DELETE /api/v1/webhooks/:id
 * Delete webhook
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await webhooksService.delete(id);

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }
    logger.error(`Error deleting webhook: ${error}`);
    res.status(500).json({ success: false, error: 'Error deleting webhook' });
  }
});

/**
 * POST /api/v1/webhooks/:id/test
 * Test webhook delivery
 */
router.post('/:id/test', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await webhooksService.testWebhook(id);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Webhook not found') {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }
    logger.error(`Error testing webhook: ${error}`);
    res.status(500).json({ success: false, error: 'Error testing webhook' });
  }
});

/**
 * GET /api/v1/webhooks/:id/deliveries
 * Get delivery history
 */
router.get('/:id/deliveries', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify webhook exists
    const webhook = await webhooksService.getById(id);
    if (!webhook) {
      return res.status(404).json({ success: false, error: 'Webhook not found' });
    }

    const deliveries = await webhooksService.getDeliveryHistory(id, Math.min(limit, 200));

    res.json({
      success: true,
      data: deliveries,
    });
  } catch (error) {
    logger.error(`Error fetching deliveries: ${error}`);
    res.status(500).json({ success: false, error: 'Error fetching deliveries' });
  }
});

export default router;
