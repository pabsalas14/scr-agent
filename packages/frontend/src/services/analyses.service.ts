/**
 * Analyses Service - Manage security analyses and track progress
 */

import { apiService } from './api.service';

export interface Analysis {
  id: string;
  projectId: string;
  projectName?: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  findingCount: number;
  startTime?: Date;
  endTime?: Date;
  estimatedDuration?: number;
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnalysisStartRequest {
  projectId: string;
  options?: {
    includeHistorical?: boolean;
    maxDepth?: number;
    timeout?: number;
  };
}

export interface AnalysisResponse {
  analysis: Analysis;
  message?: string;
}

class AnalysesService {
  /**
   * Start a new analysis for a project
   */
  async startAnalysis(request: AnalysisStartRequest): Promise<AnalysisResponse> {
    try {
      const response = await apiService.post<AnalysisResponse>('/analyses/start', request);
      return response.data;
    } catch (error) {
      console.error('Error starting analysis:', error);
      throw error;
    }
  }

  /**
   * Get list of analyses for a project
   */
  async getProjectAnalyses(projectId: string, options?: { limit?: number; offset?: number }): Promise<{
    analyses: Analysis[];
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await apiService.get<{ analyses: Analysis[]; total: number }>(
        `/projects/${projectId}/analyses?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching analyses:', error);
      throw error;
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysis(analysisId: string): Promise<Analysis> {
    try {
      const response = await apiService.get<Analysis>(`/analyses/${analysisId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis:', error);
      throw error;
    }
  }

  /**
   * Get in-progress analyses
   */
  async getActiveAnalyses(): Promise<Analysis[]> {
    try {
      const response = await apiService.get<Analysis[]>('/analyses/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active analyses:', error);
      return [];
    }
  }

  /**
   * Cancel an analysis
   */
  async cancelAnalysis(analysisId: string): Promise<void> {
    try {
      await apiService.post(`/analyses/${analysisId}/cancel`, {});
    } catch (error) {
      console.error('Error cancelling analysis:', error);
      throw error;
    }
  }

  /**
   * Retry a failed analysis
   */
  async retryAnalysis(analysisId: string): Promise<AnalysisResponse> {
    try {
      const response = await apiService.post<AnalysisResponse>(`/analyses/${analysisId}/retry`, {});
      return response.data;
    } catch (error) {
      console.error('Error retrying analysis:', error);
      throw error;
    }
  }

  /**
   * Get analysis history with filters
   */
  async getAnalysisHistory(options?: {
    projectId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ analyses: Analysis[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (options?.projectId) params.append('projectId', options.projectId);
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await apiService.get<{ analyses: Analysis[]; total: number }>(
        `/analyses?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      throw error;
    }
  }
}

export const analysesService = new AnalysesService();
