/**
 * Servicio de monitoreo
 * Obtiene datos reales del backend API
 */

import axios from 'axios';
import type {
  Agent,
  AgentExecution,
  SystemMetrics,
  CostSummary,
  MonitoringDashboardData,
} from '../types/monitoring';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Agregar interceptor de JWT
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

class MonitoringService {
  /**
   * Obtener lista de agentes del backend
   */
  async getAgents(): Promise<Agent[]> {
    try {
      const { data } = await client.get<{ data: Agent[] }>('/monitoring/agents');
      return data.data;
    } catch (error) {
      console.error('Error obteniendo agentes:', error);
      throw error;
    }
  }

  /**
   * Obtener detalles de un agente específico
   */
  async getAgentDetail(agentId: string): Promise<Agent | null> {
    try {
      const { data } = await client.get<{ data: Agent }>(`/monitoring/agents/${agentId}`);
      return data.data;
    } catch (error) {
      console.error(`Error obteniendo detalles del agente ${agentId}:`, error);
      return null;
    }
  }

  /**
   * Obtener historial de ejecuciones de un agente
   */
  async getAgentExecutions(agentId: string, limit: number = 10): Promise<AgentExecution[]> {
    try {
      const { data } = await client.get<{ data: AgentExecution[] }>(
        `/monitoring/agents/${agentId}/executions?limit=${limit}`
      );
      return data.data;
    } catch (error) {
      console.error(`Error obteniendo ejecuciones del agente ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Obtener métricas del sistema en tiempo real
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const { data } = await client.get<{ data: SystemMetrics }>('/monitoring/system-metrics');
      return data.data;
    } catch (error) {
      console.error('Error obteniendo métricas del sistema:', error);
      throw error;
    }
  }

  /**
   * Obtener costos por período
   */
  async getCosts(period: 'today' | 'week' | 'month' = 'month'): Promise<CostSummary> {
    try {
      const { data } = await client.get<{ data: CostSummary }>('/monitoring/costs', {
        params: { period },
      });
      return data.data;
    } catch (error) {
      console.error('Error obteniendo costos:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los datos del dashboard en una llamada
   */
  async getDashboardData(): Promise<MonitoringDashboardData> {
    try {
      const { data } = await client.get<{ data: MonitoringDashboardData }>(
        '/monitoring/dashboard'
      );
      return data.data;
    } catch (error) {
      console.error('Error obteniendo datos del dashboard:', error);
      throw error;
    }
  }
}

export const monitoringService = new MonitoringService();
