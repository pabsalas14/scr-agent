/**
 * ============================================================================
 * VISUALIZATIONS SERVICE - Cliente API para visualizaciones
 * ============================================================================
 */

import { ApiClient } from './api-client';

interface HeatmapCell {
  x: string | number;
  y: string | number;
  value: number;
  severity: string;
  count: number;
}

interface HeatmapData {
  title: string;
  data: HeatmapCell[];
  stats: {
    total: number;
    maxRisk: number;
    avgRisk: number;
  };
}

export const visualizationsService = {
  /**
   * Obtener heatmap temporal
   */
  getTemporalHeatmap: async (options?: {
    analysisId?: string;
    userId?: string;
    days?: number;
  }): Promise<HeatmapData> => {
    const params = new URLSearchParams();
    if (options?.analysisId) params.append('analysisId', options.analysisId);
    if (options?.userId) params.append('userId', options.userId);
    if (options?.days) params.append('days', options.days.toString());

    const response = await ApiClient.get(`/visualizations/heatmap/temporal?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener heatmap de archivos
   */
  getFileHeatmap: async (options?: {
    analysisId?: string;
    limit?: number;
  }): Promise<HeatmapData> => {
    const params = new URLSearchParams();
    if (options?.analysisId) params.append('analysisId', options.analysisId);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await ApiClient.get(`/visualizations/heatmap/files?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener heatmap de autores
   */
  getAuthorHeatmap: async (options?: {
    analysisId?: string;
    limit?: number;
  }): Promise<HeatmapData> => {
    const params = new URLSearchParams();
    if (options?.analysisId) params.append('analysisId', options.analysisId);
    if (options?.limit) params.append('limit', options.limit.toString());

    const response = await ApiClient.get(`/visualizations/heatmap/authors?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener mapa de riesgo
   */
  getRiskMap: async (analysisId?: string) => {
    const params = new URLSearchParams();
    if (analysisId) params.append('analysisId', analysisId);

    const response = await ApiClient.get(`/visualizations/risk-map?${params.toString()}`);
    return response.data;
  },
};
