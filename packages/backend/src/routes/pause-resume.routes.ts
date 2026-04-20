/**
 * Pause/Resume Routes
 * API endpoints for pausing and resuming analyses
 *
 * POST /api/v1/analyses/:id/pause     → Pause an analysis in progress
 * POST /api/v1/analyses/:id/resume    → Resume a paused analysis
 * GET  /api/v1/analyses/:id/can-pause → Check if analysis can be paused
 */

import { Router, type Request, type Response } from 'express';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { analysisQueue } from '../services/queue.service';
import { socketService } from '../services/socket.service';

const router = Router();

/**
 * POST /api/v1/analyses/:id/pause
 * Pause an analysis in progress
 */
router.post('/:id/pause', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    const { id: analysisId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false,
      });
    }

    // Verify user owns this analysis
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        project: {
          userId,
        },
      },
      select: {
        id: true,
        status: true,
        progress: true,
        projectId: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        success: false,
      });
    }

    // Can only pause RUNNING analyses
    const runningStatuses = [
      'INSPECTOR_RUNNING',
      'DETECTIVE_RUNNING',
      'FISCAL_RUNNING',
    ];
    if (!runningStatuses.includes(analysis.status)) {
      return res.status(400).json({
        error: `Cannot pause analysis with status: ${analysis.status}`,
        success: false,
      });
    }

    // Get the job and cancel it
    const job = await prisma.analysisJob.findUnique({
      where: { analysisId },
      select: {
        id: true,
        bullJobId: true,
      },
    });

    if (job && job.bullJobId) {
      try {
        const bullJob = await analysisQueue.getJob(job.bullJobId);
        if (bullJob) {
          await bullJob.remove();
          logger.info(`Cancelled Bull job ${job.bullJobId} for analysis ${analysisId}`);
        }
      } catch (error) {
        logger.warn(`Could not cancel Bull job ${job.bullJobId}: ${error}`);
      }
    }

    // Update analysis status to PAUSED
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'PAUSED',
        errorMessage: `Paused at ${new Date().toISOString()} with progress ${analysis.progress}%`,
      },
    });

    // Emit socket event
    socketService.emitAnalysisStatusChanged(
      analysisId,
      analysis.projectId,
      'PAUSED',
      analysis.progress
    );

    logger.info(`✅ Analysis ${analysisId} paused at progress ${analysis.progress}%`);

    res.json({
      success: true,
      data: {
        analysisId,
        status: 'PAUSED',
        progress: analysis.progress,
        message: 'Analysis paused. You can resume it later.',
      },
    });
  } catch (error) {
    logger.error(`Error pausing analysis: ${error}`);
    res.status(500).json({
      error: 'Failed to pause analysis',
      success: false,
    });
  }
});

/**
 * POST /api/v1/analyses/:id/resume
 * Resume a paused analysis
 */
router.post('/:id/resume', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    const { id: analysisId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false,
      });
    }

    // Verify user owns this analysis
    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        project: {
          userId,
        },
      },
      select: {
        id: true,
        projectId: true,
        status: true,
        progress: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        success: false,
      });
    }

    // Can only resume PAUSED analyses
    if (analysis.status !== 'PAUSED') {
      return res.status(400).json({
        error: `Cannot resume analysis with status: ${analysis.status}. Only PAUSED analyses can be resumed.`,
        success: false,
      });
    }

    // Create a new job to resume the analysis
    // The job will restart from INSPECTOR_RUNNING (we don't track exact position yet)
    // Future: Could save chunk state and resume from exact position
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'INSPECTOR_RUNNING',
        startedAt: new Date(), // Reset start time for this resume attempt
        errorMessage: null, // Clear pause message
      },
    });

    // Add back to queue
    const job = await analysisQueue.add(
      {
        analysisId,
        projectId: analysis.projectId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: false,
      }
    );

    // Update job record
    await prisma.analysisJob.upsert({
      where: { analysisId },
      create: {
        analysisId,
        bullJobId: job.id!,
        status: 'QUEUED',
      },
      update: {
        bullJobId: job.id!,
        status: 'QUEUED',
        attempts: 0,
      },
    });

    // Emit socket event
    socketService.emitAnalysisStatusChanged(
      analysisId,
      analysis.projectId,
      'INSPECTOR_RUNNING',
      analysis.progress
    );

    logger.info(
      `✅ Analysis ${analysisId} resumed from progress ${analysis.progress}% (Job: ${job.id})`
    );

    res.json({
      success: true,
      data: {
        analysisId,
        status: 'INSPECTOR_RUNNING',
        progress: analysis.progress,
        jobId: job.id,
        message: 'Analysis resumed. Monitoring progress...',
      },
    });
  } catch (error) {
    logger.error(`Error resuming analysis: ${error}`);
    res.status(500).json({
      error: 'Failed to resume analysis',
      success: false,
    });
  }
});

/**
 * GET /api/v1/analyses/:id/can-pause
 * Check if an analysis can be paused
 */
router.get('/:id/can-pause', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = (req as any).user?.id as string | undefined;
    const { id: analysisId } = req.params;

    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        success: false,
      });
    }

    const analysis = await prisma.analysis.findFirst({
      where: {
        id: analysisId,
        project: {
          userId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        success: false,
      });
    }

    const runningStatuses = [
      'INSPECTOR_RUNNING',
      'DETECTIVE_RUNNING',
      'FISCAL_RUNNING',
    ];
    const canPause = runningStatuses.includes(analysis.status);
    const canResume = analysis.status === 'PAUSED';

    res.json({
      success: true,
      data: {
        analysisId,
        status: analysis.status,
        canPause,
        canResume,
      },
    });
  } catch (error) {
    logger.error(`Error checking pause status: ${error}`);
    res.status(500).json({
      error: 'Failed to check pause status',
      success: false,
    });
  }
});

export default router;
