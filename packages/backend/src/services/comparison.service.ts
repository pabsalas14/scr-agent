/**
 * ============================================================================
 * COMPARISON SERVICE - Comparación de análisis y usuarios
 * ============================================================================
 *
 * Proporciona capacidades de comparación:
 * - Dos usuarios (patrones de riesgo)
 * - Dos análisis (progreso)
 * - Tendencias en tiempo
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface UserComparison {
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  stats: Array<{
    userId: string;
    totalCommits: number;
    suspiciousCommits: number;
    riskScore: number;
    affectedRepos: number;
  }>;
  differences: {
    riskScoreDiff: number;
    commitsDiff: number;
    suspiciousDiff: number;
  };
}

export interface AnalysisComparison {
  analyses: Array<{
    id: string;
    projectName: string;
    completedAt: Date;
  }>;
  stats: Array<{
    analysisId: string;
    totalFindings: number;
    criticalFindings: number;
    highFindings: number;
    filesAffected: number;
  }>;
  differences: {
    findingsDiff: number;
    criticalDiff: number;
    highDiff: number;
  };
}

/**
 * Comparar dos usuarios
 */
export async function compareUsers(userId1: string, userId2: string): Promise<UserComparison | null> {
  try {
    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId1 } }),
      prisma.user.findUnique({ where: { id: userId2 } }),
    ]);

    if (!user1 || !user2) {
      return null;
    }

    // Obtener estadísticas
    const [events1, events2] = await Promise.all([
      prisma.forensicEvent.findMany({ where: { author: user1.email || '' } }),
      prisma.forensicEvent.findMany({ where: { author: user2.email || '' } }),
    ]);

    const stats = [
      {
        userId: user1.id,
        totalCommits: events1.length,
        suspiciousCommits: events1.filter(e => ['HIGH', 'CRITICAL'].includes(e.riskLevel || '')).length,
        riskScore: calculateRiskScore(events1),
        affectedRepos: new Set(events1.map(e => e.analysisId)).size,
      },
      {
        userId: user2.id,
        totalCommits: events2.length,
        suspiciousCommits: events2.filter(e => ['HIGH', 'CRITICAL'].includes(e.riskLevel || '')).length,
        riskScore: calculateRiskScore(events2),
        affectedRepos: new Set(events2.map(e => e.analysisId)).size,
      },
    ];

    return {
      users: [
        { id: user1.id, name: user1.name || '', email: user1.email || '' },
        { id: user2.id, name: user2.name || '', email: user2.email || '' },
      ],
      stats,
      differences: {
        riskScoreDiff: stats[0].riskScore - stats[1].riskScore,
        commitsDiff: stats[0].totalCommits - stats[1].totalCommits,
        suspiciousDiff: stats[0].suspiciousCommits - stats[1].suspiciousCommits,
      },
    };
  } catch (error) {
    logger.error(`Error comparando usuarios: ${error}`);
    return null;
  }
}

/**
 * Comparar dos análisis
 */
export async function compareAnalyses(
  analysisId1: string,
  analysisId2: string
): Promise<AnalysisComparison | null> {
  try {
    const [analysis1, analysis2] = await Promise.all([
      prisma.analysis.findUnique({
        where: { id: analysisId1 },
        include: { project: { select: { name: true } } },
      }),
      prisma.analysis.findUnique({
        where: { id: analysisId2 },
        include: { project: { select: { name: true } } },
      }),
    ]);

    if (!analysis1 || !analysis2) {
      return null;
    }

    // Obtener hallazgos
    const [findings1, findings2] = await Promise.all([
      prisma.finding.findMany({ where: { analysisId: analysisId1 } }),
      prisma.finding.findMany({ where: { analysisId: analysisId2 } }),
    ]);

    const stats = [
      {
        analysisId: analysis1.id,
        totalFindings: findings1.length,
        criticalFindings: findings1.filter(f => f.severity === 'CRITICAL').length,
        highFindings: findings1.filter(f => f.severity === 'HIGH').length,
        filesAffected: new Set(findings1.map(f => f.file)).size,
      },
      {
        analysisId: analysis2.id,
        totalFindings: findings2.length,
        criticalFindings: findings2.filter(f => f.severity === 'CRITICAL').length,
        highFindings: findings2.filter(f => f.severity === 'HIGH').length,
        filesAffected: new Set(findings2.map(f => f.file)).size,
      },
    ];

    return {
      analyses: [
        {
          id: analysis1.id,
          projectName: analysis1.project?.name || 'Unknown',
          completedAt: analysis1.completedAt || new Date(),
        },
        {
          id: analysis2.id,
          projectName: analysis2.project?.name || 'Unknown',
          completedAt: analysis2.completedAt || new Date(),
        },
      ],
      stats,
      differences: {
        findingsDiff: stats[0].totalFindings - stats[1].totalFindings,
        criticalDiff: stats[0].criticalFindings - stats[1].criticalFindings,
        highDiff: stats[0].highFindings - stats[1].highFindings,
      },
    };
  } catch (error) {
    logger.error(`Error comparando análisis: ${error}`);
    return null;
  }
}

