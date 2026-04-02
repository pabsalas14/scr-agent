/**
 * ============================================================================
 * COMMENTS SERVICE - Cliente para gestión de comentarios
 * ============================================================================
 *
 * Servicio para crear, obtener y gestionar comentarios en hallazgos
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';

export interface Comment {
  id: string;
  findingId: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  content: string;
  mentions?: string[];
  mentionNotifications?: CommentMention[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentMention {
  id: string;
  commentId: string;
  mentionedUserId: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
  comment?: Comment & {
    finding: { id: string; file: string; severity: string };
    user: { id: string; email: string; name: string | null };
  };
}

class CommentsService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Crear un nuevo comentario con soporte para @menciones
   */
  async createComment(findingId: string, content: string, mentions?: string[]): Promise<Comment> {
    const response = await this.client.post(`/findings/${findingId}/comments`, {
      content,
      mentions: mentions || [],
    });
    return response.data.data;
  }

  /**
   * Obtener comentarios de un hallazgo
   */
  async getComments(findingId: string): Promise<Comment[]> {
    const response = await this.client.get(`/findings/${findingId}/comments`);
    return response.data.data || [];
  }

  /**
   * Eliminar un comentario
   */
  async deleteComment(findingId: string, commentId: string): Promise<void> {
    await this.client.delete(`/findings/${findingId}/comments/${commentId}`);
  }

  /**
   * Actualizar un comentario con soporte para @menciones
   */
  async updateComment(findingId: string, commentId: string, content: string, mentions?: string[]): Promise<Comment> {
    const response = await this.client.put(`/findings/${findingId}/comments/${commentId}`, {
      content,
      mentions: mentions || [],
    });
    return response.data.data;
  }

  /**
   * Obtener menciones no leídas del usuario actual
   */
  async getUnreadMentions(): Promise<CommentMention[]> {
    const response = await this.client.get('/findings/mentions/unread');
    return response.data.data || [];
  }

  /**
   * Marcar menciones como leídas
   */
  async markMentionsAsRead(mentionIds: string[]): Promise<void> {
    await this.client.put('/findings/mentions/read', {
      mentionIds,
    });
  }
}

export const commentsService = new CommentsService();
