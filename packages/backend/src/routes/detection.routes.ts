/**
 * ============================================================================
 * DETECTION ROUTES - Endpoints para detección de amenazas avanzadas
 * ============================================================================
 *
 * POST /api/detection/apt/:userId         → Detectar APT threat para usuario
 * GET /api/detection/apt/scan              → Scan de amenazas APT globales
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { detectAPTThreat, detectMultipleAPTThreats } from '../services/apt-detection.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/detection/apt/:userId
 * Detectar amenaza APT para usuario específico
 */
router.get('/apt/:userId', async (req: Request, res: Response) => {
  try {
    const threat = await detectAPTThreat(req.params.userId);

    if (!threat) {
      return res.json({
        success: true,
        data: null,
        message: 'No APT threat detected for this user',
      });
    }

    res.json({ success: true, data: threat });
  } catch (error) {
    logger.error(`Error detectando APT threat: ${error}`);
    res.status(500).json({ success: false, error: 'Error detectando amenaza APT' });
  }
});

/**
 * GET /api/detection/apt
 * Escanear amenazas APT en todos los usuarios
 */
router.get('/apt', async (req: Request, res: Response) => {
  try {
    const minConfidence = parseInt(req.query.minConfidence as string) || 60;
    const threatLevel = req.query.threatLevel as 'CRITICAL' | 'HIGH' | 'MEDIUM' | undefined;

    const threats = await detectMultipleAPTThreats({
      minConfidence,
      threatLevel,
    });

    res.json({
      success: true,
      data: threats,
      count: threats.length,
      filter: { minConfidence, threatLevel },
    });
  } catch (error) {
    logger.error(`Error escaneando APT threats: ${error}`);
    res.status(500).json({ success: false, error: 'Error escaneando amenazas' });
  }
});

export default router;
