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
     *
     * BUG FIX #12: Token security improvement with HttpOnly cookies
     * - Token is sent as HttpOnly cookie from backend (automatically by browser)
     * - As fallback, also tries localStorage for backward compatibility
     * - Frontend no longer stores token in localStorage when using cookies
     */
    this.client.interceptors.request.use(
      (config) => {
        // With HttpOnly cookies, the browser automatically sends the token
        // No need to manually add it to headers
        // BUT we still support localStorage as fallback for backward compatibility
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Ensure credentials (cookies) are sent with requests
        config.withCredentials = true;
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
  async iniciarAnalisis(projectId: string, isIncremental: boolean = false): Promise<Analisis> {
    const { data } = await this.client.post<ApiResponse<Analisis>>(
      `/projects/${projectId}/analyses`,
      { isIncremental }
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
   * Obtener análisis global (historial)
   */
  async obtenerAnalisisGlobales(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Analisis & { projectName?: string }>> {
    const { data } = await this.client.get<any>('/analyses', { params });
    return {
      data: data.data || [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 20,
      hasMore: data.hasMore ?? false,
    };
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

  /**
   * Obtener hallazgos a nivel global (Alertas e Incidentes)
   */
  async obtenerHallazgosGlobales(params?: { page?: number; limit?: number; severity?: string; isIncident?: boolean }): Promise<PaginatedResponse<Hallazgo>> {
    const { data } = await this.client.get<any>('/findings/global', { params });
    return {
      data: data.data || [],
      total: data.total ?? 0,
      page: data.page ?? 1,
      limit: data.limit ?? 50,
      hasMore: data.hasMore ?? false,
    };
  }

  /**
   * Cambiar estado de un hallazgo
   */
  async cambiarEstadoHallazgo(
    findingId: string,
    payload: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'; notes?: string; assignedTo?: string }
  ): Promise<Hallazgo> {
    const { data } = await this.client.put<ApiResponse<Hallazgo>>(
      `/findings/${findingId}/status`,
      payload
    );
    return data.data;
  }

  /**
   * Asignar hallazgo a un usuario
   */
  async asignarHallazgo(findingId: string, userId: string): Promise<Hallazgo> {
    const { data } = await this.client.post<ApiResponse<Hallazgo>>(
      `/findings/${findingId}/assign`,
      { userId }
    );
    return data.data;
  }

  /**
   * Desasignar hallazgo de un usuario
   */
  async desasignarHallazgo(findingId: string): Promise<Hallazgo> {
    const { data } = await this.client.delete<ApiResponse<Hallazgo>>(
      `/findings/${findingId}/assign`
    );
    return data.data;
  }

  /**
   * Obtener remediación de un hallazgo
   */
  async obtenerRemediacion(findingId: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(
      `/findings/${findingId}/remediation`
    );
    return data.data;
  }

  /**
   * Crear o actualizar remediación de un hallazgo
   */
  async crearRemediacion(findingId: string, remediationData: { description: string; steps: string[]; estimatedTime?: number }): Promise<any> {
    const { data } = await this.client.post<ApiResponse<any>>(
      `/findings/${findingId}/remediation`,
      remediationData
    );
    return data.data;
  }

  /**
   * Verificar remediación de un hallazgo
   */
  async verificarRemediacion(findingId: string): Promise<any> {
    const { data } = await this.client.put<ApiResponse<any>>(
      `/findings/${findingId}/remediation/verify`
    );
    return data.data;
  }

  /**
   * Obtener estadísticas de hallazgos de un análisis
   */
  async obtenerEstadisticasHallazgos(analysisId: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(
      `/findings/analysis/${analysisId}/stats`
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

  // ==================== MONITOREO ====================

  /**
   * Obtener lista de agentes activos
   */
  async obtenerAgentes(): Promise<any[]> {
    const { data } = await this.client.get<ApiResponse<any[]>>('/monitoring/agents');
    return data.data;
  }

  /**
   * Obtener detalles de un agente específico
   */
  async obtenerDetalleAgente(agentId: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(
      `/monitoring/agents/${agentId}`
    );
    return data.data;
  }

  /**
   * Obtener historial de ejecuciones de un agente
   */
  async obtenerEjecucionesAgente(agentId: string, params?: { page?: number; limit?: number }): Promise<any> {
    const { data } = await this.client.get<any>(
      `/monitoring/agents/${agentId}/executions`,
      { params }
    );
    return data.data || data;
  }

  /**
   * Obtener métricas del sistema (CPU, RAM, disco)
   */
  async obtenerMetricasSistema(): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>('/monitoring/system-metrics');
    return data.data;
  }

  /**
   * Obtener costos por período
   */
  async obtenerCostos(periodo?: 'today' | 'week' | 'month'): Promise<any> {
    const params = periodo ? { period: periodo } : {};
    const { data } = await this.client.get<ApiResponse<any>>('/monitoring/costs', { params });
    return data.data;
  }

  /**
   * Obtener dashboard consolidado de monitoreo
   */
  async obtenerDashboardMonitoreo(): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>('/monitoring/dashboard');
    return data.data;
  }

  // ==================== ANALÍTICAS ====================

  /**
   * Obtener resumen de analíticas globales
   */
  async obtenerAnalyticsSummary(): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>('/analytics/summary');
    return data.data;
  }

  /**
   * Obtener timeline de hallazgos
   */
  async obtenerTimelineAnalyticas(params?: { startDate?: string; endDate?: string }): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>('/analytics/timeline', { params });
    return data.data;
  }

  /**
   * Obtener analíticas desglosadas por tipo de riesgo
   */
  async obtenerAnalyticasPorTipo(): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>('/analytics/by-type');
    return data.data;
  }

  // ==================== COMENTARIOS ====================

  /**
   * Crear comentario en un hallazgo
   */
  async crearComentario(findingId: string, comentario: { content: string; mentions?: string[] }): Promise<any> {
    const { data } = await this.client.post<ApiResponse<any>>(
      `/findings/${findingId}/comments`,
      comentario
    );
    return data.data;
  }

  /**
   * Obtener comentarios de un hallazgo
   */
  async obtenerComentarios(findingId: string, params?: { page?: number; limit?: number }): Promise<any> {
    const { data } = await this.client.get<any>(
      `/findings/${findingId}/comments`,
      { params }
    );
    return {
      data: data.data || [],
      total: data.total ?? 0,
      page: data.page ?? 1,
    };
  }

  /**
   * Obtener comentario específico
   */
  async obtenerComentario(commentId: string): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>(
      `/comments/${commentId}`
    );
    return data.data;
  }

  // ==================== NOTIFICACIONES ====================

  /**
   * Obtener notificaciones del usuario
   */
  async obtenerNotificaciones(params?: { page?: number; limit?: number }): Promise<any> {
    const { data } = await this.client.get<any>('/notifications', { params });
    return {
      data: data.data || [],
      total: data.total ?? 0,
      page: data.page ?? 1,
    };
  }

  /**
   * Obtener cantidad de notificaciones sin leer
   */
  async obtenerCountNoLeidos(): Promise<number> {
    const { data } = await this.client.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return data.data?.count ?? 0;
  }

  /**
   * Marcar notificación como leída
   */
  async marcarComoLeido(notificationId: string): Promise<any> {
    const { data } = await this.client.put<ApiResponse<any>>(
      `/notifications/${notificationId}/read`
    );
    return data.data;
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async marcarTodosComoLeidos(): Promise<any> {
    const { data } = await this.client.put<ApiResponse<any>>('/notifications/mark-all-read');
    return data.data;
  }

  /**
   * Limpiar todas las notificaciones
   */
  async limpiarNotificaciones(): Promise<void> {
    await this.client.delete('/notifications');
  }

  // ==================== GITHUB ====================

  /**
   * Listar repositorios del usuario en GitHub
   */
  async listarRepositorios(): Promise<any[]> {
    const { data } = await this.client.get<ApiResponse<any[]>>('/github/repos');
    return data.data;
  }

  /**
   * Listar ramas de un repositorio
   */
  async listarRamasRepositorio(owner: string, repo: string): Promise<any[]> {
    const { data } = await this.client.get<ApiResponse<any[]>>(
      `/github/repos/${owner}/${repo}/branches`
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
   * Descargar reporte profesional en PDF (vía Backend)
   */
  async descargarReportePDF(analysisId: string, projectName: string = 'Report'): Promise<void> {
    const response = await this.client.get(
      `/reports/${analysisId}/pdf`,
      { responseType: 'blob' }
    );
    
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `SCR-Report-${projectName.replace(/\s+/g, '-')}-${new Date().getTime()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Exportar hallazgos como CSV (descarga directa)
   */
  async exportarHallazgosCSV(analysisId: string): Promise<void> {
    const { data } = await this.client.get<string>(
      `/findings/analysis/${analysisId}/export`,
      { responseType: 'blob' }
    );
    const url = URL.createObjectURL(new Blob([data as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `findings-${analysisId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  /**
   * Guardar configuración de IA
   */
  async guardarConfiguracionIA(config: {
    claudeApiKey?: string;
    selectedModel: string;
    temperature: number;
    maxTokens: number;
    webhookUrl?: string;
    llmProvider?: 'anthropic' | 'lmstudio';
    lmstudioBaseUrl?: string;
  }): Promise<any> {
    const { data } = await this.client.post('/settings/ai-config', config);
    return data;
  }

  /**
   * Chatear con la IA sobre un hallazgo específico
   */
  async chatearConHallazgo(findingId: string, question: string): Promise<string> {
    const { data } = await this.client.post<ApiResponse<string>>(
      `/findings/${findingId}/chat`,
      { question }
    );
    return data.data;
  }

  /**
   * Obtener estimado de tokens y costo para un proyecto
   */
  async obtenerEstimadoCosto(projectId: string): Promise<{ tokens: number; costUsd: number; fileCount: number }> {
    const { data } = await this.client.get<ApiResponse<{ tokens: number; costUsd: number; fileCount: number }>>(
      `/projects/${projectId}/estimate`
    );
    return data.data;
  }

  // ==================== EQUIPO ====================

  async listarUsuarios(): Promise<any[]> {
    const { data } = await this.client.get<{ data: any[] }>('/users');
    return data.data;
  }

  async cambiarRolUsuario(userId: string, role: string): Promise<void> {
    await this.client.patch(`/users/${userId}/role`, { role });
  }

  async crearUsuario(data: { email: string; role: string; password: string }): Promise<any> {
    const response = await this.client.post('/users', data);
    return response.data;
  }

  // ==================== AUDIT ====================
  /**
   * Obtener logs de auditoría del usuario
   */
  async obtenerAuditLogs(params?: { 
    limit?: number; 
    offset?: number; 
    action?: string; 
    resourceType?: string 
  }): Promise<PaginatedResponse<any>> {
    const { data } = await this.client.get<any>('/audit', { params });
    return {
      data: data.data || [],
      total: data.total ?? 0,
      page: Math.floor((data.offset || 0) / (data.limit || 50)) + 1,
      limit: data.limit ?? 50,
      hasMore: data.hasMore ?? false,
    };
  }

  /**
   * Obtener resumen de actividad (solo admin)
   */
  async obtenerAuditSummary(days: number = 7): Promise<any> {
    const { data } = await this.client.get<ApiResponse<any>>('/audit/summary', { params: { days } });
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
