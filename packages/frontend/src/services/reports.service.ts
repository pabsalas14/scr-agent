/**
 * ============================================================================
 * REPORTS SERVICE - Cliente API para reportes
 * ============================================================================
 */

import { ApiClient } from './api-client';

export interface ExecutiveReport {
  type: 'executive';
  title: string;
  summary: string;
  keyFindings: Array<{
    issue: string;
    severity: string;
    impact: string;
  }>;
  statistics: {
    totalFindings: number;
    byType: {
      CRITICAL: number;
      HIGH: number;
      MEDIUM: number;
      LOW: number;
    };
    riskScore: number;
  };
  recommendations: string[];
  timeline: {
    startDate: Date;
    endDate: Date;
    findingsCount: number;
  };
}

export interface TechnicalReport {
  type: 'technical';
  title: string;
  analysisId: string;
  projectUrl: string;
  analysisDetails: {
    createdAt: Date;
    completedAt: Date;
    status: string;
  };
  findings: Array<{
    type: string;
    count: number;
    details: any[];
  }>;
  summary: {
    totalFindings: number;
    filesAffected: number;
    typesDetected: number;
  };
}

export interface RemediationReport {
  type: 'remediation';
  title: string;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    completed: number;
    avgDaysToCompletion: number;
  };
  overdue: any[];
  topAssignees: Array<{
    name: string;
    count: number;
  }>;
  timeline: {
    startDate: Date;
    endDate: Date;
  };
}

export const reportsService = {
  /**
   * Generar reporte ejecutivo
   */
  getExecutiveReport: async (analysisId: string): Promise<ExecutiveReport> => {
    const response = await ApiClient.get(`/reports/${analysisId}/executive`);
    return response.data;
  },

  /**
   * Generar reporte técnico
   */
  getTechnicalReport: async (analysisId: string): Promise<TechnicalReport> => {
    const response = await ApiClient.get(`/reports/${analysisId}/technical`);
    return response.data;
  },

  /**
   * Generar reporte de remediación
   */
  getRemediationReport: async (analysisId: string): Promise<RemediationReport> => {
    const response = await ApiClient.get(`/reports/${analysisId}/remediation`);
    return response.data;
  },

  /**
   * Exportar reporte
   */
  exportReport: async (
    analysisId: string,
    type: 'executive' | 'technical' | 'remediation',
    format: 'json' | 'csv' = 'json'
  ): Promise<Blob> => {
    const response = await ApiClient.get(
      `/reports/${analysisId}/export?type=${type}&format=${format}`,
      {
        responseType: 'blob',
      }
    );
    return response;
  },

  /**
   * Obtener URL de descarga
   */
  getDownloadUrl: async (
    analysisId: string,
    type: 'executive' | 'technical' | 'remediation',
    format: 'json' | 'csv' = 'json'
  ): Promise<string> => {
    const response = await ApiClient.get(
      `/reports/${analysisId}/download-url?type=${type}&format=${format}`
    );
    return response.data.downloadUrl;
  },

  /**
   * Descargar reporte
   */
  downloadReport: async (
    analysisId: string,
    type: 'executive' | 'technical' | 'remediation',
    format: 'json' | 'csv' = 'json'
  ) => {
    const url = await reportsService.getDownloadUrl(analysisId, type, format);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${analysisId}-${type}.${format}`;
    link.click();
  },
};
