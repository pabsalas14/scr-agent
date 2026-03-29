import { apiService } from './api.service';

export interface AnalyticsSummary {
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  averageResolutionTime: number;
  remediationRate: number;
  totalAnalyses: number;
}

export interface TimelineData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface TypeData {
  name: string;
  value: number;
}

class AnalyticsService {
  /**
   * Get analytics summary
   */
  async getSummary(): Promise<AnalyticsSummary> {
    const response = await apiService.get<any>('/analytics/summary');
    return response.data?.data || response.data;
  }

  /**
   * Get analytics timeline
   */
  async getTimeline(days: number = 30): Promise<TimelineData[]> {
    const response = await apiService.get<any>(`/analytics/timeline?days=${days}`);
    return response.data?.data || response.data || [];
  }

  /**
   * Get findings by type
   */
  async getByType(): Promise<TypeData[]> {
    const response = await apiService.get<any>('/analytics/by-type');
    return response.data?.data || response.data || [];
  }
}

export const analyticsService = new AnalyticsService();
