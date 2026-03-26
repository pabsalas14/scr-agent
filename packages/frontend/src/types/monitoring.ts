/**
 * Tipos para el sistema de monitoreo
 */

// Agentes
export interface Agent {
  id: string;
  name: string;
  type: 'inspector' | 'detective' | 'fiscal' | 'custom';
  status: 'active' | 'inactive' | 'error';
  lastExecution?: Date;
  executionCount: number;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  timestamp: Date;
  duration: number; // en milisegundos
  status: 'success' | 'error' | 'pending';
  result?: string;
  logs?: string[];
}

// Sistema
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 0-100
    cores: number;
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // 0-100
  };
  disk: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // 0-100
  };
  uptime: number; // seconds
}

// Costos
export interface CostEntry {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

export interface CostSummary {
  period: 'today' | 'week' | 'month';
  totalCostUSD: number;
  entries: CostEntry[];
}

// Dashboard
export interface MonitoringDashboardData {
  agents: Agent[];
  systemMetrics: SystemMetrics;
  costs: CostSummary;
  recentExecutions: AgentExecution[];
}