/**
 * Obtener tendencia de comparación entre periodos
 */
export async function comparePeriods(
  analysisId: string,
  days1: number,
  days2: number
) {
  try {
    const now = new Date();
    const startPeriod2 = new Date(now.getTime() - days2 * 24 * 60 * 60 * 1000);
    const startPeriod1 = new Date(now.getTime() - days1 * 24 * 60 * 60 * 1000);
    const endPeriod1 = new Date(now.getTime() - (days1 - days2) * 24 * 60 * 60 * 1000);

    const [events1, events2] = await Promise.all([
      prisma.forensicEvent.findMany({
        where: {
          analysisId,
          timestamp: {
            gte: startPeriod1,
            lte: endPeriod1,
          },
        },
      }),
      prisma.forensicEvent.findMany({
        where: {
          analysisId,
          timestamp: {
            gte: startPeriod2,
            lte: now,
          },
        },
      }),
    ]);

    const stats = [
      {
        period: `${days1} days ago`,
        totalEvents: events1.length,
        criticalEvents: events1.filter(e => e.riskLevel === 'CRITICAL').length,
        avgRisk: calculateRiskScore(events1) / Math.max(events1.length, 1),
      },
      {
        period: `Last ${days2} days`,
        totalEvents: events2.length,
        criticalEvents: events2.filter(e => e.riskLevel === 'CRITICAL').length,
        avgRisk: calculateRiskScore(events2) / Math.max(events2.length, 1),
      },
    ];

    return {
      analysisId,
      periods: {
        period1: `${days1 - days2}-${days1} days ago`,
        period2: `Last ${days2} days`,
      },
      stats,
      trend: {
        eventsTrend: events2.length - events1.length,
        criticalTrend: stats[1].criticalEvents - stats[0].criticalEvents,
        riskTrend: stats[1].avgRisk - stats[0].avgRisk,
      },
    };
  } catch (error) {
    logger.error(`Error comparando periodos: ${error}`);
    return null;
  }
}

/**
 * Comparar proyectos
 */
export async function compareProjects(projectId1: string, projectId2: string) {
  try {
    const [analyses1, analyses2] = await Promise.all([
      prisma.analysis.findMany({ where: { projectId: projectId1 } }),
      prisma.analysis.findMany({ where: { projectId: projectId2 } }),
    ]);

    // Obtener todos los hallazgos para ambos proyectos
    const allAnalysisIds1 = analyses1.map(a => a.id);
    const allAnalysisIds2 = analyses2.map(a => a.id);

    const [findings1, findings2] = await Promise.all([
      prisma.finding.findMany({
        where: { analysisId: { in: allAnalysisIds1 } },
      }),
      prisma.finding.findMany({
        where: { analysisId: { in: allAnalysisIds2 } },
      }),
    ]);

    const stats = [
      {
        projectId: projectId1,
        totalAnalyses: analyses1.length,
        totalFindings: findings1.length,
        criticalFindings: findings1.filter(f => f.severity === 'CRITICAL').length,
        avgFindingsPerAnalysis: Math.round(findings1.length / Math.max(analyses1.length, 1)),
      },
      {
        projectId: projectId2,
        totalAnalyses: analyses2.length,
        totalFindings: findings2.length,
        criticalFindings: findings2.filter(f => f.severity === 'CRITICAL').length,
        avgFindingsPerAnalysis: Math.round(findings2.length / Math.max(analyses2.length, 1)),
      },
    ];

    return {
      projects: [
        { projectId: projectId1 },
        { projectId: projectId2 },
      ],
      stats,
      differences: {
        findingsDiff: stats[0].totalFindings - stats[1].totalFindings,
        criticalDiff: stats[0].criticalFindings - stats[1].criticalFindings,
      },
    };
  } catch (error) {
    logger.error(`Error comparando proyectos: ${error}`);
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateRiskScore(events: any[]): number {
  let score = 0;
  for (const event of events) {
    if (event.riskLevel === 'CRITICAL') score += 100;
    else if (event.riskLevel === 'HIGH') score += 75;
    else if (event.riskLevel === 'MEDIUM') score += 50;
    else score += 25;
  }
  return score;
}
