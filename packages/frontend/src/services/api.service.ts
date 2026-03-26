/**
 * ============================================================================
 * SERVICIO API - Comunicación con Backend
 * ============================================================================
 *
 * Maneja todas las llamadas HTTP al backend MCP Server
 * Incluye:
 * - Autenticación con JWT (OWASP A07)
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
  ConfigPublica,
  ActualizarConfigDTO,
  ApiResponse,
  PaginatedResponse,
} from '../types/api';

/**
 * URL base del API
 */
// Usar ruta relativa para que pase por el proxy de Vite → backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
     * Agrega token JWT si existe (OWASP A07)
     */
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('scr_token');
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
          localStorage.removeItem('scr_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== PROYECTOS ====================

  /**
   * Listar todos los proyectos
   */
  async obtenerProyectos(): Promise<PaginatedResponse<Proyecto>> {
    const { data } = await this.client.get<PaginatedResponse<Proyecto>>('/projects');
    return data;
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

  // ==================== CONFIGURACIÓN ====================

  async obtenerConfig(): Promise<ConfigPublica> {
    const { data } = await this.client.get<ApiResponse<ConfigPublica>>('/config');
    return data.data;
  }

  async actualizarConfig(config: ActualizarConfigDTO): Promise<ConfigPublica> {
    const { data } = await this.client.post<ApiResponse<ConfigPublica>>('/config', config);
    return data.data;
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
}

export const apiService = new ApiService();
