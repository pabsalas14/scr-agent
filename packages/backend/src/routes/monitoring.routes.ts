/**
 * ============================================================================
 * RUTAS DE MONITOREO
 * ============================================================================
 *
 * GET /api/v1/monitoring/agents              → Lista de agentes y su estado
 * GET /api/v1/monitoring/agents/:id          → Detalles de un agente
 * GET /api/v1/monitoring/agents/:id/executions → Historial de ejecuciones
 * GET /api/v1/monitoring/system-metrics      → Métricas del sistema (CPU, RAM, etc)
 * GET /api/v1/monitoring/costs?period=month  → Costos por período
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { prisma } from '../services/prisma.service';
import { MODEL_PRICES, DEFAULT_PRICE } from '../config/model-prices';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getSystemMetrics, formatUptime, isHealthy } from '../services/system-monitor.service';
import { getFPStatistics, recordFalsePositive, getLearnedPatterns } from '../services/false-positive-learning.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();
const execAsync = promisify(exec);

// ==================== TIPOS ====================

interface Agent {
  id: string;
  name: string;
  type: 'inspector' | 'detective' | 'fiscal' | 'custom';
  status: 'active' | 'inactive' | 'error';
  lastExecution?: Date;
  executionCount: number;
}

interface AgentExecution {
  id: string;
  agentId: string;
  timestamp: Date;
  duration: number; // milisegundos
  status: 'success' | 'error' | 'pending';
  result?: string;
  logs?: string[];
}

interface SystemMetrics {
  timestamp: Date;
  cpu: { usage: number; cores: number };
  memory: { used: number; total: number; usage: number };
  disk: { used: number; total: number; usage: number };
  uptime: number;
}

interface CostEntry {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

interface CostSummary {
  period: 'today' | 'week' | 'month';
  totalCostUSD: number;
  entries: CostEntry[];
}

// ==================== HELPERS ====================

/** Obtiene stats de análisis completados (usado en múltiples endpoints de agentes) */
async function getCompletedAnalysisStats() {
  const [count, last] = await Promise.all([
    prisma.analysis.count({ where: { status: 'COMPLETED' } }),
    prisma.analysis.findFirst({
      where: { status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    }),
  ]);
  return { count, lastExecution: last?.completedAt ?? null };
}

// ==================== AGENTES DEFINIDOS ====================

const AGENTS: Agent[] = [
  {
    id: 'inspector-001',
    name: 'Inspector Principal',
    type: 'inspector',
    status: 'active',
    executionCount: 0,
  },
  {
    id: 'detective-001',
    name: 'Detective Forense',
    type: 'detective',
    status: 'active',
    executionCount: 0,
  },
  {
    id: 'fiscal-001',
    name: 'Fiscal Análisis',
    type: 'fiscal',
    status: 'active',
    executionCount: 0,
  },
];

// ==================== HELPERS ====================

/**
 * Obtener uso de CPU
 */
async function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~((idle / total) * 100);

    resolve(Math.min(100, Math.max(0, usage)));
  });
}

/**
 * Obtener uso de disco
 */
async function getDiskUsage(): Promise<{ used: number; total: number; usage: number } | null> {
  try {
    // En macOS y Linux
    const { stdout } = await execAsync('df -B1 / | tail -1');
    const parts = stdout.trim().split(/\s+/);

    if (parts.length >= 4) {
      const total = parseInt(parts[1]!, 10);
      const used = parseInt(parts[2]!, 10);
      return {
        used,
        total,
        usage: (used / total) * 100,
      };
    }
  } catch (error) {
    logger.error(`Error obteniendo uso de disco: ${error}`);
  }

  // No hay datos de disco disponibles — devolver null en lugar de valores inventados
  return null;
}

/**
 * Calcular costos basado en tokens REALES de la base de datos
 */
