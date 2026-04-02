/**
 * Servicio de GitHub - Carga dinámica de repos y ramas
 * Permite búsqueda y selección de repositorios
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

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  cloneUrl: string;
  description: string;
  isPrivate: boolean;
  stars: number;
  language?: string;
}

export interface GitHubBranch {
  name: string;
  sha: string;
  protected: boolean;
}

export interface ReposResponse {
  repos: GitHubRepo[];
  total: number;
  page: number;
  per_page: number;
  hasMore: boolean;
}

export interface BranchesResponse {
  owner: string;
  repo: string;
  branches: GitHubBranch[];
  total: number;
}

class GitHubService {
  /**
   * Obtener lista de repositorios del usuario
   */
  async searchRepos(options: {
    search?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<ReposResponse> {
    try {
      const { search = '', page = 1, per_page = 20 } = options;
      const { data } = await client.get<{ data: ReposResponse }>('/github/repos', {
        params: { search, page, per_page },
      });
      return data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error buscando repositorios';
      throw new Error(errorMsg);
    }
  }

  /**
   * Obtener ramas de un repositorio
   */
  async getBranches(owner: string, repo: string): Promise<BranchesResponse> {
    try {
      const { data } = await client.get<{ data: BranchesResponse }>(
        `/github/repos/${owner}/${repo}/branches`
      );
      return data.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Error obteniendo ramas';
      throw new Error(errorMsg);
    }
  }
}

export const githubService = new GitHubService();
