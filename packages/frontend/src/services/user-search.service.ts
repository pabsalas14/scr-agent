/**
 * User Search Service - API calls for user search and forensic profiling
 */

import { apiService } from './api.service';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  stats: {
    totalCommits: number;
    suspiciousCommits: number;
    affectedRepos: number;
    suspicionRate: string;
  };
}

export interface UserActivity {
  id: string;
  timestamp: string;
  type: string;
  severity?: string;
  file: string;
  project: string;
  author: string;
}

export interface UserRepo {
  repoId: string;
  repoName: string;
  repositoryUrl: string;
  commitCount: number;
  suspiciousCount: number;
}

export interface UserRiskScore {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: Record<string, number>;
  totalEvents: number;
}

export const userSearchService = {
  /**
   * Search users by name or email
   */
  async searchUsers(query: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (limit) params.append('limit', limit.toString());
    return apiService.get(`/users/search?${params.toString()}`);
  },

  /**
   * Get user profile with statistics
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    return apiService.get(`/users/${userId}/profile`);
  },

  /**
   * Get user activity timeline
   */
  async getUserActivity(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      severity?: string;
    }
  ): Promise<{
    data: UserActivity[];
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.severity) params.append('severity', options.severity);

    return apiService.get(`/users/${userId}/activity?${params.toString()}`);
  },

  /**
   * Get repositories where user has committed
   */
  async getUserRepos(userId: string): Promise<UserRepo[]> {
    return apiService.get(`/users/${userId}/repos`);
  },

  /**
   * Get user risk score
   */
  async getUserRiskScore(userId: string): Promise<UserRiskScore> {
    return apiService.get(`/users/${userId}/risk-score`);
  },

  /**
   * Get advanced risk score with factors
   */
  async getAdvancedRiskScore(userId: string): Promise<any> {
    return apiService.get(`/users/${userId}/risk-score/advanced`);
  },

  /**
   * Get risk score history
   */
  async getRiskScoreHistory(
    userId: string,
    options?: {
      days?: number;
      limit?: number;
    }
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    return apiService.get(`/users/${userId}/risk-score/history?${params.toString()}`);
  },
};
