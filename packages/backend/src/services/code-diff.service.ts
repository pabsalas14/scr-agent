/**
 * ============================================================================
 * CODE DIFF SERVICE - Diffs reales vía Git (repositorio del proyecto)
 * ============================================================================
 */

import { logger } from './logger.service';
import { prisma } from './prisma.service';
import { gitService } from './git.service';
import { decrypt } from './crypto.service';

import type { CodeDiff, DiffHunk, DiffLine } from './code-diff.service.types';

// Re-export types (mantener API estable para rutas)
export type { CodeDiff, DiffHunk, DiffLine } from './code-diff.service.types';

function resolveProjectGithubToken(
  project: {
    githubToken: string | null;
    user: { settings: { githubToken: string | null } | null } | null;
  } | null
): string | undefined {
  if (!project) {
    return process.env['GITHUB_TOKEN'];
  }
  const raw = project.githubToken || project.user?.settings?.githubToken;
  if (raw) {
    return decrypt(raw);
  }
  return process.env['GITHUB_TOKEN'];
}

/**
 * Convierte un patch unificado de git en estructura de hunks (UI).
 */
function parseUnifiedPatchToHunks(patch: string): DiffHunk[] {
  if (!patch?.trim()) {
    return [];
  }

  const lines = patch.split('\n');
  let i = 0;
  while (i < lines.length && !lines[i]!.startsWith('@@') && !lines[i]!.startsWith('diff --git')) {
    i++;
  }
  if (i < lines.length && lines[i]!.startsWith('diff --git')) {
    while (i < lines.length && !lines[i]!.startsWith('@@')) {
      i++;
    }
  }

  const hunks: DiffHunk[] = [];

  while (i < lines.length) {
    const line = lines[i]!;
    if (line.startsWith('@@')) {
      const m = line.match(
        /@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/
      );
      const oldStart = m ? parseInt(m[1]!, 10) : 1;
      const oldCount = m && m[2] != null && m[2] !== '' ? parseInt(m[2], 10) : 1;
      const newStart = m ? parseInt(m[3]!, 10) : 1;
      const newCount = m && m[4] != null && m[4] !== '' ? parseInt(m[4], 10) : 1;
      i++;
      const hunkLines: DiffLine[] = [];
      let o = oldStart;
      let n = newStart;
      while (i < lines.length && !lines[i]!.startsWith('@@') && !lines[i]!.startsWith('diff --git')) {
        const l = lines[i]!;
        if (l.startsWith('---') || l.startsWith('+++')) {
          i++;
          continue;
        }
        if (l.startsWith('\\')) {
          i++;
          continue;
        }
        if (l.startsWith(' ')) {
          hunkLines.push({ type: 'context', content: l.slice(1) });
          o++;
          n++;
        } else if (l.startsWith('-')) {
          hunkLines.push({ type: 'remove', content: l.slice(1), lineNumber: o });
          o++;
        } else if (l.startsWith('+')) {
          hunkLines.push({ type: 'add', content: l.slice(1), lineNumber: n });
          n++;
        }
        i++;
      }
      hunks.push({
        oldStart,
        oldLines: oldCount,
        newStart,
        newLines: newCount,
        lines: hunkLines,
      });
    } else {
      i++;
    }
  }

  return hunks;
}

/**
 * Obtener cambios de código reales (git) para un hallazgo.
 */
