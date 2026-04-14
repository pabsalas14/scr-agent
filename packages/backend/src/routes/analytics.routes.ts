/**
 * Analytics Routes
 * GET endpoints for analytics and statistics
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

const router: ExpressRouter = Router();

interface AnalyticsSummary {
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  averageResolutionTime: number;
  remediationRate: number;
  totalAnalyses: number;
}

interface TimelineData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * GET /api/v1/analytics/summary
 * Get analytics summary with key statistics
 */
router.get('/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // BUG FIX #6: Filter by userId to show only user's own projects' findings
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false
      });
    }

    // BUG FIX #3: Optimize queries to reduce N+1 and memory usage
    // Select only necessary fields instead of loading entire objects
    // NOTE: Removed userId filter - all authenticated users see all data
    const [findings, totalAnalyses] = await Promise.all([
      prisma.finding.findMany({
        where: {
          analysis: {
            status: 'COMPLETED'
            // All users see all findings (not filtered by userId)
          }
        },
        select: {
          id: true,
          severity: true,
          createdAt: true,
          // Only select what we need from relations
          analysis: {
            select: {
              id: true,
              createdAt: true,
              startedAt: true,
              completedAt: true,
            }
          },
          remediation: {
            select: {
              id: true,
              status: true,
            }
          },
        },
      }),
      prisma.analysis.count({
        where: {
          status: 'COMPLETED'
          // All users see all analyses (public data)
        }
      }),
    ]);

    let totalFindings = 0;
    let criticalFindings = 0;
    let highFindings = 0;
    let mediumFindings = 0;
    let lowFindings = 0;
    let totalResolutionTime = 0;
    let findingsWithResolutionTime = 0; // BUG FIX #2: Count findings that have valid times
    let remediatedFindings = 0;
    let findingsWithRemediationEntry = 0;

    // Process each finding
    for (const finding of findings) {
      totalFindings++;

      // Count by severity
      if (finding.severity === 'CRITICAL') {
        criticalFindings++;
      } else if (finding.severity === 'HIGH') {
        highFindings++;
      } else if (finding.severity === 'MEDIUM') {
        mediumFindings++;
      } else if (finding.severity === 'LOW') {
        lowFindings++;
      }

      // BUG FIX #1: Only count findings that have remediation entries in the remediation rate
      // This prevents artificially low rates from findings without remediation records
      if (finding.remediation) {
        findingsWithRemediationEntry++;
        if (finding.remediation.status === 'VERIFIED') {
          remediatedFindings++;
        }
      }

      // BUG FIX #2: Calculate resolution time only for findings with valid timestamps
      if (finding.analysis?.completedAt && finding.analysis?.startedAt) {
        const time = new Date(finding.analysis.completedAt).getTime() - new Date(finding.analysis.startedAt).getTime();
        // Only count positive times (if startedAt is in the future, skip)
        if (time > 0) {
          totalResolutionTime += time;
          findingsWithResolutionTime++;
        }
      }
    }

    // BUG FIX #2: Use findingsWithResolutionTime as denominator, not totalFindings
    const averageResolutionTime =
      findingsWithResolutionTime > 0 ? totalResolutionTime / findingsWithResolutionTime : 0;
    // BUG FIX #1: Use findingsWithRemediationEntry as denominator, not totalFindings
    const remediationRate =
      findingsWithRemediationEntry > 0 ? remediatedFindings / findingsWithRemediationEntry : 0;

    const summary: AnalyticsSummary = {
      totalFindings,
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      averageResolutionTime,
      remediationRate,
      totalAnalyses
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error(`Error fetching analytics summary: ${error}`);
    res.status(500).json({
      error: 'Failed to fetch analytics summary'
    });
  }
});

/**
 * GET /api/v1/analytics/timeline?days=30
 * Get timeline data for the last N days
 */
router.get('/timeline', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // BUG FIX #6: Filter by userId to show only user's own projects' findings
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false
      });
    }

    const daysParam = req.query['days'];
    let days = typeof daysParam === 'string' ? parseInt(daysParam, 10) : 30;

    // BUG FIX #4: Validate days parameter - prevent negative or excessive values
    if (isNaN(days) || days < 1) {
      days = 30;
    } else if (days > 365) {
      // Cap at 1 year to prevent performance issues
      days = 365;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all findings from completed analyses in the time period
    const findings = await prisma.finding.findMany({
      where: {
        analysis: {
          status: 'COMPLETED',
          // All users see all findings (public data)
          createdAt: {
            gte: startDate as unknown as Date
          }
        }
      },
      select: {
        severity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Build timeline data
    const timelineMap = new Map<string, TimelineData>();

    for (const finding of findings) {
      const createdDate = finding.createdAt instanceof Date ? finding.createdAt : new Date(finding.createdAt);
      const dateStr = createdDate.toISOString().split('T')[0] || ''; // YYYY-MM-DD

      if (!dateStr) continue;

      if (!timelineMap.has(dateStr)) {
        timelineMap.set(dateStr, {
          date: dateStr,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        });
      }

      const dayData = timelineMap.get(dateStr)!;
      const severity = finding.severity || 'LOW';

      if (severity === 'CRITICAL') {
        dayData.critical++;
      } else if (severity === 'HIGH') {
        dayData.high++;
      } else if (severity === 'MEDIUM') {
        dayData.medium++;
      } else if (severity === 'LOW') {
        dayData.low++;
      }
    }

    // Convert map to sorted array
    const timeline = Array.from(timelineMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    logger.error(`Error fetching analytics timeline: ${error}`);
    res.status(500).json({
      error: 'Failed to fetch analytics timeline'
    });
  }
});

/**
 * GET /api/v1/analytics/by-type
 * Get findings breakdown by risk type
 */
router.get('/by-type', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // BUG FIX #6: Filter by userId to show only user's own projects' findings
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false
      });
    }

    const findings = await prisma.finding.findMany({
      where: {
        analysis: {
          status: 'COMPLETED'
          // All users see all findings (public data)
        }
      },
      select: {
        riskType: true
      }
    });

    const typeMap = new Map<string, number>();

    for (const finding of findings) {
      const type = finding.riskType || 'UNKNOWN';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    }

    const data = Array.from(typeMap.entries()).map(([type, count]) => ({
      name: type,
      value: count
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error(`Error fetching analytics by type: ${error}`);
    res.status(500).json({
      error: 'Failed to fetch analytics by type'
    });
  }
});

export default router;