async function calculateCosts(period: 'today' | 'week' | 'month'): Promise<CostSummary> {

  // Calcular fecha de corte según el período
  const now = new Date();
  let startDate = new Date();

  if (period === 'today') {
    startDate.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  }

  try {
    // Obtener TODOS los análisis completados en el período
    const analyses = await prisma.analysis.findMany({
      where: {
        status: 'COMPLETED' as any,
        completedAt: {
          gte: startDate,
          lte: now,
        },
      },
      select: {
        id: true,
        report: true, // Contiene los tokens y modelo
      },
    });

    // Acumular tokens por modelo
    const costsByModel: Record<string, { calls: number; inputTokens: number; outputTokens: number }> = {};

    analyses.forEach((analysis) => {
      try {
        if (analysis.report && typeof analysis.report === 'object') {
          const report = analysis.report as any;
          const model = report.model || 'claude-3-opus'; // Default
          const inputTokens = report.tokens?.input || report.inputTokens || 0;
          const outputTokens = report.tokens?.output || report.outputTokens || 0;

          if (!costsByModel[model]) {
            costsByModel[model] = { calls: 0, inputTokens: 0, outputTokens: 0 };
          }

          costsByModel[model].calls += 1;
          costsByModel[model].inputTokens += inputTokens;
          costsByModel[model].outputTokens += outputTokens;
        }
      } catch (e) {
        logger.error(`Error procesando análisis ${analysis.id}: ${e}`);
      }
    });

    // Calcular costos por modelo
    const entries: CostEntry[] = Object.entries(costsByModel).map(([model, data]) => {
      const prices = MODEL_PRICES[model] ?? DEFAULT_PRICE;
      const inputCost = data.inputTokens * prices.input;
      const outputCost = data.outputTokens * prices.output;
      const totalCost = inputCost + outputCost;

      return {
        model,
        calls: data.calls,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        costUSD: Math.round(totalCost * 100) / 100,
      };
    });

    const totalCostUSD = Math.round(
      entries.reduce((sum, entry) => sum + entry.costUSD, 0) * 100
    ) / 100;

    return { period, totalCostUSD, entries };
  } catch (error) {
    logger.error(`Error calculando costos: ${error}`);
    // Retornar estructura vacía si hay error
    return { period, totalCostUSD: 0, entries: [] };
  }
}

// ==================== ENDPOINTS ====================

/**
 * GET /api/v1/monitoring/agents
 * Lista de agentes con estado y ejecuciones
 */
router.get('/agents', async (_req: Request, res: Response) => {
  try {
    const { count, lastExecution } = await getCompletedAnalysisStats();
    const agentsWithCounts = AGENTS.map((agent) => ({
      ...agent,
      executionCount: count,
      lastExecution,
    }));
    res.json({ success: true, data: agentsWithCounts });
  } catch (error) {
    logger.error(`Error obteniendo agentes: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener agentes' });
  }
});

/**
 * GET /api/v1/monitoring/agents/:id
 * Detalles de un agente específico
 */
router.get('/agents/:id', async (req: Request, res: Response) => {
  try {
    const agent = AGENTS.find((a) => a.id === req.params['id']);

    if (!agent) {
      res.status(404).json({ success: false, error: 'Agente no encontrado' });
      return;
    }

    const { count, lastExecution } = await getCompletedAnalysisStats();
    res.json({
      success: true,
      data: { ...agent, executionCount: count, lastExecution },
    });
  } catch (error) {
    logger.error(`Error obteniendo agente: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener agente' });
  }
});

/**
 * GET /api/v1/monitoring/agents/:id/executions
 * Historial de ejecuciones de un agente
 */
router.get('/agents/:id/executions', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query['limit'] as string) || 10, 100);

    // Obtener últimos análisis
    const analyses = await prisma.analysis.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, createdAt: true, completedAt: true, status: true },
    });

    const executions: AgentExecution[] = analyses.map((analysis) => ({
      id: analysis.id,
      agentId: req.params['id']!,
      timestamp: analysis.createdAt,
      duration: analysis.completedAt
        ? analysis.completedAt.getTime() - analysis.createdAt.getTime()
        : Date.now() - analysis.createdAt.getTime(),
      status: analysis.status === 'COMPLETED' ? 'success' : 'pending',
      result: analysis.status === 'COMPLETED' ? 'Completado exitosamente' : 'En progreso',
    }));

    res.json({ success: true, data: executions });
  } catch (error) {
    logger.error(`Error obteniendo ejecuciones: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener ejecuciones' });
  }
});

/**
 * GET /api/v1/monitoring/system-metrics
 * Métricas del sistema en tiempo real
 */
router.get('/system-metrics', async (_req: Request, res: Response) => {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cpuUsage = await getCPUUsage();
    const diskUsage = await getDiskUsage();

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        usage: (usedMemory / totalMemory) * 100,
      },
      disk: {
        used: diskUsage?.used ?? 0,
        total: diskUsage?.total ?? 0,
        usage: diskUsage?.usage ?? 0,
      },
      uptime: process.uptime(),
    };

    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error(`Error obteniendo métricas del sistema: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener métricas del sistema' });
  }
});

