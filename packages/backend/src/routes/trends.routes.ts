/**
 * ============================================================================
 * TRENDS ROUTES - Endpoints para análisis de tendencias de riesgo
 * ============================================================================
 *
 * GET /api/trends/global             → Tendencia global de riesgo
 * GET /api/trends/project/:projectId → Tendencia de riesgo de proyecto
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { getGlobalRiskTrend, getProjectRiskTrend } from '../services/risk-trends.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/trends/global
 * Obtener tendencia de riesgo global
 */
router.get('/global', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'daily';

    const trend = await getGlobalRiskTrend({ days, interval });

    if (!trend) {
      return res.status(500).json({ success: false, error: 'Error obteniendo tendencia' });
    }

    res.json({ success: true, data: trend });
  } catch (error) {
    logger.error(`Error obteniendo global risk trend: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo tendencia global' });
  }
});

/**
 * GET /api/trends/project/:projectId
 * Obtener tendencia de riesgo de un proyecto
 */
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const interval = (req.query.interval as 'daily' | 'weekly' | 'monthly') || 'daily';

    const trend = await getProjectRiskTrend(req.params.projectId, { days, interval });

    if (!trend) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    res.json({ success: true, data: trend });
  } catch (error) {
    logger.error(`Error obteniendo project risk trend: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo tendencia de proyecto' });
  }
});

export default router;
