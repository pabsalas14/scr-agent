/**
 * Risk Trends Service - API calls for risk trend analysis
 */

import { apiService } from './api.service';

export interface RiskTrendPoint {
  timestamp: string;
  date: string;
  score: number;
  eventCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface RiskTrend {
  entity: string;
  entityType: 'user' | 'project' | 'global';
  period: {
    start: string;
    end: string;
  };
  trend: RiskTrendPoint[];
  statistics: {
    average: number;
    maximum: number;
    minimum: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    changePercent: number;
  };
}

export const riskTrendsService = {
  /**
   * Get user risk trend
   */
  async getUserRiskTrend(
    userId: string,
    options?: {
      days?: number;
      interval?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<RiskTrend> {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.interval) params.append('interval', options.interval);

    return apiService.get(`/users/${userId}/risk-trend?${params.toString()}`);
  },

  /**
   * Compare risk trends between users
   */
  async compareUserRiskTrends(
    userIds: string[],
    options?: {
      days?: number;
      interval?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<Record<string, RiskTrend | null>> {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.interval) params.append('interval', options.interval);

    return apiService.post(`/users/risk-trend/compare?${params.toString()}`, {
      userIds,
    });
  },

  /**
   * Get global risk trend
   */
  async getGlobalRiskTrend(options?: {
    days?: number;
    interval?: 'daily' | 'weekly' | 'monthly';
  }): Promise<RiskTrend> {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.interval) params.append('interval', options.interval);

    return apiService.get(`/trends/global?${params.toString()}`);
  },

  /**
   * Get project risk trend
   */
  async getProjectRiskTrend(
    projectId: string,
    options?: {
      days?: number;
      interval?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<RiskTrend> {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.interval) params.append('interval', options.interval);

    return apiService.get(`/trends/project/${projectId}?${params.toString()}`);
  },
};
