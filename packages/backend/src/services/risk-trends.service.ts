/**
 * ============================================================================
 * RISK TRENDS SERVICE - Análisis de tendencias de riesgo
 * ============================================================================
 *
 * Proporciona datos de tendencias de riesgo para:
 * - Gráficos de tendencia (tiempo)
 * - Comparativas entre usuarios/proyectos
 * - Predicciones simples de riesgo
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface RiskTrendPoint {
  timestamp: Date;
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
    start: Date;
    end: Date;
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

/**
 * Obtener tendencia de riesgo para un usuario
 */
export async function getUserRiskTrend(
  userId: string,
  options?: {
    days?: number;
    interval?: 'daily' | 'weekly' | 'monthly';
  }
): Promise<RiskTrend | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user?.email) {
      return null;
    }

    const days = options?.days || 30;
    const interval = options?.interval || 'daily';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener eventos del usuario en el período
    const events = await prisma.forensicEvent.findMany({
      where: {
        author: user.email,
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
        riskLevel: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Agrupar por intervalo
    const grouped = groupEventsByInterval(events, interval);

    // Calcular scores por intervalo
    const trendPoints = Array.from(grouped.entries()).map(([dateStr, eventList]) => {
      const score = calculateIntervalScore(eventList);
      const breakdown = countBySeverity(eventList);

      return {
        timestamp: new Date(dateStr),
        date: dateStr,
        score,
        eventCount: eventList.length,
        criticalCount: breakdown.CRITICAL,
        highCount: breakdown.HIGH,
        mediumCount: breakdown.MEDIUM,
        lowCount: breakdown.LOW,
      };
    });

    // Calcular estadísticas
    const scores = trendPoints.map(p => p.score);
    const stats = {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)),
      maximum: Math.max(...scores, 0),
      minimum: Math.min(...scores, 100),
      trend: calculateTrendDirection(scores),
      changePercent: calculateChangePercent(scores),
    };

    return {
      entity: user.name,
      entityType: 'user',
      period: { start: startDate, end: new Date() },
      trend: trendPoints,
      statistics: stats,
    };
  } catch (error) {
    logger.error(`Error obteniendo user risk trend: ${error}`);
    return null;
  }
}

/**
 * Obtener tendencia de riesgo para un proyecto
 */
export async function getProjectRiskTrend(
  projectId: string,
  options?: {
    days?: number;
    interval?: 'daily' | 'weekly' | 'monthly';
  }
): Promise<RiskTrend | null> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      return null;
    }

    const days = options?.days || 30;
    const interval = options?.interval || 'daily';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener eventos del proyecto
    const events = await prisma.forensicEvent.findMany({
      where: {
        analysis: { projectId },
        timestamp: { gte: startDate },
      },
      select: {
        timestamp: true,
        riskLevel: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Agrupar por intervalo
    const grouped = groupEventsByInterval(events, interval);

    // Calcular scores
    const trendPoints = Array.from(grouped.entries()).map(([dateStr, eventList]) => {
      const score = calculateIntervalScore(eventList);
      const breakdown = countBySeverity(eventList);

      return {
        timestamp: new Date(dateStr),
        date: dateStr,
        score,
        eventCount: eventList.length,
        criticalCount: breakdown.CRITICAL,
        highCount: breakdown.HIGH,
        mediumCount: breakdown.MEDIUM,
        lowCount: breakdown.LOW,
      };
    });

    // Calcular estadísticas
    const scores = trendPoints.map(p => p.score);
    const stats = {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)),
      maximum: Math.max(...scores, 0),
      minimum: Math.min(...scores, 100),
      trend: calculateTrendDirection(scores),
      changePercent: calculateChangePercent(scores),
    };

    return {
      entity: project.name,
      entityType: 'project',
      period: { start: startDate, end: new Date() },
      trend: trendPoints,
      statistics: stats,
    };
  } catch (error) {
    logger.error(`Error obteniendo project risk trend: ${error}`);
    return null;
  }
}

/**
 * Obtener tendencia de riesgo global
 */
