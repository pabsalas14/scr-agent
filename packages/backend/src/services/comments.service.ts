/**
 * ============================================================================
 * COMMENTS SERVICE
 * ============================================================================
 *
 * Gestiona comentarios en hallazgos con soporte para @menciones y notificaciones
 */

import { prisma } from './prisma.service';
import { socketService } from './socket.service';
import { logger } from './logger.service';

interface CreateCommentInput {
  findingId: string;
  userId: string;
  content: string;
  mentions?: string[]; // ["@user1@email.com", "@user2@email.com"]
}

interface UpdateCommentInput {
  commentId: string;
  content: string;
  mentions?: string[];
}

export class CommentsService {
  /**
   * Crear nuevo comentario en un hallazgo con soporte para menciones
   */
  async createComment(input: CreateCommentInput): Promise<any> {
    try {
      const { findingId, userId, content, mentions = [] } = input;

      // Validar que el hallazgo existe
      const finding = await prisma.finding.findUnique({
        where: { id: findingId },
        include: { analysis: { include: { project: true } } },
      });

      if (!finding) {
        throw new Error(`Finding ${findingId} not found`);
      }

      // Obtener usuario
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Crear comentario
      const comment = await prisma.comment.create({
        data: {
          findingId,
          userId,
          content,
          mentions,
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

      // Crear notificaciones para menciones
      if (mentions.length > 0) {
        await this.createMentionNotifications(comment.id, mentions, userId);
      }

      // Emitir evento WebSocket
      socketService.emitCommentAdded(
        findingId,
        comment.id,
        userId,
        user.name || user.email,
        content,
        mentions
      );

      logger.info(`Comentario creado: ${comment.id} en hallazgo ${findingId}`);

      return comment;
    } catch (error) {
      logger.error('Error creando comentario:', error);
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
          mentionNotifications: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return comments;
    } catch (error) {
      logger.error('Error obteniendo comentarios:', error);
      throw error;
    }
  }

  /**
   * Obtener comentario por ID
   */
  async getComment(commentId: string): Promise<any> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mentionNotifications: {
            include: {
              mentionedUser: {
                select: { id: true, email: true, name: true },
              },
            },
          },
        },
      });

      return comment;
    } catch (error) {
      logger.error('Error obteniendo comentario:', error);
      throw error;
    }
  }

  /**
   * Actualizar comentario
   */
  async updateComment(input: UpdateCommentInput): Promise<any> {
    try {
      const { commentId, content, mentions = [] } = input;

      // Obtener comentario actual
      const currentComment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { finding: { include: { analysis: { include: { project: true } } } } },
      });

      if (!currentComment) {
        throw new Error(`Comment ${commentId} not found`);
      }

      // Actualizar comentario
      const updated = await prisma.comment.update({
        where: { id: commentId },
        data: {
          content,
          mentions,
          // Limpiar menciones antiguas
          mentionNotifications: {
            deleteMany: {},
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          mentionNotifications: true,
        },
      });

      // Crear nuevas notificaciones de menciones
      if (mentions.length > 0) {
        await this.createMentionNotifications(
          commentId,
          mentions,
          currentComment.userId
        );
      }

      logger.info(`Comentario actualizado: ${commentId}`);

      return updated;
    } catch (error) {
      logger.error('Error actualizando comentario:', error);
      throw error;
    }
  }

  /**
   * Borrar comentario
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        include: { finding: { include: { analysis: { include: { project: true } } } } },
      });

      if (!comment) {
        throw new Error(`Comment ${commentId} not found`);
      }

      // Borrar comentario (cascade elimina mentionNotifications)
      await prisma.comment.delete({
        where: { id: commentId },
      });

      logger.info(`Comentario borrado: ${commentId}`);
    } catch (error) {
      logger.error('Error borrando comentario:', error);
      throw error;
    }
  }

  /**
   * Marcar menciones como leídas
   */
  async markMentionsAsRead(mentionIds: string[]): Promise<any> {
    try {
      const updated = await prisma.commentMention.updateMany({
        where: { id: { in: mentionIds } },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return updated;
    } catch (error) {
      logger.error('Error marcando menciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Obtener menciones no leídas de un usuario
   */
  async getUnreadMentions(userId: string): Promise<any[]> {
    try {
      const mentions = await prisma.commentMention.findMany({
        where: {
          mentionedUserId: userId,
          read: false,
        },
        include: {
          comment: {
            include: {
              finding: {
                select: { id: true, file: true, severity: true },
              },
              user: {
                select: { id: true, email: true, name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return mentions;
    } catch (error) {
      logger.error('Error obteniendo menciones no leídas:', error);
      throw error;
    }
  }

  /**
   * Crear notificaciones para usuarios mencionados
   */
  private async createMentionNotifications(
    commentId: string,
    mentions: string[],
    mentionerUserId: string
  ): Promise<void> {
    try {
      // Extraer emails de menciones (e.g., "@user@example.com" → "user@example.com")
      const mentionedEmails = mentions
        .map((m) => m.replace(/@/g, '').trim())
        .filter((m) => m.includes('@')); // Validar que sean emails

      if (mentionedEmails.length === 0) return;

      // Buscar usuarios por email
      const mentionedUsers = await prisma.user.findMany({
        where: {
          email: { in: mentionedEmails },
          NOT: { id: mentionerUserId }, // No notificar al que escribió
        },
        select: { id: true, email: true },
      });

      // Crear notificaciones
      if (mentionedUsers.length > 0) {
        await prisma.commentMention.createMany({
          data: mentionedUsers.map((user) => ({
            commentId,
            mentionedUserId: user.id,
            read: false,
          })),
        });

        // Emitir eventos WebSocket para cada usuario mencionado
        for (const user of mentionedUsers) {
          socketService.emitCommentMentioned(commentId, user.id);
        }
      }
    } catch (error) {
      logger.error('Error creando notificaciones de mención:', error);
      // No lanzar error, solo loguear para no romper el flow
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
