/**
 * ============================================================================
 * COMPARISON SERVICE - Cliente API para comparaciones
 * ============================================================================
 */

import { apiService } from './api.service';

export interface UserComparison {
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  stats: Array<{
    userId: string;
    totalCommits: number;
    suspiciousCommits: number;
    riskScore: number;
    affectedRepos: number;
  }>;
  differences: {
    riskScoreDiff: number;
    commitsDiff: number;
    suspiciousDiff: number;
  };
}

export interface AnalysisComparison {
  analyses: Array<{
    id: string;
    projectName: string;
    completedAt: Date;
  }>;
  stats: Array<{
    analysisId: string;
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    filesAffected: number;
  }>;
  differences: {
    findingsDiff: number;
    criticalDiff: number;
    highDiff: number;
  };
}

export const comparisonService = {
  /**
   * Comparar dos usuarios
   */
  compareUsers: async (userId1: string, userId2: string): Promise<UserComparison> => {
    const response = await apiService.get(`/comparison/users/${userId1}/${userId2}`);
    return response.data;
  },

  /**
   * Comparar dos análisis
   */
  compareAnalyses: async (analysisId1: string, analysisId2: string): Promise<AnalysisComparison> => {
    const response = await apiService.get(`/comparison/analyses/${analysisId1}/${analysisId2}`);
    return response.data;
  },

  /**
   * Comparar periodos
   */
  comparePeriods: async (
    analysisId: string,
    days1?: number,
    days2?: number
  ): Promise<any> => {
    const params = new URLSearchParams();
    params.append('analysisId', analysisId);
    if (days1) params.append('days1', days1.toString());
    if (days2) params.append('days2', days2.toString());

    const response = await apiService.get(`/comparison/periods?${params.toString()}`);
    return response.data;
  },

  /**
   * Comparar proyectos
   */
  compareProjects: async (projectId1: string, projectId2: string): Promise<any> => {
    const response = await apiService.get(`/comparison/projects/${projectId1}/${projectId2}`);
    return response.data;
  },
};
