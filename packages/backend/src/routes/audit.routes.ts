/**
 * ============================================================================
 * AUDIT ROUTES - Endpoints para ver historial de auditoría
 * ============================================================================
 *
 * GET /api/v1/audit                    → Mis acciones
 * GET /api/v1/audit/resources/:type/:id → Auditoría de recurso
 * GET /api/v1/audit/summary            → Resumen de actividad del sistema
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { getUserAuditLogs, getResourceAuditLogs, getActivitySummary } from '../services/audit.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/v1/audit
 * Obtener mis propios logs de auditoría
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const action = req.query.action as string | undefined;
    const resourceType = req.query.resourceType as string | undefined;

    const result = await getUserAuditLogs(userId, {
      limit,
      offset,
      action,
      resourceType,
    });

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.offset + result.logs.length < result.total,
    });
  } catch (error) {
    logger.error(`Error obteniendo audit logs: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener logs de auditoría' });
  }
});

/**
 * GET /api/v1/audit/resources/:resourceType/:resourceId
 * Obtener historial de auditoría para un recurso específico
 */
router.get('/resources/:resourceType/:resourceId', async (req: Request, res: Response) => {
  try {
    const { resourceType, resourceId } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await getResourceAuditLogs(resourceType, resourceId, {
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result.logs,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.offset + result.logs.length < result.total,
    });
  } catch (error) {
    logger.error(`Error obteniendo resource audit logs: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener historial del recurso' });
  }
});

/**
 * GET /api/v1/audit/summary
 * Obtener resumen de actividad del sistema (solo admin)
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    // Restricción: solo admin puede ver resumen del sistema
    if (userRole !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Acceso denegado: solo admin' });
      return;
    }

    const days = parseInt(req.query.days as string) || 7;

    const summary = await getActivitySummary({ days });

    if (!summary) {
      res.status(500).json({ success: false, error: 'Error obteniendo resumen' });
      return;
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error(`Error obteniendo activity summary: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener resumen' });
  }
});

export default router;
