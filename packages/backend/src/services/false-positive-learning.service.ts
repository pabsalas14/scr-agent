/**
 * False Positive Learning Service (PHASE 4.2)
 * Detects patterns in false positives and automatically ignores them
 */

import { prisma } from './prisma.service';
import { logger } from './logger.service';

const FP_AUTO_IGNORE_THRESHOLD = 6; // Auto-ignore after 6 FP detections

interface FalsePositivePattern {
  filePattern: string; // Regex pattern
  riskType: string;
  confidence: number; // 0-1
}

/**
 * Record a finding as false positive and detect patterns
 */
export async function recordFalsePositive(findingId: string): Promise<{
  recorded: boolean;
  shouldAutoIgnore: boolean;
  pattern?: FalsePositivePattern;
}> {
  try {
    // Get the finding
    const finding = await prisma.finding.findUnique({
      where: { id: findingId },
      select: {
        id: true,
        file: true,
        riskType: true,
        severity: true,
        codeSnippet: true,
      },
    });

    if (!finding) {
      return { recorded: false, shouldAutoIgnore: false };
    }

    // Extract file path pattern (directory + file name pattern)
    const fileParts = finding.file.split('/');
    const fileName = fileParts[fileParts.length - 1];
    const fileExtension = fileName.split('.').pop();
    const filePattern = `.*\\.${fileExtension}$`;

    // Contar falsos positivos recientes en el mismo tipo de riesgo y nombre de archivo
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const fpCount = await prisma.findingStatusChange.count({
      where: {
        status: 'FALSE_POSITIVE',
        createdAt: { gte: since },
        finding: {
          file: { contains: fileName },
          riskType: finding.riskType,
        },
      },
    });
    const shouldAutoIgnore = fpCount >= FP_AUTO_IGNORE_THRESHOLD;

    // Log false positive for learning
    logger.info(
      `False positive recorded: ${findingId} (${finding.file}, ${finding.riskType}). Similar FPs: ${fpCount}`
    );

    return {
      recorded: true,
      shouldAutoIgnore,
      pattern: {
        filePattern,
        riskType: finding.riskType,
        confidence: Math.min(1, fpCount / 10),
      },
    };
  } catch (error) {
    logger.error(`Error recording false positive: ${error}`);
    return { recorded: false, shouldAutoIgnore: false };
  }
}

/**
 * Get learned false positive patterns
 */
export async function getLearnedPatterns(): Promise<FalsePositivePattern[]> {
  try {
    // Query findings that have been marked as FP multiple times
    const frequentFPs = await prisma.finding.groupBy({
      by: ['file', 'riskType'],
      where: {
        auditTrail: {
          some: {
            action: 'STATUS_CHANGE',
            newValue: 'FALSE_POSITIVE',
          },
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 50,
    });

    return frequentFPs
      .filter((fp) => (fp._count.id as any) >= 3) // At least 3 FP detections
      .map((fp) => ({
        filePattern: `.*/${fp.file.split('/').pop()}`,
        riskType: fp.riskType,
        confidence: Math.min(1, (fp._count.id as any) / 10),
      }));
  } catch (error) {
    logger.error(`Error getting learned patterns: ${error}`);
    return [];
  }
}

/**
 * Check if a finding matches a known false positive pattern
 */
export async function matchesFPPattern(finding: {
  file: string;
  riskType: string;
}): Promise<boolean> {
  try {
    const patterns = await getLearnedPatterns();

    return patterns.some((pattern) => {
      const fileRegex = new RegExp(pattern.filePattern);
      return fileRegex.test(finding.file) && pattern.riskType === finding.riskType;
    });
  } catch (error) {
    logger.error(`Error checking FP pattern: ${error}`);
    return false;
  }
}

/**
 * Auto-mark findings as false positive if they match patterns
 */
export async function autoIgnoreFalsePositives(analysisId: string): Promise<{
  processed: number;
  autoIgnored: number;
}> {
  try {
    const findings = await prisma.finding.findMany({
      where: {
        analysisId,
      },
      select: {
        id: true,
        file: true,
        riskType: true,
      },
    });

    let autoIgnored = 0;

    for (const finding of findings) {
      const isFP = await matchesFPPattern(finding);

      if (isFP) {
        // Update status to FALSE_POSITIVE
        await prisma.finding.update({
          where: { id: finding.id },
          data: {
            statusHistory: {
              create: {
                status: 'FALSE_POSITIVE',
                changedBy: 'SYSTEM',
                note: 'Auto-marked based on false positive pattern learning',
              },
            },
          },
        });

        autoIgnored++;
      }
    }

    logger.info(
      `Auto-ignored ${autoIgnored}/${findings.length} findings in analysis ${analysisId}`
    );

    return {
      processed: findings.length,
      autoIgnored,
    };
  } catch (error) {
    logger.error(`Error auto-ignoring false positives: ${error}`);
    return {
      processed: 0,
      autoIgnored: 0,
    };
  }
}

/**
 * Get false positive statistics
 */
export async function getFPStatistics(): Promise<{
  totalFindings: number;
  falsePositives: number;
  fpRate: number;
  topPatterns: Array<{
    file: string;
    riskType: string;
    count: number;
  }>;
}> {
  try {
    const totalFindings = await prisma.finding.count({
      where: { deletedAt: null },
    });

    const falsePositives = await prisma.finding.count({
      where: {
        auditTrail: {
          some: {
            newValue: 'FALSE_POSITIVE',
          },
        },
      },
    });

    // Get top FP patterns
    const patterns = await prisma.finding.groupBy({
      by: ['file', 'riskType'],
      where: {
        auditTrail: {
          some: {
            newValue: 'FALSE_POSITIVE',
          },
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalFindings,
      falsePositives,
      fpRate: totalFindings > 0 ? (falsePositives / totalFindings) * 100 : 0,
      topPatterns: patterns.map((p) => ({
        file: p.file,
        riskType: p.riskType,
        count: (p._count.id as any) || 0,
      })),
    };
  } catch (error) {
    logger.error(`Error getting FP statistics: ${error}`);
    return {
      totalFindings: 0,
      falsePositives: 0,
      fpRate: 0,
      topPatterns: [],
    };
  }
}
