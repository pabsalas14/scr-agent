/**
 * ============================================================================
 * COMMENTS ROUTES - API REST para gestión de comentarios
 * ============================================================================
 *
 * Endpoints para crear, obtener, actualizar y eliminar comentarios con menciones
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { commentsService } from '../services/comments.service';
import { socketService } from '../services/socket.service';
import { logger } from '../services/logger.service';
import { prisma } from '../services/prisma.service';

const router: ExpressRouter = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * POST /api/v1/findings/:findingId/comments
 * Crear nuevo comentario en un hallazgo con soporte para @menciones
 */
router.post('/:findingId/comments', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { content, mentions = [] } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El contenido es requerido' });
    }

    // Crear comentario con menciones
    const comment = await commentsService.createComment({
      findingId: findingId!,
      userId: userId!,
      content,
      mentions,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error creando comentario:', error);
    res.status(500).json({ success: false, error: 'Error creando comentario' });
  }
});

/**
 * GET /api/v1/findings/:findingId/comments
 * Obtener todos los comentarios de un hallazgo
 */
router.get('/:findingId/comments', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    const comments = await commentsService.getCommentsByFinding(findingId!);

    res.json({ success: true, data: comments });
  } catch (error) {
    logger.error('Error obteniendo comentarios:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo comentarios' });
  }
});

/**
 * GET /api/v1/comments/:commentId
 * Obtener comentario por ID
 */
router.get('/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;

    const comment = await commentsService.getComment(commentId!);

    if (!comment) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    res.json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error obteniendo comentario:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo comentario' });
  }
});

/**
 * PUT /api/v1/findings/:findingId/comments/:commentId
 * Actualizar un comentario
 */
router.put('/:findingId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { findingId, commentId } = req.params;
    const { content, mentions = [] } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El contenido es requerido' });
    }

    // Verificar que el comentario existe y pertenece al hallazgo
    const comment = await prisma.comment.findUnique({
      where: { id: commentId! },
    });

    if (!comment || comment.findingId !== findingId) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    // Verificar que el usuario es el autor
    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    const updatedComment = await commentsService.updateComment({
      commentId: commentId!,
      content,
      mentions,
    });

    // Emitir evento WebSocket
    socketService.emitCommentUpdated(findingId!, commentId!, content);

    res.json({ success: true, data: updatedComment });
  } catch (error) {
    logger.error('Error actualizando comentario:', error);
    res.status(500).json({ success: false, error: 'Error actualizando comentario' });
  }
});

/**
 * DELETE /api/v1/findings/:findingId/comments/:commentId
 * Borrar un comentario
 */
router.delete('/:findingId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { findingId, commentId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    // Verificar que el comentario existe y pertenece al hallazgo
    const comment = await prisma.comment.findUnique({
      where: { id: commentId! },
    });

    if (!comment || comment.findingId !== findingId) {
      return res.status(404).json({ success: false, error: 'Comentario no encontrado' });
    }

    // Verificar que el usuario es el autor
    if (comment.userId !== userId) {
      return res.status(403).json({ success: false, error: 'No autorizado' });
    }

    await commentsService.deleteComment(commentId!);

    // Emitir evento WebSocket
    socketService.emitCommentDeleted(findingId!, commentId!);

    res.json({ success: true, message: 'Comentario borrado' });
  } catch (error) {
    logger.error('Error borrando comentario:', error);
    res.status(500).json({ success: false, error: 'Error borrando comentario' });
  }
});

/**
 * GET /api/v1/comments/mentions/unread
 * Obtener menciones no leídas del usuario actual
 */
router.get('/mentions/unread', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const mentions = await commentsService.getUnreadMentions(userId!);

    res.json({ success: true, data: mentions });
  } catch (error) {
    logger.error('Error obteniendo menciones no leídas:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo menciones' });
  }
});

/**
 * PUT /api/v1/comments/mentions/read
 * Marcar menciones como leídas
 */
router.put('/mentions/read', async (req: Request, res: Response) => {
  try {
    const { mentionIds = [] } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    if (!Array.isArray(mentionIds) || mentionIds.length === 0) {
      return res.status(400).json({ success: false, error: 'mentionIds es requerido' });
    }

    await commentsService.markMentionsAsRead(mentionIds);

    res.json({ success: true, message: 'Menciones marcadas como leídas' });
  } catch (error) {
    logger.error('Error marcando menciones como leídas:', error);
    res.status(500).json({ success: false, error: 'Error marcando menciones' });
  }
});

export default router;
