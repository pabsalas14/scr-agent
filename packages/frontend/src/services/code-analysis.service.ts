/**
 * ============================================================================
 * CODE ANALYSIS SERVICE - Cliente API para análisis de código
 * ============================================================================
 */

import { ApiClient } from './api-client';

export interface CodeDiff {
  file: string;
  additions: number;
  deletions: number;
  changes: number;
  riskLevel: string;
  severity: string;
  hunks: any[];
}

export interface FileComparison {
  file: string;
  analysisId: string;
  beforeCommit: string;
  afterCommit: string;
  stats: {
    commits: number;
    additions: number;
    deletions: number;
    totalChanges: number;
  };
  events: any[];
}

export interface AffectedFile {
  file: string;
  changes: number;
  maxRisk: string;
  riskScore: number;
}

export const codeAnalysisService = {
  /**
   * Obtener diff de un hallazgo
   */
  getFindingDiff: async (findingId: string): Promise<any> => {
    const response = await ApiClient.get(`/code-analysis/finding/${findingId}/diff`);
    return response.data;
  },

  /**
   * Comparar versiones de archivo
   */
  compareFileVersions: async (
    analysisId: string,
    file: string,
    options?: {
      beforeCommit?: string;
      afterCommit?: string;
    }
  ): Promise<FileComparison> => {
    const params = new URLSearchParams();
    params.append('analysisId', analysisId);
    params.append('file', file);
    if (options?.beforeCommit) params.append('beforeCommit', options.beforeCommit);
    if (options?.afterCommit) params.append('afterCommit', options.afterCommit);

    const response = await ApiClient.get(`/code-analysis/file/compare?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener archivos afectados por usuario
   */
  getUserAffectedFiles: async (
    userId: string,
    options?: {
      limit?: number;
      analysisId?: string;
    }
  ): Promise<AffectedFile[]> => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.analysisId) params.append('analysisId', options.analysisId);

    const response = await ApiClient.get(`/code-analysis/user/${userId}/files?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener contexto de línea
   */
  getLineContext: async (
    analysisId: string,
    file: string,
    lineNumber: number,
    context?: number
  ): Promise<any> => {
    const params = new URLSearchParams();
    params.append('analysisId', analysisId);
    params.append('file', file);
    params.append('lineNumber', lineNumber.toString());
    if (context) params.append('context', context.toString());

    const response = await ApiClient.get(`/code-analysis/context?${params.toString()}`);
    return response.data;
  },
};
