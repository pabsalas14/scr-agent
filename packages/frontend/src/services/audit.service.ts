/**
 * Audit Service - API calls for audit trail management
 */

import { apiService } from './api.service';

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE';
}

export interface AuditActivitySummary {
  period: {
    start: string;
    end: string;
  };
  totalActions: number;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  byResourceType: Record<string, number>;
  failureRate: number;
}

export const auditService = {
  /**
   * Get user audit logs
   */
  async getUserAuditLogs(userId?: string, options?: {
    limit?: number;
    offset?: number;
    action?: string;
  }): Promise<{
    logs: AuditLogEntry[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.action) params.append('action', options.action);

    return apiService.get(`/audit?${params.toString()}`);
  },

  /**
   * Get resource audit trail
   */
  async getResourceAuditLogs(
    resourceType: string,
    resourceId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{
    logs: AuditLogEntry[];
    total: number;
  }> {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    return apiService.get(`/audit/resources/${resourceType}/${resourceId}?${params.toString()}`);
  },

  /**
   * Get audit activity summary
   */
  async getActivitySummary(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AuditActivitySummary> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    return apiService.get(`/audit/summary?${params.toString()}`);
  },
};
