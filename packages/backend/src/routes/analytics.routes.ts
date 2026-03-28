/**
 * Analytics Routes
 * GET endpoints for analytics and statistics
 */

import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { prisma } from '../services/prisma.service';

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
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Get all findings with their analysis and remediation status
    const findings = await prisma.finding.findMany({
      where: {
        analysis: {
          status: 'COMPLETED'
        }
      },
      include: {
        analysis: true,
        remediation: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    let totalFindings = 0;
    let criticalFindings = 0;
    let highFindings = 0;
    let mediumFindings = 0;
    let lowFindings = 0;
    let totalResolutionTime = 0;
    let remediatedFindings = 0;

    // Get total number of completed analyses
    const totalAnalyses = await prisma.analysis.count({
      where: {
        status: 'COMPLETED'
      }
    });

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

      // Count remediated findings
      if (finding.remediation?.status === 'VERIFIED') {
        remediatedFindings++;
      }

      // Calculate resolution time
      if (finding.analysis?.completedAt && finding.analysis?.createdAt) {
        const time = new Date(finding.analysis.completedAt).getTime() - new Date(finding.analysis.createdAt).getTime();
        totalResolutionTime += time;
      }
    }

    const averageResolutionTime =
      totalFindings > 0 ? totalResolutionTime / totalFindings : 0;
    const remediationRate =
      totalFindings > 0 ? remediatedFindings / totalFindings : 0;

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
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics summary'
    });
  }
});

/**
 * GET /api/v1/analytics/timeline?days=30
 * Get timeline data for the last N days
 */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const daysParam = req.query['days'];
    const days = typeof daysParam === 'string' ? parseInt(daysParam, 10) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all findings from completed analyses in the time period
    const findings = await prisma.finding.findMany({
      where: {
        analysis: {
          status: 'COMPLETED',
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
      data: timeline
    });
  } catch (error) {
    console.error('Error fetching analytics timeline:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics timeline'
    });
  }
});

/**
 * GET /api/v1/analytics/by-type
 * Get findings breakdown by risk type
 */
router.get('/by-type', async (req: Request, res: Response) => {
  try {
    const findings = await prisma.finding.findMany({
      where: {
        analysis: {
          status: 'COMPLETED'
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
      data
    });
  } catch (error) {
    console.error('Error fetching analytics by type:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics by type'
    });
  }
});

export default router;
