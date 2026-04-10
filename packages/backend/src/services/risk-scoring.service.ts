/**
 * ============================================================================
 * RISK SCORING SERVICE - Cálculo avanzado de riesgo de usuarios
 * ============================================================================
 *
 * Calcula scores de riesgo basados en:
 * - Patrones de actividad (concentración temporal, repos)
 * - Historial de eventos sospechosos
 * - Tendencias de riesgo (escalación, cambios)
 * - Análisis comparativo (percentiles)
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface RiskFactors {
  eventSeverity: number; // Basado en CRITICAL/HIGH/MEDIUM/LOW
  activityConcentration: number; // Cuántos eventos en período corto
  repoSpreadRisk: number; // Eventos distribuidos en muchos repos (0-100)
  timePatternRisk: number; // Anomalías en patrones de tiempo (0-100)
  escalationRisk: number; // Aumento en eventos sospechosos (0-100)
}

export interface RiskScoreDetail {
  userId: string;
  score: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactors;
  percentile: number; // 0-100, comparativo a otros usuarios
  trend: 'stable' | 'increasing' | 'decreasing';
  trendChange: number; // % de cambio en último período
  lastUpdated: Date;
}

/**
 * Calcular score de riesgo avanzado para usuario
 */
export async function calculateAdvancedRiskScore(userId: string): Promise<RiskScoreDetail> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return {
        userId,
        score: 0,
        level: 'LOW',
        factors: {
          eventSeverity: 0,
          activityConcentration: 0,
          repoSpreadRisk: 0,
          timePatternRisk: 0,
          escalationRisk: 0,
        },
        percentile: 0,
        trend: 'stable',
        trendChange: 0,
        lastUpdated: new Date(),
      };
    }

    // Obtener todos los eventos del usuario
    const events = await prisma.forensicEvent.findMany({
      where: { author: user.email },
      select: {
        riskLevel: true,
        timestamp: true,
        analysisId: true,
      },
      orderBy: { timestamp: 'desc' },
    });

    if (events.length === 0) {
      return {
        userId,
        score: 0,
        level: 'LOW',
        factors: {
          eventSeverity: 0,
          activityConcentration: 0,
          repoSpreadRisk: 0,
          timePatternRisk: 0,
          escalationRisk: 0,
        },
        percentile: 0,
        trend: 'stable',
        trendChange: 0,
        lastUpdated: new Date(),
      };
    }

    // Calcular factores de riesgo
    const eventSeverity = calculateEventSeverityFactor(events);
    const activityConcentration = calculateActivityConcentrationFactor(events);
    const repoSpreadRisk = await calculateRepoSpreadRisk(events);
    const timePatternRisk = calculateTimePatternRisk(events);
    const escalationRisk = calculateEscalationRisk(events);

    // Calcular score final (promedio ponderado)
    const weights = {
      eventSeverity: 0.35,
      activityConcentration: 0.20,
      repoSpreadRisk: 0.15,
      timePatternRisk: 0.15,
      escalationRisk: 0.15,
    };

    const score =
      eventSeverity * weights.eventSeverity +
      activityConcentration * weights.activityConcentration +
      repoSpreadRisk * weights.repoSpreadRisk +
      timePatternRisk * weights.timePatternRisk +
      escalationRisk * weights.escalationRisk;

    const normalizedScore = Math.round(Math.min(100, score));
    const level = getRiskLevel(normalizedScore);

    // Calcular percentil (comparado a otros usuarios)
    const percentile = await calculateUserPercentile(normalizedScore);

    // Calcular tendencia
    const { trend, trendChange } = calculateTrendData(events);

    return {
      userId,
      score: normalizedScore,
      level,
      factors: {
        eventSeverity,
        activityConcentration,
        repoSpreadRisk,
        timePatternRisk,
        escalationRisk,
      },
      percentile,
      trend,
      trendChange,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Error calculando risk score avanzado: ${error}`);
    throw error;
  }
}

/**
 * Factor de severidad de eventos
 * CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1
 * Normalizar a 0-100
 */
function calculateEventSeverityFactor(events: any[]): number {
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
 * Factor de concentración de actividad
 * Muchos eventos en período corto = mayor riesgo
 */
function calculateActivityConcentrationFactor(events: any[]): number {
  if (events.length < 2) return 0;

  // Agrupar eventos por hora
  const hourGroups = new Map<string, number>();
  events.forEach(event => {
    const hour = new Date(event.timestamp).toISOString().slice(0, 13);
    hourGroups.set(hour, (hourGroups.get(hour) || 0) + 1);
  });

  // Calcular desviación estándar de eventos por hora
  const counts = Array.from(hourGroups.values());
  const average = counts.length > 0 ? counts.reduce((a, b) => a + b) / counts.length : 0;
  const variance =
    counts.length > 0 ? counts.reduce((sum, count) => sum + Math.pow(count - average, 2)) / counts.length : 0;
  const stdDev = Math.sqrt(variance);

  // Normalizar a 0-100 (mayor desviación = mayor concentración = mayor riesgo)
  // Usar máximo de 5 como referencia
  return Math.min(100, Math.round((stdDev / 5) * 100));
}

/**
 * Factor de dispersión en repositorios
 * Eventos en muchos repos distintos = menor riesgo
 * Eventos concentrados en pocos repos = mayor riesgo
 */
async function calculateRepoSpreadRisk(events: any[]): Promise<number> {
  const analysisIds = [...new Set(events.map(e => e.analysisId))];

  if (analysisIds.length === 0) return 0;

  const repos = await prisma.analysis.findMany({
    where: { id: { in: analysisIds } },
    select: { id: true, projectId: true },
  });

  const uniqueRepos = new Set(repos.map(r => r.projectId));
  const repoCount = uniqueRepos.size;
  const analysisCount = analysisIds.length;

  // Si eventos distribuidos en muchos repos, riesgo menor
  // Si concentrados en pocos repos, riesgo mayor
  const spreadRatio = repoCount / Math.max(analysisCount, 1);
  const concentrationFactor = 1 - spreadRatio; // 0 (muy disperso) a 1 (muy concentrado)

  return Math.round(concentrationFactor * 100);
}

/**
 * Factor de anomalías en patrón de tiempo
 * Actividad fuera de horas normales = mayor riesgo
 */
function calculateTimePatternRisk(events: any[]): number {
  if (events.length < 5) return 0;

  let offHoursCount = 0;
  let weekendCount = 0;

  events.forEach(event => {
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    const day = date.getDay();

    // Off-hours: 22:00 a 06:00
    if (hour >= 22 || hour < 6) {
      offHoursCount++;
    }

    // Weekend: sábado (6) o domingo (0)
    if (day === 0 || day === 6) {
      weekendCount++;
    }
  });

  const offHoursRatio = offHoursCount / events.length;
  const weekendRatio = weekendCount / events.length;

  // Factor combinado: 0-100
  // Esperado: ~25% off-hours, ~29% weekend
  // Mayor desviación = mayor riesgo
  const expectedOffHours = 0.33; // 8 horas off-hours / 24
  const expectedWeekend = 0.29; // 2 días / 7

  const offHoursDelta = Math.abs(offHoursRatio - expectedOffHours);
  const weekendDelta = Math.abs(weekendRatio - expectedWeekend);

  return Math.round((offHoursDelta + weekendDelta) * 100);
}

/**
 * Factor de escalación de riesgo
 * Aumento en eventos sospechosos = mayor riesgo
 */
function calculateEscalationRisk(events: any[]): number {
  if (events.length < 10) return 0;

  // Dividir en períodos: primeros 50% vs últimos 50%
  const midpoint = Math.floor(events.length / 2);
  const olderEvents = events.slice(midpoint);
  const recentEvents = events.slice(0, midpoint);

  // Contar HIGH+CRITICAL en cada período
  const countHighSeverity = (eventList: any[]) =>
    eventList.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length;

  const olderHighCount = countHighSeverity(olderEvents);
  const recentHighCount = countHighSeverity(recentEvents);

  if (olderHighCount === 0) {
    return recentHighCount > 0 ? 50 : 0;
  }

  const escalationRatio = (recentHighCount - olderHighCount) / olderHighCount;
  const escalationPercent = Math.min(100, escalationRatio * 100);

  return Math.max(0, Math.round(escalationPercent));
}

/**
 * Obtener nivel de riesgo basado en score
 */
function getRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (score < 25) return 'LOW';
  if (score < 50) return 'MEDIUM';
  if (score < 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Calcular percentil del usuario comparado a otros
 */
async function calculateUserPercentile(userScore: number): Promise<number> {
  try {
    // Obtener todos los users con sus scores
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });

    let usersBelowScore = 0;

    // Calcular scores para todos los usuarios
    for (const u of allUsers) {
      const basicScore = await getBasicRiskScore(u.id);
      if (basicScore < userScore) {
        usersBelowScore++;
      }
    }

    return Math.round((usersBelowScore / Math.max(allUsers.length, 1)) * 100);
  } catch (error) {
    logger.error(`Error calculando percentil: ${error}`);
    return 0;
  }
}

/**
 * Obtener score básico rápidamente (sin cálculos avanzados)
 */
async function getBasicRiskScore(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user?.email) return 0;

  const events = await prisma.forensicEvent.findMany({
    where: { author: user.email },
    select: { riskLevel: true },
  });

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
  return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
}

/**
 * Calcular tendencia de riesgo (histórico)
 */
function calculateTrendData(
  events: any[]
): {
  trend: 'stable' | 'increasing' | 'decreasing';
  trendChange: number;
} {
  if (events.length < 10) {
    return { trend: 'stable', trendChange: 0 };
  }

  // Dividir en 3 períodos
  const period = Math.floor(events.length / 3);
  const oldest = events.slice(2 * period); // Período más antiguo
  const middle = events.slice(period, 2 * period); // Período medio
  const recent = events.slice(0, period); // Período más reciente

  const countSuspicious = (eventList: any[]) =>
    eventList.filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL').length;

  const oldestCount = countSuspicious(oldest);
  const middleCount = countSuspicious(middle);
  const recentCount = countSuspicious(recent);

  // Calcular cambio
  const change = recentCount - oldestCount;
  const changePercent = oldestCount > 0 ? (change / oldestCount) * 100 : 0;

  let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
  if (changePercent > 15) {
    trend = 'increasing';
  } else if (changePercent < -15) {
    trend = 'decreasing';
  }

  return {
    trend,
    trendChange: Math.round(changePercent),
  };
}

/**
 * Obtener histórico de scores de riesgo
 */
export async function getRiskScoreHistory(
  userId: string,
  options?: {
    days?: number;
    limit?: number;
  }
) {
  try {
    const days = options?.days || 30;
    const limit = Math.min(options?.limit || 50, 200);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return [];
    }

    // Obtener eventos agrupados por día
    const eventsByDay = await prisma.forensicEvent.findMany({
      where: {
        author: user.email,
        timestamp: { gte: startDate },
      },
      select: { timestamp: true, riskLevel: true },
      orderBy: { timestamp: 'desc' },
    });

    // Agrupar por fecha y calcular score
    const dailyScores = new Map<string, { date: string; score: number; eventCount: number }>();

    eventsByDay.forEach(event => {
      const dateStr = new Date(event.timestamp).toISOString().split('T')[0];
      const current = dailyScores.get(dateStr) || { date: dateStr, score: 0, eventCount: 0 };

      const severityMap = {
        CRITICAL: 10,
        HIGH: 5,
        MEDIUM: 2,
        LOW: 1,
      };

      const weight = severityMap[event.riskLevel as keyof typeof severityMap] || 1;
      current.score += weight;
      current.eventCount += 1;
      dailyScores.set(dateStr, current);
    });

    // Normalizar scores y retornar
    return Array.from(dailyScores.values())
      .map(d => ({
        ...d,
        score: Math.min(100, Math.round((d.score / (d.eventCount * 10)) * 100)),
      }))
      .slice(0, limit);
  } catch (error) {
    logger.error(`Error obteniendo histórico de risk score: ${error}`);
    return [];
  }
}
