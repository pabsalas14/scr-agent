import { apiService } from './api.service';
import {
  Finding,
  FindingStatus,
  RemediationStatus,
  FindingsStats,
  FindingDetailResponse,
  FindingsListResponse,
  FindingsStatsResponse,
} from '../types/findings';

class FindingsService {
  /**
   * Get all findings for an analysis
   */
  async getFindings(analysisId: string): Promise<Finding[]> {
    try {
      const response = await apiService.get<FindingsListResponse>(
        `/findings/analysis/${analysisId}`
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching findings:', error);
      throw error;
    }
  }

  /**
   * Get finding detail with full history
   */
  async getFindingDetail(findingId: string): Promise<Finding> {
    try {
      const response = await apiService.get<FindingDetailResponse>(
        `/findings/${findingId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching finding detail:', error);
      throw error;
    }
  }

  /**
   * Update finding status
   */
  async updateFindingStatus(
    findingId: string,
    status: FindingStatus,
    note?: string
  ): Promise<Finding> {
    try {
      const response = await apiService.put<FindingDetailResponse>(
        `/findings/${findingId}/status`,
        { status, note }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating finding status:', error);
      throw error;
    }
  }

  /**
   * Assign finding to a user
   */
  async assignFinding(findingId: string, assignedTo: string): Promise<any> {
    try {
      const response = await apiService.post(
        `/findings/${findingId}/assign`,
        { assignedTo }
      );
      return response.data;
    } catch (error) {
      console.error('Error assigning finding:', error);
      throw error;
    }
  }

  /**
   * Unassign finding from user
   */
  async unassignFinding(findingId: string): Promise<void> {
    try {
      await apiService.delete(`/findings/${findingId}/assign`);
    } catch (error) {
      console.error('Error unassigning finding:', error);
      throw error;
    }
  }

  /**
   * Get remediation details for a finding
   */
  async getRemediation(findingId: string): Promise<any> {
    try {
      const response = await apiService.get(
        `/findings/${findingId}/remediation`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching remediation:', error);
      throw error;
    }
  }

  /**
   * Create or update remediation entry
   */
  async updateRemediation(
    findingId: string,
    data: {
      correctionNotes?: string;
      proofOfFixUrl?: string;
      status?: RemediationStatus;
    }
  ): Promise<any> {
    try {
      const response = await apiService.post(
        `/findings/${findingId}/remediation`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating remediation:', error);
      throw error;
    }
  }

  /**
   * Verify remediation as complete
   */
  async verifyRemediation(
    findingId: string,
    verificationNotes?: string
  ): Promise<any> {
    try {
      const response = await apiService.put(
        `/findings/${findingId}/remediation/verify`,
        { verificationNotes }
      );
      return response.data;
    } catch (error) {
      console.error('Error verifying remediation:', error);
      throw error;
    }
  }

  /**
   * Get findings statistics for an analysis
   */
  async getFindsStats(analysisId: string): Promise<FindingsStats> {
    try {
      const response = await apiService.get<FindingsStatsResponse>(
        `/findings/analysis/${analysisId}/stats`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching findings stats:', error);
      throw error;
    }
  }
}

export const findingsService = new FindingsService();
