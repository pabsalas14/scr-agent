/**
 * ============================================================================
 * COMMENTS SERVICE - Gestión de comentarios en hallazgos
 * ============================================================================
 *
 * Servicio para crear, obtener y gestionar comentarios asociados a hallazgos
 */

import { prisma } from './prisma.service';
import { logger } from './logger.service';

export class CommentsService {
  /**
   * Crear un nuevo comentario
   */
  async createComment(input: {
    findingId: string;
    userId: string;
    content: string;
  }): Promise<any> {
    try {
      const comment = await prisma.comment.create({
        data: {
          findingId: input.findingId,
          userId: input.userId,
          content: input.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Comment created: ${comment.id} for finding ${input.findingId}`);
      return comment;
    } catch (error) {
      logger.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Obtener comentarios de un hallazgo
   */
  async getCommentsByFinding(findingId: string): Promise<any[]> {
    try {
      const comments = await prisma.comment.findMany({
        where: { findingId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return comments;
    } catch (error) {
      logger.error('Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Eliminar un comentario
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      await prisma.comment.delete({
        where: { id: commentId },
      });

      logger.info(`Comment deleted: ${commentId}`);
    } catch (error) {
      logger.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Actualizar un comentario
   */
  async updateComment(commentId: string, content: string): Promise<any> {
    try {
      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Comment updated: ${commentId}`);
      return comment;
    } catch (error) {
      logger.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Obtener usuarios interesados en un hallazgo (asignado y usuarios que comentaron)
   */
  async getInterestedUsers(findingId: string): Promise<string[]> {
    try {
      const finding = await prisma.finding.findUnique({
        where: { id: findingId },
        include: {
          assignment: {
            select: { assignedTo: true },
          },
          comments: {
            select: { userId: true },
            distinct: ['userId'],
          },
        },
      });

      if (!finding) return [];

      const interestedUsers = new Set<string>();

      if (finding.assignment?.assignedTo) {
        interestedUsers.add(finding.assignment.assignedTo);
      }

      finding.comments.forEach((comment) => {
        interestedUsers.add(comment.userId);
      });

      return Array.from(interestedUsers);
    } catch (error) {
      logger.error('Error getting interested users:', error);
      throw error;
    }
  }
}

export const commentsService = new CommentsService();
