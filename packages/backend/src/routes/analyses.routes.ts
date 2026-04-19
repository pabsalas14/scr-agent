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
import { enqueueAnalysis, cancelAnalysis } from '../services/analysis-queue';
import { canAccessOwnedResource } from '../services/access-control.service';

const router: ExpressRouter = Router();
router.use(authMiddleware);

/**
 * GET /api/v1/analyses
 * Obtener todos los análisis (Historial global)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const pageParam = req.query['page'] as string | undefined;
    const page = Math.max(1, parseInt(pageParam || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
    const skip = (page - 1) * limit;

    // Show all analyses to all authenticated users (public data)
    const where = {};

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        include: {
          project: { select: { id: true, name: true } },
          report: { select: { riskScore: true } },
          findings: { select: { severity: true } } // needed for stats if any
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.analysis.count({ where }),
    ]);

    // Calcular stats rápidos por análisis
    const plainAnalyses = analyses.map((a: any) => ({
      id: a.id,
      projectId: a.projectId,
      projectName: a.project?.name,
      status: a.status,
      progress: a.progress,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
      riskScore: a.report?.riskScore || 0,
      findingCount: a.findings?.length || 0,
      criticalFindings: a.findings?.filter((f: any) => f.severity === 'CRITICAL').length || 0,
      highFindings: a.findings?.filter((f: any) => f.severity === 'HIGH').length || 0
    }));

    res.json({
      success: true,
      data: plainAnalyses,
      total,
      page,
      limit,
      hasMore: skip + plainAnalyses.length < total,
    });
  } catch (error) {
    logger.error(`Error obteniendo análisis globales: ${error}`);
    res.status(500).json({ success: false, error: 'Error al obtener historial' });
  }
});

/**
 * GET /api/v1/analyses/:id
 * Obtener estado de análisis con todos sus hallazgos
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id as string | undefined;
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
          select: { id: true, name: true, repositoryUrl: true, userId: true },
        },
      },
    });

    if (!analysis) {
      res.status(404).json({ success: false, error: 'Análisis no encontrado' });
      return;
    }

    const allowed = await canAccessOwnedResource({ currentUserId, resourceOwnerId: analysis.project?.userId });
    if (!allowed) {
      res.status(403).json({ success: false, error: 'No tienes acceso a este análisis' });
      return;
    }

    // Convertir a JSON plain para asegurar serialización correcta
    const plainAnalysis = JSON.parse(JSON.stringify(analysis));

    // Agregar findingCount calculado
    plainAnalysis.findingCount = plainAnalysis.findings?.length || 0;

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
    const analysisId = req.params['id'];
    logger.info(`[FORENSICS] Solicitando eventos para análisis: ${analysisId}`);

    // Obtener eventos forenses reales del agente Detective
    const events = await prisma.forensicEvent.findMany({
      where: { analysisId },
      orderBy: { timestamp: 'asc' },
    });

    logger.info(`[FORENSICS] Encontrados ${events.length} eventos para análisis ${analysisId}`);

    // Mapear campos del backend (inglés) al formato esperado por el frontend (español)
    const mappedEvents = events.map((event: any) => ({
      id: event.id,
      timestamp: event.timestamp.toISOString(),
      commit: event.commitHash,
      autor: event.author,
      archivo: event.file,
      funcion: event.function,
      accion: event.action,
      mensaje_commit: event.commitMessage,
      resumen_cambios: event.changesSummary,
      nivel_riesgo: event.riskLevel || 'BAJO',
      indicadores_sospecha: event.suspicionIndicators || [],
      hallazgo_id: event.findingId,
    }));

    res.json({ success: true, data: mappedEvents });
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
 * POST /api/v1/analyses
 * Crear nuevo análisis (enqueuing automático)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    const userId = (req as any).user?.id;

    if (!projectId) {
      res.status(400).json({ success: false, error: 'projectId es requerido' });
      return;
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, repositoryUrl: true },
    });

    if (!project) {
      res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
      return;
    }

    if (userId && project.userId && project.userId !== userId) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }

    // Crear análisis en estado PENDING
    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Encolar para procesamiento
    try {
      await enqueueAnalysis(analysis.id, projectId);
    } catch (queueError) {
      logger.error(`Error encolando análisis ${analysis.id}: ${queueError}`);
      await prisma.analysis.update({
        where: { id: analysis.id },
        data: { status: 'FAILED', errorMessage: 'Error encolando para análisis' },
      });
      res.status(500).json({
        success: false,
        error: 'Error encolando análisis',
        analysisId: analysis.id,
      });
      return;
    }

    logger.info(`✓ Análisis ${analysis.id} creado y encolado para proyecto ${projectId}`);

    res.status(201).json({
      success: true,
      data: {
        id: analysis.id,
        projectId,
        status: 'PENDING',
        progress: 0,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    logger.error(`Error creando análisis: ${error}`);
    res.status(500).json({ success: false, error: 'Error al crear análisis' });
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

    await enqueueAnalysis(analysisId!, analysis.projectId);
    logger.info(`Analysis ${analysisId} re-enqueued for retry`);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error(`Error reintentando análisis: ${error}`);
    res.status(500).json({ success: false, error: 'Error al reintentar análisis' });
  }
});

/**
 * PATCH /api/v1/analyses/:analysisId/cancel
 * Cancelar un análisis en progreso o en cola
 */
router.patch('/:analysisId/cancel', async (req: Request, res: Response) => {
  try {
    const { analysisId } = req.params;
    const userId = (req as any).user?.id;

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: { project: { select: { userId: true } } },
    });

    if (!analysis) {
      res.status(404).json({ success: false, error: 'Análisis no encontrado' });
      return;
    }

    if (userId && analysis.project?.userId && analysis.project.userId !== userId) {
      res.status(403).json({ success: false, error: 'Acceso denegado' });
      return;
    }

    // Solo se pueden cancelar análisis no completados
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(analysis.status)) {
      res.status(400).json({
        success: false,
        error: 'No se puede cancelar un análisis ya completado o fallido',
      });
      return;
    }

    // Intentar cancelar en Bull queue
    const cancelled = await cancelAnalysis(analysisId);

    if (!cancelled) {
      res.status(500).json({
        success: false,
        error: 'No se pudo cancelar el análisis',
      });
      return;
    }

    // Actualizar estado en BD
    const updated = await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'CANCELLED', progress: 0, completedAt: new Date() },
    });

    logger.info(`🚫 Análisis ${analysisId} cancelado`);

    res.json({ success: true, data: updated });
  } catch (error) {
    logger.error(`Error cancelando análisis: ${error}`);
    res.status(500).json({ success: false, error: 'Error al cancelar análisis' });
  }
});

export default router;
