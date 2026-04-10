/**
 * ============================================================================
 * TIMELINE ROUTES - Endpoints para timeline visualization
 * ============================================================================
 *
 * GET /api/timeline/analysis/:analysisId      → Timeline de análisis
 * GET /api/timeline/user/:userId/activity      → Timeline de actividad de usuario
 * GET /api/timeline/remediation               → Timeline de remediaciones
 * GET /api/timeline/stats                     → Estadísticas de período
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getAnalysisTimeline,
  getUserActivityTimeline,
  getRemediationTimeline,
  getTimelineStats,
} from '../services/timeline-visualization.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/timeline/analysis/:analysisId
 * Obtener timeline de eventos de un análisis
 */
router.get('/analysis/:analysisId', async (req: Request, res: Response) => {
  try {
    const timeline = await getAnalysisTimeline(req.params.analysisId);

    if (!timeline) {
      return res.status(404).json({ success: false, error: 'Análisis no encontrado' });
    }

    res.json({ success: true, data: timeline });
  } catch (error) {
    logger.error(`Error obteniendo analysis timeline: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo timeline' });
  }
});

/**
 * GET /api/timeline/user/:userId/activity
 * Obtener timeline de actividad de usuario
 */
router.get('/user/:userId/activity', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const severity = req.query.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const timeline = await getUserActivityTimeline(req.params.userId, {
      limit,
      severity,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: timeline,
      count: timeline.length,
      limit,
    });
  } catch (error) {
    logger.error(`Error obteniendo user activity timeline: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo timeline de actividad' });
  }
});

/**
 * GET /api/timeline/remediation
 * Obtener timeline de remediaciones con filtros
 */
router.get('/remediation', async (req: Request, res: Response) => {
  try {
    const findingId = req.query.findingId as string | undefined;
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    const timeline = await getRemediationTimeline({
      findingId,
      userId,
      status,
      limit,
    });

    res.json({
      success: true,
      data: timeline,
      count: timeline.length,
      limit,
    });
  } catch (error) {
    logger.error(`Error obteniendo remediation timeline: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo timeline de remediaciones' });
  }
});

/**
 * GET /api/timeline/stats
 * Obtener estadísticas de timeline para período
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const projectId = req.query.projectId as string | undefined;

    const stats = await getTimelineStats({
      startDate,
      endDate,
      projectId,
    });

    if (!stats) {
      return res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error(`Error obteniendo timeline stats: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
  }
});

export default router;
