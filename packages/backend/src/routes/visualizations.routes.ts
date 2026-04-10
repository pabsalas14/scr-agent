/**
 * ============================================================================
 * VISUALIZATIONS ROUTES - Endpoints para visualizaciones y mapas de calor
 * ============================================================================
 *
 * GET /api/visualizations/heatmap/temporal        → Heatmap temporal (tiempo)
 * GET /api/visualizations/heatmap/files           → Heatmap de archivos
 * GET /api/visualizations/heatmap/authors         → Heatmap de autores
 * GET /api/visualizations/risk-map                → Mapa de riesgo
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getTemporalHeatmap,
  getFileHeatmap,
  getAuthorHeatmap,
  getRiskMap,
} from '../services/heatmap.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/visualizations/heatmap/temporal
 * Heatmap temporal: riesgo por fecha y hora del día
 */
router.get('/heatmap/temporal', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string | undefined;
    const userId = req.query.userId as string | undefined;
    const days = req.query.days ? parseInt(req.query.days as string) : undefined;

    const heatmap = await getTemporalHeatmap({
      analysisId,
      userId,
      days,
    });

    res.json({ success: true, data: heatmap });
  } catch (error) {
    logger.error(`Error getting temporal heatmap: ${error}`);
    res.status(500).json({ success: false, error: 'Error generating heatmap' });
  }
});

/**
 * GET /api/visualizations/heatmap/files
 * Heatmap de archivos: riesgo por archivo
 */
router.get('/heatmap/files', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const heatmap = await getFileHeatmap({
      analysisId,
      limit,
    });

    res.json({ success: true, data: heatmap });
  } catch (error) {
    logger.error(`Error getting file heatmap: ${error}`);
    res.status(500).json({ success: false, error: 'Error generating heatmap' });
  }
});

/**
 * GET /api/visualizations/heatmap/authors
 * Heatmap de autores: riesgo por usuario
 */
router.get('/heatmap/authors', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const heatmap = await getAuthorHeatmap({
      analysisId,
      limit,
    });

    res.json({ success: true, data: heatmap });
  } catch (error) {
    logger.error(`Error getting author heatmap: ${error}`);
    res.status(500).json({ success: false, error: 'Error generating heatmap' });
  }
});

/**
 * GET /api/visualizations/risk-map
 * Mapa de riesgo: matriz de severidad vs probabilidad
 */
router.get('/risk-map', async (req: Request, res: Response) => {
  try {
    const analysisId = req.query.analysisId as string | undefined;

    const riskMap = await getRiskMap(analysisId);

    res.json({ success: true, data: riskMap });
  } catch (error) {
    logger.error(`Error getting risk map: ${error}`);
    res.status(500).json({ success: false, error: 'Error generating risk map' });
  }
});

export default router;
