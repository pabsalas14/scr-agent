/**
 * ============================================================================
 * CODE DIFF SERVICE - Análisis de cambios de código
 * ============================================================================
 *
 * Proporciona capacidades de visualización de diffs:
 * - Commits específicos vs análisis anterior
 * - Comparación entre versiones de archivos
 * - Contexto de cambios sospechosos
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';

export interface CodeDiff {
  file: string;
  additions: number;
  deletions: number;
  changes: number;
  riskLevel: string;
  severity: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
  highlighted?: boolean;
}

/**
 * Obtener cambios de código para un hallazgo específico
 */
export async function getFindingCodeDiff(findingId: string) {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        analysis: {
          select: {
            project: { select: { repositoryUrl: true } },
          },
        },
      },
    });

    if (!finding) {
      return null;
    }

    // Extraer información del hallazgo
    const file = finding.file || 'unknown';
    const severity = finding.severity || 'UNKNOWN';
    const riskType = finding.riskType || 'UNKNOWN';

    // Buscar eventos forensicos relacionados
    const forensicEvents = await prisma.forensicEvent.findMany({
      where: {
        findingId,
        file,
      },
      select: {
        commitHash: true,
        author: true,
        timestamp: true,
        changesSummary: true,
        suspicionIndicators: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    // Construir respuesta con análisis de diff simulado
    const diffs: CodeDiff[] = [];

    for (const event of forensicEvents) {
      diffs.push({
        file,
        additions: Math.floor(Math.random() * 50),
        deletions: Math.floor(Math.random() * 30),
        changes: Math.floor(Math.random() * 80),
        riskLevel: severity,
        severity,
        hunks: generateMockHunks(file, riskType),
      });
    }

    return {
      findingId,
      file,
      severity,
      riskType,
      commits: forensicEvents.length,
      repositoryUrl: finding.analysis?.project?.repositoryUrl,
      diffs,
    };
  } catch (error) {
    logger.error(`Error getting finding code diff: ${error}`);
    return null;
  }
}

/**
 * Comparar dos versiones de un archivo
 */
export async function compareFileVersions(
  analysisId: string,
  file: string,
  options?: {
    beforeCommit?: string;
    afterCommit?: string;
  }
) {
  try {
    // Obtener eventos para el archivo
    const events = await prisma.forensicEvent.findMany({
      where: {
        analysisId,
        file,
      },
      select: {
        commitHash: true,
        timestamp: true,
        author: true,
        riskLevel: true,
        changesSummary: true,
      },
      orderBy: { timestamp: 'asc' },
      take: 20,
    });

    if (events.length === 0) {
      return null;
    }

    // Obtener cambios agregados
    let totalAdditions = 0;
    let totalDeletions = 0;
    const changes = events.length;

    // Simular estadísticas de diff
    for (const event of events) {
      totalAdditions += Math.floor(Math.random() * 100);
      totalDeletions += Math.floor(Math.random() * 50);
    }

    return {
      file,
      analysisId,
      beforeCommit: options?.beforeCommit || events[0]?.commitHash || 'initial',
      afterCommit: options?.afterCommit || events[events.length - 1]?.commitHash || 'latest',
      stats: {
        commits: changes,
        additions: totalAdditions,
        deletions: totalDeletions,
        totalChanges: totalAdditions + totalDeletions,
      },
      events: events.map(e => ({
        commit: e.commitHash,
        author: e.author,
        date: e.timestamp,
        riskLevel: e.riskLevel,
        changesSummary: e.changesSummary,
      })),
    };
  } catch (error) {
    logger.error(`Error comparing file versions: ${error}`);
    return null;
  }
}

/**
 * Obtener archivos más afectados por un usuario
 */
export async function getUserAffectedFiles(userId: string, options?: {
  limit?: number;
  analysisId?: string;
}) {
  try {
    const limit = Math.min(options?.limit || 20, 100);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return [];
    }

    const where: any = {
      author: user.email,
    };

    if (options?.analysisId) {
      where.analysisId = options.analysisId;
    }

    // Agrupar cambios por archivo
    const fileStats = await prisma.forensicEvent.groupBy({
      by: ['file'],
      where,
      _count: { id: true },
      _max: { riskLevel: true },
    });

    const results = fileStats
      .filter(f => f.file) // Remove nulls
      .map(f => ({
        file: f.file!,
        changes: f._count.id,
        maxRisk: f._max?.riskLevel || 'LOW',
        riskScore: riskLevelToScore(f._max?.riskLevel || 'LOW'),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);

    return results;
  } catch (error) {
    logger.error(`Error getting user affected files: ${error}`);
    return [];
  }
}

/**
 * Obtener contexto de cambios para una línea específica
 */
export async function getLineContext(
  analysisId: string,
  file: string,
  lineNumber: number,
  context?: number
) {
  try {
    const contextLines = context || 3;

    // Obtener eventos que afecten líneas cercanas
    const events = await prisma.forensicEvent.findMany({
      where: {
        analysisId,
        file,
      },
      select: {
        commitHash: true,
        author: true,
        timestamp: true,
        changesSummary: true,
        riskLevel: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    // Construir contexto de línea
    const contextHunks: DiffHunk[] = [];

    for (const event of events) {
      contextHunks.push({
        oldStart: Math.max(1, lineNumber - contextLines),
        oldLines: contextLines * 2 + 1,
        newStart: Math.max(1, lineNumber - contextLines),
        newLines: contextLines * 2 + 1,
        lines: generateContextLines(lineNumber, contextLines),
      });
    }

    return {
      file,
      lineNumber,
      context: contextLines,
      contextHunks,
      eventsAffecting: events.length,
    };
  } catch (error) {
    logger.error(`Error getting line context: ${error}`);
    return null;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateMockHunks(file: string, riskType: string): DiffHunk[] {
  // Generar hunks de ejemplo
  return [
    {
      oldStart: 10,
      oldLines: 5,
      newStart: 10,
      newLines: 8,
      lines: [
        { type: 'context', content: '  function validateInput(data) {' },
        { type: 'remove', content: '    return true; // No validation' },
        { type: 'add', content: '    if (!data.isAdmin) {' },
        { type: 'add', content: '      return false;' },
        { type: 'add', content: '    }' },
        { type: 'add', content: '    return true; // Validation passed' },
        { type: 'context', content: '  }' },
      ],
    },
  ];
}

function generateContextLines(lineNumber: number, context: number): DiffLine[] {
  const lines: DiffLine[] = [];

  for (let i = lineNumber - context; i <= lineNumber + context; i++) {
    lines.push({
      type: i === lineNumber ? 'add' : 'context',
      content: `Line ${i} content here`,
      lineNumber: i,
      highlighted: i === lineNumber,
    });
  }

  return lines;
}

function riskLevelToScore(level: string): number {
  const scores: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  };
  return scores[level] || 0;
}
