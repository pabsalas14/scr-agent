/**
 * Remediation Service - API calls for remediation management
 */

import { apiService } from './api.service';
import { RemediationAction, RemediationComment } from '../types/findings';

export const remediationService = {
  /**
   * Create a new remediation
   */
  async createRemediation(data: {
    findingId: string;
    title?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    priority?: number;
  }): Promise<RemediationAction> {
    return apiService.post('/remediation', data);
  },

  /**
   * Update remediation status or details
   */
  async updateRemediation(
    id: string,
    data: {
      status?: string;
      title?: string;
      description?: string;
      assigneeId?: string;
      dueDate?: string;
      priority?: number;
      evidence?: {
        commitSha?: string;
        prUrl?: string;
        description?: string;
      };
      comment?: string;
    }
  ): Promise<RemediationAction> {
    return apiService.patch(`/remediation/${id}`, data);
  },

  /**
   * Get remediation details
   */
  async getRemediation(id: string): Promise<RemediationAction> {
    return apiService.get(`/remediation/${id}`);
  },

  /**
   * Add comment to remediation
   */
  async addComment(remediationId: string, content: string): Promise<RemediationComment> {
    return apiService.post(`/remediation/${remediationId}/comment`, { content });
  },

  /**
   * List remediations with filters
   */
  async listRemediations(options?: {
    status?: string;
    assigneeId?: string;
    overdue?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    remediations: RemediationAction[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (options?.status) params.append('status', options.status);
    if (options?.assigneeId) params.append('assigneeId', options.assigneeId);
    if (options?.overdue) params.append('overdue', 'true');
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return apiService.get(`/remediation?${params.toString()}`);
  },

  /**
   * Get remediation statistics
   */
  async getRemediationStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    overdue: number;
    avgTimeToCompletionDays: number;
  }> {
    return apiService.get('/remediation/stats');
  },
};
