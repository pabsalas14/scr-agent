/**
 * ============================================================================
 * COMPARISON ROUTES - Endpoints para comparaciones
 * ============================================================================
 *
 * GET /api/comparison/users/:userId1/:userId2        → Comparar usuarios
 * GET /api/comparison/analyses/:id1/:id2             → Comparar análisis
 * GET /api/comparison/periods                        → Comparar periodos
 * GET /api/comparison/projects/:id1/:id2             → Comparar proyectos
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  compareUsers,
  compareAnalyses,
  comparePeriods,
  compareProjects,
} from '../services/comparison.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/comparison/users/:userId1/:userId2
 * Comparar dos usuarios
 */
router.get('/users/:userId1/:userId2', async (req: Request, res: Response) => {
  try {
    const { userId1, userId2 } = req.params;

    const comparison = await compareUsers(userId1, userId2);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'One or both users not found',
      });
    }

    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error(`Error comparando usuarios: ${error}`);
    res.status(500).json({ success: false, error: 'Error comparing users' });
  }
});

/**
 * GET /api/comparison/analyses/:analysisId1/:analysisId2
 * Comparar dos análisis
 */
router.get('/analyses/:analysisId1/:analysisId2', async (req: Request, res: Response) => {
  try {
    const { analysisId1, analysisId2 } = req.params;

    const comparison = await compareAnalyses(analysisId1, analysisId2);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'One or both analyses not found',
      });
    }

    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error(`Error comparando análisis: ${error}`);
    res.status(500).json({ success: false, error: 'Error comparing analyses' });
  }
});

/**
 * GET /api/comparison/periods
 * Comparar periodos de tiempo
 */
router.get('/periods', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string;
    const days1 = req.query.days1 ? parseInt(req.query.days1 as string) : 30;
    const days2 = req.query.days2 ? parseInt(req.query.days2 as string) : 7;

    if (!analysisId) {
      return res.status(400).json({
        success: false,
        error: 'analysisId is required',
      });
    }

    const comparison = await comparePeriods(analysisId, days1, days2);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found',
      });
    }

    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error(`Error comparando periodos: ${error}`);
    res.status(500).json({ success: false, error: 'Error comparing periods' });
  }
});

/**
 * GET /api/comparison/projects/:projectId1/:projectId2
 * Comparar dos proyectos
 */
router.get('/projects/:projectId1/:projectId2', async (req: Request, res: Response) => {
  try {
    const { projectId1, projectId2 } = req.params;

    const comparison = await compareProjects(projectId1, projectId2);

    if (!comparison) {
      return res.status(404).json({
        success: false,
        error: 'One or both projects not found',
      });
    }

    res.json({ success: true, data: comparison });
  } catch (error) {
    logger.error(`Error comparando proyectos: ${error}`);
    res.status(500).json({ success: false, error: 'Error comparing projects' });
  }
});

export default router;