export async function getGlobalRiskTrend(options?: {
  days?: number;
  interval?: 'daily' | 'weekly' | 'monthly';
}): Promise<RiskTrend | null> {
  try {
    const days = options?.days || 30;
    const interval = options?.interval || 'daily';
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Obtener todos los eventos
    const events = await prisma.forensicEvent.findMany({
      where: { timestamp: { gte: startDate } },
      select: { timestamp: true, riskLevel: true },
      orderBy: { timestamp: 'asc' },
    });

    // Agrupar por intervalo
    const grouped = groupEventsByInterval(events, interval);

    // Calcular scores
    const trendPoints = Array.from(grouped.entries()).map(([dateStr, eventList]) => {
      const score = calculateIntervalScore(eventList);
      const breakdown = countBySeverity(eventList);

      return {
        timestamp: new Date(dateStr),
        date: dateStr,
        score,
        eventCount: eventList.length,
        criticalCount: breakdown.CRITICAL,
        highCount: breakdown.HIGH,
        mediumCount: breakdown.MEDIUM,
        lowCount: breakdown.LOW,
      };
    });

    // Calcular estadísticas
    const scores = trendPoints.map(p => p.score);
    const stats = {
      average: Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(scores.length, 1)),
      maximum: Math.max(...scores, 0),
      minimum: Math.min(...scores, 100),
      trend: calculateTrendDirection(scores),
      changePercent: calculateChangePercent(scores),
    };

    return {
      entity: 'Global',
      entityType: 'global',
      period: { start: startDate, end: new Date() },
      trend: trendPoints,
      statistics: stats,
    };
  } catch (error) {
    logger.error(`Error obteniendo global risk trend: ${error}`);
    return null;
  }
}

/**
 * Comparar tendencias de riesgo entre múltiples usuarios
 */
export async function compareUserRiskTrends(
  userIds: string[],
  options?: {
    days?: number;
    interval?: 'daily' | 'weekly' | 'monthly';
  }
): Promise<Map<string, RiskTrend | null>> {
  const results = new Map<string, RiskTrend | null>();

  for (const userId of userIds) {
    const trend = await getUserRiskTrend(userId, options);
    results.set(userId, trend);
  }

  return results;
}

/**
 * Agrupar eventos por intervalo de tiempo
 */
function groupEventsByInterval(
  events: any[],
  interval: 'daily' | 'weekly' | 'monthly'
): Map<string, any[]> {
  const grouped = new Map<string, any[]>();

  events.forEach(event => {
    const date = new Date(event.timestamp);
    let key: string;

    if (interval === 'daily') {
      key = date.toISOString().split('T')[0];
    } else if (interval === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // monthly
      key = date.toISOString().slice(0, 7); // YYYY-MM
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(event);
  });

  return grouped;
}

/**
 * Calcular score para intervalo
 */
function calculateIntervalScore(events: any[]): number {
  if (events.length === 0) return 0;

  const severityMap = {
    CRITICAL: 10,
    HIGH: 5,
    MEDIUM: 2,
    LOW: 1,
  };

  const totalScore = events.reduce((sum, event) => {
    const weight = severityMap[event.riskLevel as keyof typeof severityMap] || 1;
    return sum + weight;
  }, 0);

  const maxScore = events.length * 10;
  return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
}

/**
 * Contar eventos por severidad
 */
function countBySeverity(
  events: any[]
): { CRITICAL: number; HIGH: number; MEDIUM: number; LOW: number } {
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

  events.forEach(event => {
    if (event.riskLevel in counts) {
      counts[event.riskLevel as keyof typeof counts]++;
    }
  });

  return counts;
}

/**
 * Determinar dirección de tendencia
 */
function calculateTrendDirection(scores: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (scores.length < 2) return 'stable';

  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));

  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / Math.max(firstHalf.length, 1);
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / Math.max(secondHalf.length, 1);

  const diff = avgSecond - avgFirst;
  const changePercent = avgFirst > 0 ? (diff / avgFirst) * 100 : 0;

  if (changePercent > 15) return 'increasing';
  if (changePercent < -15) return 'decreasing';
  return 'stable';
}

/**
 * Calcular porcentaje de cambio entre inicio y fin
 */
function calculateChangePercent(scores: number[]): number {
  if (scores.length < 2) return 0;

  const first = scores[0];
  const last = scores[scores.length - 1];

  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100);
}
