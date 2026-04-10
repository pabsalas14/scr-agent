/**
 * ============================================================================
 * USER SEARCH SERVICE - Búsqueda y perfilado de usuarios
 * ============================================================================
 *
 * Permite buscar usuarios y construir perfil de actividad forense
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

/**
 * Buscar usuarios por nombre o email (fuzzy search)
 */
export async function searchUsers(
  query: string,
  options?: {
    limit?: number;
  }
) {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const limit = Math.min(options?.limit || 20, 100);

    // Buscar por nombre o email (case-insensitive)
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
      take: limit,
    });

    return users;
  } catch (error) {
    logger.error(`Error searching users: ${error}`);
    return [];
  }
}

/**
 * Obtener perfil completo de usuario con estadísticas
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return null;
    }

    // Obtener estadísticas
    const [totalCommits, suspiciousCommits, affectedRepos] = await Promise.all([
      // Total de commits del usuario
      prisma.forensicEvent.count({
        where: { author: user.email || '' },
      }),

      // Commits con hallazgos
      prisma.forensicEvent.count({
        where: {
          author: user.email || '',
          riskLevel: { in: ['HIGH', 'CRITICAL'] },
        },
      }),

      // Repos afectados
      prisma.forensicEvent.findMany({
        where: { author: user.email || '' },
        distinct: ['analysisId'],
        select: { analysisId: true },
      }).then(events =>
        Promise.all(
          events.map(e =>
            prisma.analysis.findUnique({
              where: { id: e.analysisId },
              select: { project: { select: { id: true, name: true } } },
            })
          )
        )
      ),
    ]);

    return {
      ...user,
      stats: {
        totalCommits,
        suspiciousCommits,
        affectedRepos: [...new Set(affectedRepos.map(r => r?.project?.id))].length,
        suspicionRate:
          totalCommits > 0 ? ((suspiciousCommits / totalCommits) * 100).toFixed(1) + '%' : '0%',
      },
    };
  } catch (error) {
    logger.error(`Error getting user profile: ${error}`);
    return null;
  }
}

/**
 * Obtener actividad de usuario en un rango de tiempo
 */
export async function getUserActivityTimeline(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return [];
    }

    const limit = Math.min(options?.limit || 50, 200);
    const offset = options?.offset || 0;

    const where: any = {
      author: user.email,
    };

    if (options?.severity) {
      where.riskLevel = options.severity;
    }

    const events = await prisma.forensicEvent.findMany({
      where,
      include: {
        analysis: {
          select: {
            id: true,
            project: { select: { name: true } },
          },
        },
        finding: {
          select: { severity: true, riskType: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip: offset,
      take: limit,
    });

    return events;
  } catch (error) {
    logger.error(`Error getting user timeline: ${error}`);
    return [];
  }
}

/**
 * Obtener repos donde el usuario ha hecho commits
 */
export async function getUserRepos(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return [];
    }

    // Agrupar eventos por análisis para obtener repos
    const repoEvents = await prisma.forensicEvent.findMany({
      where: { author: user.email },
      distinct: ['analysisId'],
      include: {
        analysis: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
                repositoryUrl: true,
              },
            },
          },
        },
      },
    });

    // Agrupar y contar
    const repoMap = new Map<
      string,
      {
        repoId: string;
        repoName: string;
        repositoryUrl: string;
        commitCount: number;
        suspiciousCount: number;
      }
    >();

    for (const event of repoEvents) {
      const repo = event.analysis?.project;
      if (!repo) continue;

      const key = repo.id;
      if (!repoMap.has(key)) {
        repoMap.set(key, {
          repoId: repo.id,
          repoName: repo.name,
          repositoryUrl: repo.repositoryUrl,
          commitCount: 0,
          suspiciousCount: 0,
        });
      }

      const stats = repoMap.get(key)!;
      stats.commitCount++;
      if (event.riskLevel === 'HIGH' || event.riskLevel === 'CRITICAL') {
        stats.suspiciousCount++;
      }
    }

    return Array.from(repoMap.values());
  } catch (error) {
    logger.error(`Error getting user repos: ${error}`);
    return [];
  }
}

/**
 * Calcular risk score agregado de usuario
 */
export async function getUserRiskScore(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return { score: 0, breakdown: {} };
    }

    // Contar eventos por severidad
    const events = await prisma.forensicEvent.findMany({
      where: { author: user.email },
      select: { riskLevel: true },
    });

    const breakdown = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    for (const event of events) {
      if (event.riskLevel in breakdown) {
        breakdown[event.riskLevel as keyof typeof breakdown]++;
      }
    }

    // Calcular score: CRITICAL=10, HIGH=5, MEDIUM=2, LOW=1
    const score =
      breakdown.CRITICAL * 10 + breakdown.HIGH * 5 + breakdown.MEDIUM * 2 + breakdown.LOW * 1;

    // Normalizar a 0-100
    const maxScore = events.length * 10;
    const normalizedScore = maxScore > 0 ? Math.min(100, (score / maxScore) * 100) : 0;

    return {
      score: Math.round(normalizedScore),
      breakdown,
      totalEvents: events.length,
    };
  } catch (error) {
    logger.error(`Error calculating user risk score: ${error}`);
    return { score: 0, breakdown: {} };
  }
}
