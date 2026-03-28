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
  createdAt: string;
  updatedAt: string;
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
   * Crear un nuevo comentario
   */
  async createComment(findingId: string, content: string): Promise<Comment> {
    const response = await this.client.post(`/findings/${findingId}/comments`, {
      content,
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
   * Actualizar un comentario
   */
  async updateComment(findingId: string, commentId: string, content: string): Promise<Comment> {
    const response = await this.client.put(`/findings/${findingId}/comments/${commentId}`, {
      content,
    });
    return response.data.data;
  }
}

export const commentsService = new CommentsService();
