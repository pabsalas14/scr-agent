/**
 * ============================================================================
 * COMMENTS ROUTES - API REST para gestión de comentarios
 * ============================================================================
 *
 * Endpoints para crear, obtener, actualizar y eliminar comentarios en hallazgos
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
 * Create a new comment on a finding
 */
router.post('/:findingId/comments', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    // Create comment
    const comment = await commentsService.createComment({
      findingId: findingId!,
      userId: userId!,
      content,
    });

    // Get interested users for notification
    const interestedUsers = await commentsService.getInterestedUsers(findingId!);

    // Emit real-time event
    const userName = comment.user?.name || comment.user?.email || 'Usuario';
    socketService.emitCommentAdded(
      findingId!,
      comment.id,
      userId!,
      userName,
      content,
      interestedUsers
    );

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating comment',
    });
  }
});

/**
 * GET /api/v1/findings/:findingId/comments
 * Get all comments for a finding
 */
router.get('/:findingId/comments', async (req: Request, res: Response) => {
  try {
    const { findingId } = req.params;

    const comments = await commentsService.getCommentsByFinding(findingId!);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    logger.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching comments',
    });
  }
});

/**
 * DELETE /api/v1/findings/:findingId/comments/:commentId
 * Delete a comment
 */
router.delete('/:findingId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { findingId, commentId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    // Verify comment belongs to this finding and user is the author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId! },
    });

    if (!comment || comment.findingId !== findingId) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this comment',
      });
    }

    await commentsService.deleteComment(commentId!);

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting comment',
    });
  }
});

/**
 * PUT /api/v1/findings/:findingId/comments/:commentId
 * Update a comment
 */
router.put('/:findingId/comments/:commentId', async (req: Request, res: Response) => {
  try {
    const { findingId, commentId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    // Verify comment belongs to this finding and user is the author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId! },
    });

    if (!comment || comment.findingId !== findingId) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found',
      });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this comment',
      });
    }

    const updatedComment = await commentsService.updateComment(commentId!, content);

    res.json({
      success: true,
      data: updatedComment,
    });
  } catch (error) {
    logger.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating comment',
    });
  }
});

export default router;
