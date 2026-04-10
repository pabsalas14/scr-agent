/**
 * ============================================================================
 * REMEDIATION ROUTES - Endpoints para gestión de remediaciones
 * ============================================================================
 *
 * POST /api/remediation                → Crear remediación para hallazgo
 * PATCH /api/remediation/:id           → Actualizar estado/asignación
 * GET /api/remediation/:id             → Obtener detalles completos
 * POST /api/remediation/:id/comment    → Agregar comentario
 * GET /api/remediation/filter          → Listar con filtros
 * GET /api/remediation/stats           → Estadísticas
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createRemediation,
  updateRemediation,
  getRemediation,
  addComment,
  listRemediations,
  getRemediationStats,
} from '../services/remediation.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * POST /api/remediation
 * Crear remediación para un hallazgo
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { findingId, title, description, assigneeId, dueDate, priority } = req.body;

    if (!findingId) {
      res.status(400).json({ success: false, error: 'findingId es requerido' });
      return;
    }

    const remediation = await createRemediation({
      findingId,
      title,
      description,
      assigneeId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
    });

    res.status(201).json({ success: true, data: remediation });
  } catch (error) {
    logger.error(`Error creando remediación: ${error}`);
    res.status(500).json({ success: false, error: 'Error creando remediación' });
  }
});

/**
 * GET /api/remediation/:id
 * Obtener remediación completa
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const remediation = await getRemediation(req.params.id);

    if (!remediation) {
      res.status(404).json({ success: false, error: 'Remediación no encontrada' });
      return;
    }

    res.json({ success: true, data: remediation });
  } catch (error) {
    logger.error(`Error obteniendo remediación: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo remediación' });
  }
});

/**
 * PATCH /api/remediation/:id
 * Actualizar remediación
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { status, title, description, assigneeId, dueDate, priority, evidence, comment } =
      req.body;

    const remediation = await updateRemediation(req.params.id, {
      status,
      title,
      description,
      assigneeId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      priority,
      evidence,
      comment,
    });

    res.json({ success: true, data: remediation });
  } catch (error) {
    logger.error(`Error actualizando remediación: ${error}`);
    const message = (error as Error).message || 'Error actualizando remediación';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /api/remediation/:id/comment
 * Agregar comentario
 */
router.post('/:id/comment', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ success: false, error: 'Contenido es requerido' });
      return;
    }

    const comment = await addComment(req.params.id, userId, content);

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    logger.error(`Error agregando comentario: ${error}`);
    res.status(500).json({ success: false, error: 'Error agregando comentario' });
  }
});

/**
 * GET /api/remediation
 * Listar remediaciones con filtros
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const assigneeId = req.query.assigneeId as string | undefined;
    const overdue = req.query.overdue === 'true';
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await listRemediations({
      status: status as any,
      assigneeId,
      overdue,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: result.remediations,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.offset + result.remediations.length < result.total,
    });
  } catch (error) {
    logger.error(`Error listando remediaciones: ${error}`);
    res.status(500).json({ success: false, error: 'Error listando remediaciones' });
  }
});

/**
 * GET /api/remediation/stats
 * Estadísticas de remediación
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getRemediationStats();

    if (!stats) {
      res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
      return;
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error(`Error obteniendo stats: ${error}`);
    res.status(500).json({ success: false, error: 'Error obteniendo estadísticas' });
  }
});

export default router;
