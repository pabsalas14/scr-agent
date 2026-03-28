import { apiService } from './api.service';
import { User } from '../types/findings';

export type Role = 'ADMIN' | 'ANALYST' | 'DEVELOPER' | 'VIEWER';

class UsersService {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiService.get<any>(
        '/users'
      );
      return (response.data?.data || response.data || []) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user detail
   */
  async getUserDetail(userId: string): Promise<any> {
    try {
      const response = await apiService.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user detail:', error);
      throw error;
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: Role): Promise<User[]> {
    try {
      const response = await apiService.get<any>(
        `/users/role/${role}`
      );
      return (response.data?.data || response.data || []) as User[];
    } catch (error) {
      console.error('Error fetching users by role:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, role: Role): Promise<any> {
    try {
      const response = await apiService.post(`/users/${userId}/roles`, { role });
      return response.data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, role: Role): Promise<void> {
    try {
      await apiService.delete(`/users/${userId}/roles/${role}`);
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  /**
   * Get findings assigned to user
   */
  async getUserAssignments(userId: string): Promise<any[]> {
    try {
      const response = await apiService.get<any>(
        `/users/${userId}/assignments`
      );
      return (response.data?.data || response.data || []) as any[];
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      throw error;
    }
  }

  /**
   * Get all assignments for an analysis
   */
  async getAnalysisAssignments(analysisId: string): Promise<any[]> {
    try {
      const response = await apiService.get<any>(
        `/users/analysis/${analysisId}/assignments`
      );
      return (response.data?.data || response.data || []) as any[];
    } catch (error) {
      console.error('Error fetching analysis assignments:', error);
      throw error;
    }
  }
}

export const usersService = new UsersService();
