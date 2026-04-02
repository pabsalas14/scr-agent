/**
 * ============================================================================
 * SERVICIO API - Comunicación con Backend
 * ============================================================================
 *
 * Maneja todas las llamadas HTTP al backend MCP Server
 * Incluye:
 * - Autenticación con JWT
 * - Interceptores de request/response
 * - Manejo centralizado de errores
 * - Timeout de requests
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  Proyecto,
  CrearProyectoDTO,
  Analisis,
  Hallazgo,
  EventoForense,
  Reporte,
  ApiResponse,
  PaginatedResponse,
  UserProfile,
} from '../types/api';

/**
 * URL base del API
 */
// Usar ruta relativa para que pase por el proxy de Vite → backend
const API_BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';

/**
 * Clase del servicio API
 */
class ApiService {
  /**
   * Instancia de Axios con configuración base
   */
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30_000, // 30 segundos
      headers: {
        'Content-Type': 'application/json',
      },
    });

    /**
     * Interceptor de request
     * Agrega token JWT si existe
     */
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    /**
     * Interceptor de response
     * Manejo centralizado de errores
     */
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== PROYECTOS ====================

  /**
   * Listar proyectos con paginación y búsqueda opcionales
   */
  async obtenerProyectos(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Proyecto>> {
    const { data } = await this.client.get<any>('/projects', { params });
    return {
      data: data.data || [],
      total: data.total ?? data.count ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? (data.data?.length ?? 0),
      hasMore: data.hasMore ?? false,
    };
  }

  /**
   * Obtener proyecto por ID
   */
  async obtenerProyecto(id: string): Promise<Proyecto> {
    const { data } = await this.client.get<ApiResponse<Proyecto>>(`/projects/${id}`);
    return data.data;
  }

  /**
   * Crear nuevo proyecto
   */
  async crearProyecto(dto: CrearProyectoDTO): Promise<Proyecto> {
    const { data } = await this.client.post<ApiResponse<Proyecto>>('/projects', dto);
    return data.data;
  }

  /**
   * Actualizar proyecto
   */
  async actualizarProyecto(id: string, dto: Partial<CrearProyectoDTO>): Promise<Proyecto> {
    const { data } = await this.client.put<ApiResponse<Proyecto>>(`/projects/${id}`, dto);
    return data.data;
  }

  /**
   * Eliminar proyecto
   */
  async eliminarProyecto(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // ==================== ANÁLISIS ====================

  /**
   * Iniciar análisis de seguridad
   */
  async iniciarAnalisis(projectId: string): Promise<Analisis> {
    const { data } = await this.client.post<ApiResponse<Analisis>>(
      `/projects/${projectId}/analyses`
    );
    return data.data;
  }

  /**
   * Obtener estado de análisis (polling)
   */
  async obtenerAnalisis(id: string): Promise<Analisis> {
    const { data } = await this.client.get<ApiResponse<Analisis>>(`/analyses/${id}`);
    return data.data;
  }

  /**
   * Obtener análisis de un proyecto
   */
  async obtenerAnalisisDeProyecto(projectId: string): Promise<Analisis[]> {
    const { data } = await this.client.get<ApiResponse<Analisis[]>>(
      `/projects/${projectId}/analyses`
    );
    return data.data;
  }

  /**
   * Cancelar un análisis en curso
   */
  async cancelarAnalisis(projectId: string, analysisId: string): Promise<Analisis> {
    const { data } = await this.client.post<ApiResponse<Analisis>>(
      `/projects/${projectId}/analyses/${analysisId}/cancel`
    );
    return data.data;
  }

  /**
   * Reintentar un análisis fallido
   */
  async reintentarAnalisis(analysisId: string): Promise<Analisis> {
    const { data } = await this.client.post<ApiResponse<Analisis>>(
      `/analyses/${analysisId}/retry`
    );
    return data.data;
  }

  // ==================== HALLAZGOS ====================

  /**
   * Obtener hallazgos de un análisis
   */
  async obtenerHallazgos(analysisId: string): Promise<Hallazgo[]> {
    const { data } = await this.client.get<ApiResponse<Hallazgo[]>>(
      `/analyses/${analysisId}/findings`
    );
    return data.data;
  }

  // ==================== FORENSES ====================

  /**
   * Obtener eventos forenses (timeline)
   */
  async obtenerEventosForenses(analysisId: string): Promise<EventoForense[]> {
    const { data } = await this.client.get<ApiResponse<EventoForense[]>>(
      `/analyses/${analysisId}/forensics`
    );
    return data.data;
  }

  // ==================== REPORTES ====================

  /**
   * Obtener reporte de un análisis
   */
  async obtenerReporte(analysisId: string): Promise<Reporte> {
    const { data } = await this.client.get<ApiResponse<Reporte>>(
      `/analyses/${analysisId}/report`
    );
    return data.data;
  }

  /**
   * Descargar PDF del reporte
   */
  async descargarPDF(analysisId: string): Promise<Blob> {
    const { data } = await this.client.get(`/analyses/${analysisId}/report/pdf`, {
      responseType: 'blob',
    });
    return data as Blob;
  }

  // ==================== SETTINGS ====================

  /**
   * Obtener configuración del usuario
   */
  async obtenerConfiguracionUsuario(): Promise<any> {
    const { data } = await this.client.get('/settings');
    return data;
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async obtenerPerfil(): Promise<UserProfile> {
    const { data } = await this.client.get<{ success: boolean; data: UserProfile }>('/users/settings');
    return data.data;
  }

  /**
   * Actualizar perfil del usuario autenticado
   */
  async actualizarPerfil(updates: { name?: string; email?: string; avatar?: string | null; bio?: string | null }): Promise<UserProfile> {
    const { data } = await this.client.patch<{ success: boolean; data: UserProfile }>('/users/settings', updates);
    return data.data;
  }

  /**
   * Guardar token de GitHub
   */
  async guardarTokenGithub(token: string): Promise<any> {
    const { data } = await this.client.post('/settings/github-token', { token });
    return data;
  }

  // ==================== HEALTH ====================

  /**
   * Verificar estado del backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch {
      return false;
    }
  }

  // ==================== MÉTODOS GENÉRICOS ====================

  /**
   * Petición GET genérica
   */
  async get<T = any>(url: string, config?: any): Promise<{ data: T }> {
    return this.client.get<T>(url, config);
  }

  /**
   * Petición POST genérica
   */
  async post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.client.post<T>(url, data, config);
  }

  /**
   * Petición PUT genérica
   */
  async put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }> {
    return this.client.put<T>(url, data, config);
  }

  /**
   * Petición DELETE genérica
   */
  async delete<T = any>(url: string, config?: any): Promise<{ data: T }> {
    return this.client.delete<T>(url, config);
  }
}

export const apiService = new ApiService();
