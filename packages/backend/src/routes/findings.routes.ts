import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { findingsService } from '../services/findings.service';
import { usersService } from '../services/users.service';
import { notificationsService } from '../services/notifications.service';
import { socketService } from '../services/socket.service';
import { logger } from '../services/logger.service';

const router: ExpressRouter = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * GET /api/v1/findings/analysis/:analysisId
 * Get all findings for an analysis
 */
router.get('/analysis/:analysisId', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const pageParam = req.query['page'] as string | undefined;

    if (pageParam) {
      const page = Math.max(1, parseInt(pageParam) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 50));
      const result = await findingsService.getFindings(analysisId!, { page, limit });
      res.json({ success: true, ...(result as object) });
    } else {
      const findings = await findingsService.getFindings(analysisId!);
      res.json({ success: true, data: findings });
    }
  } catch (error) {
    logger.error('Error fetching findings:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching findings',
    });
  }
});

/**
 * GET /api/v1/findings/:findingId
 * Get finding detail with full history
 */
router.get('/:findingId', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const finding = await findingsService.getFindingDetail(findingId!);

    if (!finding) {
      return res.status(404).json({
        success: false,
        error: 'Finding not found',
      });
    }

    res.json({
      success: true,
      data: finding,
    });
  } catch (error) {
    logger.error('Error fetching finding detail:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching finding',
    });
  }
});

/**
 * PUT /api/v1/findings/:findingId/status
 * Update finding status with history tracking
 */
router.put('/:findingId/status', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { status, note } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }

    // Validate status
    const validStatuses = [
      'DETECTED',
      'IN_REVIEW',
      'IN_CORRECTION',
      'CORRECTED',
      'VERIFIED',
      'FALSE_POSITIVE',
      'CLOSED',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const updated = await findingsService.updateFindingStatus(
      findingId!,
      status as any,
      userId!,
      note
    );

    // Get user info for notification
    const user = await usersService.getUserDetail(userId);

    // Get finding's assigned user for notification
    if ((updated as any).assignment?.assignedTo) {
      await notificationsService.notifyFindingStatusChange(
        (updated as any).assignment.assignedTo,
        findingId!,
        status as any,
        (user as any)?.name || (user as any)?.email || 'Sistema'
      );

      // Emit WebSocket event for real-time update
      socketService.emitFindingStatusChanged(
        findingId!,
        status,
        (updated as any).assignment.assignedTo
      );
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    logger.error('Error updating finding status:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating finding status',
    });
  }
});

/**
 * POST /api/v1/findings/:findingId/assign
 * Assign finding to a user
 */
router.post('/:findingId/assign', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { assignedTo } = req.body;
    const userId = (req as any).user?.id;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        error: 'assignedTo is required',
      });
    }

    const assignment = await findingsService.assignFinding(findingId!, assignedTo);

    // Get assigner info for notification
    const assigner = userId ? await usersService.getUserDetail(userId) : null;

    // Notify assigned user
    await notificationsService.notifyFindingAssignment(
      assignedTo,
      findingId!,
      (assigner as any)?.name || (assigner as any)?.email || 'Sistema'
    );

    // Emit WebSocket event for real-time update
    socketService.emitFindingAssigned(
      findingId!,
      assignedTo,
      userId || 'Sistema'
    );

    res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    logger.error('Error assigning finding:', error);
    res.status(500).json({
      success: false,
      error: 'Error assigning finding',
    });
  }
});

/**
 * DELETE /api/v1/findings/:findingId/assign
 * Unassign finding from user
 */
router.delete('/:findingId/assign', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    await findingsService.unassignFinding(findingId!);

    res.json({
      success: true,
      message: 'Finding unassigned successfully',
    });
  } catch (error) {
    logger.error('Error unassigning finding:', error);
    res.status(500).json({
      success: false,
      error: 'Error unassigning finding',
    });
  }
});

/**
 * GET /api/v1/findings/:findingId/remediation
 * Get remediation details for a finding
 */
router.get('/:findingId/remediation', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const remediation = await findingsService.getRemediationDetail(findingId!);

    res.json({
      success: true,
      data: remediation,
    });
  } catch (error) {
    logger.error('Error fetching remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching remediation',
    });
  }
});

/**
 * POST /api/v1/findings/:findingId/remediation
 * Create or update remediation entry
 */
router.post('/:findingId/remediation', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { correctionNotes, proofOfFixUrl, status } = req.body;
    const userId = (req as any).user?.id;

    if (!correctionNotes && !proofOfFixUrl) {
      return res.status(400).json({
        success: false,
        error: 'At least correctionNotes or proofOfFixUrl is required',
      });
    }

    const remediation = await findingsService.createOrUpdateRemediation(
      findingId!,
      {
        correctionNotes,
        proofOfFixUrl,
        status: (status || 'IN_PROGRESS') as any,
      }
    );

    // Get user info for notification
    const user = userId ? await usersService.getUserDetail(userId) : null;

    // Get finding's assigned user for notification
    const finding = await findingsService.getFindingDetail(findingId!);
    if ((finding as any)?.assignment?.assignedTo && user) {
      await notificationsService.notifyRemediationUpdate(
        (finding as any).assignment.assignedTo,
        findingId!,
        'IN_PROGRESS' as any,
        (user as any)?.name || (user as any)?.email || 'Sistema'
      );

      // Emit WebSocket event for real-time update
      socketService.emitRemediationUpdated(
        findingId!,
        (finding as any).assignment.assignedTo
      );
    }

    res.json({
      success: true,
      data: remediation,
    });
  } catch (error) {
    logger.error('Error creating/updating remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing remediation',
    });
  }
});

/**
 * PUT /api/v1/findings/:findingId/remediation/verify
 * Verify remediation as complete
 */
router.put('/:findingId/remediation/verify', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { verificationNotes } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const remediation = await findingsService.createOrUpdateRemediation(
      findingId!,
      {
        status: 'VERIFIED' as any,
        verifiedAt: new Date(),
        verificationNotes,
      }
    );

    // Update finding status to VERIFIED
    const user = await usersService.getUserDetail(userId!);
    await findingsService.updateFindingStatus(
      findingId!,
      'VERIFIED' as any,
      userId!,
      'Remediación verificada'
    );

    // Notify assigned user
    const finding = await findingsService.getFindingDetail(findingId!);
    if ((finding as any)?.assignment?.assignedTo) {
      await notificationsService.notifyRemediationVerified(
        (finding as any).assignment.assignedTo,
        findingId!,
        (user as any)?.name || (user as any)?.email || 'Sistema'
      );

      // Emit WebSocket event for real-time update
      socketService.emitRemediationVerified(
        findingId!,
        (finding as any).assignment.assignedTo
      );
    }

    res.json({
      success: true,
      data: remediation,
    });
  } catch (error) {
    logger.error('Error verifying remediation:', error);
    res.status(500).json({
      success: false,
      error: 'Error verifying remediation',
    });
  }
});

/**
 * GET /api/v1/findings/analysis/:analysisId/stats
 * Get findings statistics for an analysis
 */
router.get('/analysis/:analysisId/stats', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const stats = await findingsService.getFindingsStats(analysisId!);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching findings stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching stats',
    });
  }
});

export default router;
