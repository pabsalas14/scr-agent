/**
 * ============================================================================
 * RUTAS DE ANÁLISIS
 * ============================================================================
 *
 * GET /api/v1/analyses/:id            → Estado del análisis
 * GET /api/v1/analyses/:id/findings   → Hallazgos
 * GET /api/v1/analyses/:id/forensics  → Eventos forenses (timeline)
 * GET /api/v1/analyses/:id/report     → Reporte final
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { logger } from '../services/logger.service';
import { prisma } from '../services/prisma.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { enqueueAnalysis } from '../services/analysis-queue';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/v1/analyses/:id
 * Obtener estado de análisis con todos sus hallazgos
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id: req.params['id'] },
      include: {
        findings: {
          include: {
            statusHistory: {
              include: {
                changedByUser: {
                  select: { id: true, name: true, email: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            assignment: {
              include: {
                assignedUser: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
            remediation: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        project: {
          select: { id: true, name: true, repositoryUrl: true },
        },
      },
    });

    if (!analysis) {
      res.status(404).json({ success: false, error: 'Análisis no encontrado' });
      return;
    }

    // Convertir a JSON plain para asegurar serialización correcta
    const plainAnalysis = JSON.parse(JSON.stringify(analysis));

    res.json({
      success: true,
      data: plainAnalysis
    });
  } catch (error) {
    logger.error(`Error obteniendo análisis: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener análisis' });
  }
});

/**
 * GET /api/v1/analyses/:id/findings
 * Hallazgos del Inspector con todas sus relaciones
 */
router.get('/:id/findings', async (req: Request, res: Response) => {
  try {
    const analysisId = req.params['id'];
    const pageParam = req.query['page'] as string | undefined;
    const hasPagination = !!pageParam;
    const page = Math.max(1, parseInt(pageParam || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 50));
    const skip = (page - 1) * limit;

    const where = { analysisId };
    const queryOptions: any = {
      where,
      include: {
        statusHistory: {
          include: {
            changedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        assignment: {
          include: {
            assignedUser: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        remediation: true,
      },
      orderBy: [
        { severity: 'desc' },
        { confidence: 'desc' },
      ],
    };

    if (hasPagination) {
      queryOptions.skip = skip;
      queryOptions.take = limit;
    }

    const [findings, total] = await Promise.all([
      prisma.finding.findMany(queryOptions),
      hasPagination ? prisma.finding.count({ where }) : Promise.resolve(0),
    ]);

    // Convertir a JSON plain
    const plainFindings = JSON.parse(JSON.stringify(findings));

    if (hasPagination) {
      res.json({
        success: true,
        data: plainFindings,
        total,
        page,
        limit,
        hasMore: skip + plainFindings.length < total,
      });
    } else {
      res.json({ success: true, data: plainFindings });
    }
  } catch (error) {
    logger.error(`Error obteniendo hallazgos: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener hallazgos' });
  }
});

/**
 * GET /api/v1/analyses/:id/forensics
 * Eventos forenses para el timeline
 */
router.get('/:id/forensics', async (req: Request, res: Response) => {
  try {
    const events = await prisma.forensicEvent.findMany({
      where: { analysisId: req.params['id'] },
      orderBy: { timestamp: 'asc' },
    });

    res.json({ success: true, data: events });
  } catch (error) {
    logger.error(`Error obteniendo eventos forenses: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener eventos forenses' });
  }
});

/**
 * GET /api/v1/analyses/:id/report
 * Reporte ejecutivo del Fiscal
 */
router.get('/:id/report', async (req: Request, res: Response) => {
  try {
    const report = await prisma.report.findUnique({
      where: { analysisId: req.params['id'] },
    });

    if (!report) {
      res.status(404).json({ success: false, error: 'Reporte no disponible aún' });
      return;
    }

    /**
     * Parsear JSON almacenado en DB
     */
    const reportData = {
      ...report,
      remediationSteps: report.remediationSteps,
      severityBreakdown: report.severityBreakdown,
    };

    res.json({ success: true, data: reportData });
  } catch (error) {
    logger.error(`Error obteniendo reporte: ${error}`);
    res.status(500).json({ error: 'Error al obtener reporte' });
  }
});

/**
 * POST /api/v1/analyses/:analysisId/retry
 * Reintentar un análisis fallido
 */
router.post('/:analysisId/retry', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const userId = (req as any).user?.id;

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: { select: { userId: true, id: true } } },
    });

    if (!analysis) {
      res.status(404).json({ success: false, error: 'Análisis no encontrado' });
      return;
    }

    if (userId && analysis.project?.userId && analysis.project.userId !== userId) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }

    if (analysis.status !== 'FAILED') {
      res.status(400).json({
        success: false,
        error: 'Solo se pueden reintentar análisis fallidos',
      });
      return;
    }

    const updated = await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'PENDING', progress: 0, errorMessage: null, completedAt: null },
    });

    enqueueAnalysis(analysisId!, analysis.projectId);
    logger.info(`Analysis ${analysisId} re-enqueued for retry`);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error(`Error reintentando análisis: ${error}`);
    res.status(500).json({ success: false, error: 'Error al reintentar análisis' });
  }
});

export default router;
