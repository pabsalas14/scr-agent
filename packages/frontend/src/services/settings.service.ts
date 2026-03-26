/**
 * Servicio de Configuraciones de Usuario
 * Gestiona GitHub token, API keys, y preferencias
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Agregar interceptor de JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface UserSettings {
  has_github_token: boolean;
  github_validated_at: string | null;
  has_api_key: boolean;
  preferences: {
    darkMode: boolean;
    autoRefresh: number;
  };
}

class SettingsService {
  /**
   * Validar y guardar GitHub token
   */
  async saveGitHubToken(token: string): Promise<{ valid: boolean; message: string; scopes?: string[] }> {
    try {
      const { data } = await client.post('/settings/github-token', { token });
      return data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error guardando GitHub token';
      throw new Error(errorMsg);
    }
  }

  /**
   * Obtener configuraciones del usuario
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const { data } = await client.get('/settings');
      return data.data;
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      throw error;
    }
  }

  /**
   * Eliminar GitHub token
   */
  async deleteGitHubToken(): Promise<{ message: string }> {
    try {
      const { data } = await client.delete('/settings/github-token');
      return data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error eliminando GitHub token';
      throw new Error(errorMsg);
    }
  }
}

export const settingsService = new SettingsService();
