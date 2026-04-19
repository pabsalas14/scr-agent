/**
 * ============================================================================
 * FINDING LIFECYCLE API ROUTES (PHASE 3)
 * ============================================================================
 *
 * PUT    /api/v1/findings/:id/status           → Change finding status
 * GET    /api/v1/findings/:id/lifecycle        → Get lifecycle summary
 * GET    /api/v1/findings/:id/audit-trail      → Get audit trail
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import {
  changeStatus,
  getLifecycleSummary,
  getAuditTrail,
  FindingStatus,
} from '../services/finding-lifecycle.service';
import { logger } from '../services/logger.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * PUT /api/v1/findings/:id/status
 * Change finding status with validation
 */
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    // Validate status value
    if (!Object.values(FindingStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed: ${Object.values(FindingStatus).join(', ')}`,
      });
    }

    await changeStatus({
      findingId: id,
      newStatus: status,
      changedBy: userId,
      comment,
    });

    res.json({
      success: true,
      message: `Finding status changed to ${status}`,
    });
  } catch (error: any) {
    logger.error('Error changing finding status:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Error changing finding status',
    });
  }
});

/**
 * GET /api/v1/findings/:id/lifecycle
 * Get finding lifecycle summary
 */
router.get('/:id/lifecycle', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const lifecycle = await getLifecycleSummary(id);

    res.json({
      success: true,
      data: lifecycle,
    });
  } catch (error: any) {
    logger.error('Error fetching finding lifecycle:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Finding not found',
    });
  }
});

/**
 * GET /api/v1/findings/:id/audit-trail
 * Get audit trail for finding
 */
router.get('/:id/audit-trail', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const auditTrail = await getAuditTrail(id);

    res.json({
      success: true,
      data: auditTrail,
    });
  } catch (error: any) {
    logger.error('Error fetching audit trail:', error);
    res.status(404).json({
      success: false,
      error: error.message || 'Finding not found',
    });
  }
});

export default router;