/**
 * GET /api/v1/monitoring/costs
 * Costos por período (today, week, month)
 */
router.get('/costs', async (req: Request, res: Response) => {
  try {
    const period = (req.query['period'] as 'today' | 'week' | 'month') || 'month';

    if (!['today', 'week', 'month'].includes(period)) {
      res.status(400).json({ success: false, error: 'período inválido. Use: today, week, month' });
      return;
    }

    const costs = await calculateCosts(period);
    res.json({ success: true, data: costs });
  } catch (error) {
    logger.error(`Error obteniendo costos: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener costos' });
  }
});

/**
 * GET /api/v1/monitoring/dashboard
 * Combina todos los datos en una sola llamada
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    // Obtener todos los datos en paralelo
    const [agents, systemMetrics, costs] = await Promise.all([
      (async () => {
        const analyses = await prisma.analysis.findMany({
          select: { id: true, status: true },
        });
        return AGENTS.map((agent) => ({
          ...agent,
          executionCount: analyses.filter((a) => a.status === 'COMPLETED').length,
          lastExecution: new Date(Date.now() - Math.random() * 3600000),
        }));
      })(),
      getDashboardMetrics(),
      calculateCosts('month'),
    ]);

    res.json({
      success: true,
      data: {
        agents,
        systemMetrics,
        costs,
        recentExecutions: [],
      },
    });
  } catch (error) {
    logger.error(`Error obteniendo dashboard: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener dashboard' });
  }
});

/**
 * Helper para obtener métricas del dashboard
 */
async function getDashboardMetrics(): Promise<SystemMetrics> {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const cpuUsage = await getCPUUsage();
  const diskUsage = await getDiskUsage();

  return {
    timestamp: new Date(),
    cpu: { usage: cpuUsage, cores: cpus.length },
    memory: {
      used: usedMemory,
      total: totalMemory,
      usage: (usedMemory / totalMemory) * 100,
    },
    disk: diskUsage ?? { used: 0, total: 0, usage: 0 },
    uptime: process.uptime(),
  };
}

// ==================== PHASE 4: REAL-TIME MONITORING & FP LEARNING ====================

/**
 * GET /api/v1/monitoring/health
 * Get comprehensive system health metrics (PHASE 4.1)
 */
router.get('/health', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = await getSystemMetrics();
    const health = isHealthy(metrics);

    res.json({
      success: true,
      data: {
        cpu: metrics.cpu,
        memory: metrics.memory,
        disk: metrics.disk,
        uptime: formatUptime(metrics.uptime),
        uptimeSeconds: metrics.uptime,
        loadAverage: metrics.loadAverage,
        health,
        timestamp: metrics.timestamp,
      },
    });
  } catch (error) {
    logger.error(`Error fetching health metrics: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health metrics',
    });
  }
});

/**
 * GET /api/v1/monitoring/false-positives/stats
 * Get false positive learning statistics (PHASE 4.2)
 */
router.get('/false-positives/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false,
      });
    }

    const stats = await getFPStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(`Error fetching FP statistics: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/v1/monitoring/false-positives/patterns
 * Get learned false positive patterns
 */
router.get('/false-positives/patterns', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false,
      });
    }

    const patterns = await getLearnedPatterns();

    res.json({
      success: true,
      data: {
        patterns,
        count: patterns.length,
      },
    });
  } catch (error) {
    logger.error(`Error fetching FP patterns: ${error}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patterns',
    });
  }
});

export default router;
