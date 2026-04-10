/**
 * Timeline Service - API calls for timeline visualization
 */

import { apiService } from './api.service';

export interface TimelineEvent {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description: string;
  severity?: string;
  relatedId: string;
  relatedType: string;
  metadata?: Record<string, any>;
}

export interface TimelineGroup {
  date: string;
  events: TimelineEvent[];
  eventCount: number;
  severityBreakdown: Record<string, number>;
}

export interface AnalysisTimeline {
  analysisId: string;
  projectName: string;
  startDate: string;
  endDate: string;
  status: string;
  timeline: TimelineGroup[];
  summary: {
    totalEvents: number;
    totalFindings: number;
    totalRemediations: number;
    criticalCount: number;
    highCount: number;
  };
}

export const timelineService = {
  /**
   * Get analysis timeline
   */
  async getAnalysisTimeline(analysisId: string): Promise<AnalysisTimeline> {
    return apiService.get(`/timeline/analysis/${analysisId}`);
  },

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(
    userId: string,
    options?: {
      limit?: number;
      severity?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{
    data: TimelineEvent[];
    count: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.severity) params.append('severity', options.severity);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return apiService.get(`/timeline/user/${userId}/activity?${params.toString()}`);
  },

  /**
   * Get remediation timeline
   */
  async getRemediationTimeline(options?: {
    findingId?: string;
    userId?: string;
    status?: string;
    limit?: number;
  }): Promise<{
    data: any[];
    count: number;
    limit: number;
  }> {
    const params = new URLSearchParams();
    if (options?.findingId) params.append('findingId', options.findingId);
    if (options?.userId) params.append('userId', options.userId);
    if (options?.status) params.append('status', options.status);
    if (options?.limit) params.append('limit', options.limit.toString());

    return apiService.get(`/timeline/remediation?${params.toString()}`);
  },

  /**
   * Get timeline statistics
   */
  async getTimelineStats(options?: {
    startDate?: string;
    endDate?: string;
    projectId?: string;
  }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.projectId) params.append('projectId', options.projectId);

    return apiService.get(`/timeline/stats?${params.toString()}`);
  },
};
