/**
 * Queue Service - API calls for analysis queue management
 */

import { apiService } from './api.service';

export interface AnalysisJob {
  id: string;
  analysisId: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  attempt: number;
  maxAttempts: number;
}

export interface QueueStats {
  pending: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
  avgProcessingTime: number; // in seconds
  successRate: number; // 0-100
}

export const queueService = {
  /**
   * Enqueue an analysis job
   */
  async enqueueAnalysis(analysisId: string): Promise<{
    success: boolean;
    jobId: string;
    status: string;
  }> {
    return apiService.post('/analyses', { analysisId });
  },

  /**
   * Get analysis job status
   */
  async getJobStatus(jobId: string): Promise<AnalysisJob> {
    return apiService.get(`/analyses/job/${jobId}`);
  },

  /**
   * Cancel analysis job
   */
  async cancelAnalysis(analysisId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return apiService.patch(`/analyses/${analysisId}/cancel`, {});
  },

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    return apiService.get('/analyses/queue/stats');
  },

  /**
   * Get pending jobs
   */
  async getPendingJobs(limit: number = 10): Promise<AnalysisJob[]> {
    return apiService.get(`/analyses/queue/pending?limit=${limit}`);
  },

  /**
   * Get active jobs
   */
  async getActiveJobs(): Promise<AnalysisJob[]> {
    return apiService.get('/analyses/queue/active');
  },
};