export async function getFindingCodeDiff(findingId: string) {
  try {
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      include: {
        analysis: {
          include: {
            project: {
              include: { user: { include: { settings: true } } },
            },
          },
        },
      },
    });

    if (!finding) {
      return null;
    }

    const file = finding.file || 'unknown';
    const severity = finding.severity || 'UNKNOWN';
    const riskType = finding.riskType || 'UNKNOWN';
    const repoUrl = finding.analysis?.project?.repositoryUrl;
    const token = resolveProjectGithubToken(finding.analysis?.project ?? null);

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

    const diffs: CodeDiff[] = [];

    if (repoUrl) {
      for (const event of forensicEvents) {
        const { patch, additions, deletions } = await gitService.getFilePatchAtCommit(
          repoUrl,
          file,
          event.commitHash,
          token
        );
        const hunks = parseUnifiedPatchToHunks(patch);
        diffs.push({
          file,
          additions,
          deletions,
          changes: additions + deletions,
          riskLevel: severity,
          severity,
          hunks:
            hunks.length > 0
              ? hunks
              : snippetFallbackHunk(finding.codeSnippet, file, riskType),
        });
      }
    }

    if (diffs.length === 0 && forensicEvents.length > 0) {
      for (const event of forensicEvents) {
        diffs.push({
          file,
          additions: 0,
          deletions: 0,
          changes: 0,
          riskLevel: severity,
          severity,
          hunks: snippetFallbackHunk(finding.codeSnippet, file, riskType),
        });
      }
    }

    if (diffs.length === 0) {
      diffs.push({
        file,
        additions: 0,
        deletions: 0,
        changes: 0,
        riskLevel: severity,
        severity,
        hunks: snippetFallbackHunk(finding.codeSnippet, file, riskType),
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

function snippetFallbackHunk(
  codeSnippet: string | null,
  _file: string,
  _riskType: string
): DiffHunk[] {
  if (!codeSnippet?.trim()) {
    return [];
  }
  const rawLines = codeSnippet.split('\n');
  return [
    {
      oldStart: 1,
      oldLines: 0,
      newStart: 1,
      newLines: rawLines.length,
      lines: rawLines.map((content, idx) => ({
        type: 'add' as const,
        content,
        lineNumber: idx + 1,
        highlighted: true,
      })),
    },
  ];
}

/**
 * Comparar dos versiones de un archivo (estadísticas reales vía numstat).
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
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: { include: { user: { include: { settings: true } } } } },
    });
    if (!analysis?.project) {
      return null;
    }

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

    const repoUrl = analysis.project.repositoryUrl;
    const token = resolveProjectGithubToken(analysis.project);
    const fromCommit = options?.beforeCommit || events[0]!.commitHash;
    const toCommit = options?.afterCommit || events[events.length - 1]!.commitHash;

    let totalAdditions = 0;
    let totalDeletions = 0;
    if (fromCommit && toCommit && fromCommit !== toCommit) {
      const stats = await gitService.getFileNumstatBetween(
        repoUrl,
        file,
        fromCommit,
        toCommit,
        token
      );
      totalAdditions = stats.additions;
      totalDeletions = stats.deletions;
    }

    return {
      file,
      analysisId,
      beforeCommit: fromCommit,
      afterCommit: toCommit,
      stats: {
        commits: events.length,
        additions: totalAdditions,
        deletions: totalDeletions,
        totalChanges: totalAdditions + totalDeletions,
      },
      events: events.map((e) => ({
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
 * Archivos con más actividad por autor (análisis de eventos forenses en BD, sin random).
 */
export async function getUserAffectedFiles(
  userId: string,
  options?: {
    limit?: number;
    analysisId?: string;
  }
) {
  try {
    const limit = Math.min(options?.limit || 20, 100);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return [];
    }

    const where: { author: string; analysisId?: string } = {
      author: user.email,
    };

    if (options?.analysisId) {
      where.analysisId = options.analysisId;
    }

    const fileStats = await prisma.forensicEvent.groupBy({
      by: ['file'],
      where,
      _count: { id: true },
      _max: { riskLevel: true },
    });

    return fileStats
      .filter((f) => f.file)
      .map((f) => ({
        file: f.file!,
        changes: f._count.id,
        maxRisk: f._max?.riskLevel || 'LOW',
        riskScore: riskLevelToScore(f._max?.riskLevel || 'LOW'),
      }))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, limit);
  } catch (error) {
    logger.error(`Error getting user affected files: ${error}`);
    return [];
  }
}

/**
 * Líneas reales alrededor de un número de línea (working tree clonado).
 */
export async function getLineContext(
  analysisId: string,
  file: string,
  lineNumber: number,
  context?: number
) {
  try {
    const contextLines = context || 3;

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: { include: { user: { include: { settings: true } } } } },
    });
    if (!analysis?.project) {
      return null;
    }

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

    const repoUrl = analysis.project.repositoryUrl;
    const token = resolveProjectGithubToken(analysis.project);
    const localPath = await gitService.cloneOrPullRepository(
      repoUrl,
      token
    );
    const content = gitService.readWorktreeFile(localPath, file);

    if (!content) {
      return {
        file,
        lineNumber,
        context: contextLines,
        contextHunks: [] as DiffHunk[],
        eventsAffecting: events.length,
        note: 'No se pudo leer el archivo en el clon local (¿ruta, binario o sin checkout?).',
      };
    }

    const allLines = content.split('\n');
    const from = Math.max(0, lineNumber - 1 - contextLines);
    const to = Math.min(allLines.length, lineNumber - 1 + contextLines + 1);
    const slice = allLines.slice(from, to);

    const contextHunks: DiffHunk[] = [
      {
        oldStart: from + 1,
        oldLines: slice.length,
        newStart: from + 1,
        newLines: slice.length,
        lines: slice.map((c, j) => {
          const lineNo = from + j + 1;
          return {
            type: lineNo === lineNumber ? 'add' : 'context',
            content: c,
            lineNumber: lineNo,
            highlighted: lineNo === lineNumber,
          } as DiffLine;
        }),
      },
    ];

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

function riskLevelToScore(level: string): number {
  const scores: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  };
  return scores[level] || 0;
}
