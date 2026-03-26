/**
 * ============================================================================
 * RUTAS DE PROYECTOS
 * ============================================================================
 *
 * GET  /api/v1/projects        → Listar proyectos
 * POST /api/v1/projects        → Crear proyecto
 * GET  /api/v1/projects/:id    → Obtener proyecto
 *
 * OWASP API1: Validación de autorización por objeto
 * OWASP API8: Solo campos permitidos en el body
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { z } from 'zod';
import { validarBody } from '../middleware/validation.middleware';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { gitService } from '../services/git.service';
import { queueService } from '../services/queue.service';
import { prisma } from '../services/prisma.service';

const router: ExpressRouter = Router();

/**
 * Schema de creación de proyecto
 * Solo campos permitidos (OWASP API8 - Mass Assignment)
 */
const CrearProyectoSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  repositoryUrl: z.string().url(),
  scope: z.enum(['REPOSITORY', 'ORGANIZATION', 'PULL_REQUEST']).default('REPOSITORY'),
});

/**
 * GET /api/v1/projects
 * Listar todos los proyectos
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { analyses: true } },
      },
    });

    res.json({
      data: projects,
      total: projects.length,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error listando proyectos: ${msg}`);
    res.status(500).json({ error: 'Error al obtener proyectos' });
  }
});

/**
 * POST /api/v1/projects
 * Crear nuevo proyecto
 */
router.post('/', validarBody(CrearProyectoSchema), async (req: Request, res: Response) => {
  try {
    const { name, description, repositoryUrl, scope } = req.body;

    /**
     * Validar URL del repositorio (OWASP A10 - SSRF)
     */
    if (!gitService.validateRepositoryUrl(repositoryUrl)) {
      res.status(400).json({
        error: 'URL de repositorio no soportada. Solo GitHub, GitLab o Bitbucket.',
      });
      return;
    }

    /**
     * Crear en base de datos
     */
    const project = await prisma.project.create({
      data: { name, description, repositoryUrl, scope },
    });

    auditLog(AuditEventType.DB_OPERATION, 'Proyecto creado', {
      projectId: project.id,
      repositoryUrl,
    });

    res.status(201).json({ data: project });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un proyecto con esa URL de repositorio' });
      return;
    }
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error creando proyecto: ${msg}`);
    res.status(500).json({ error: 'Error al crear proyecto' });
  }
});

/**
 * GET /api/v1/projects/:id
 * Obtener proyecto por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params['id'] },
      include: {
        analyses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }

    res.json({ data: project });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error obteniendo proyecto: ${msg}`);
    res.status(500).json({ error: 'Error al obtener proyecto' });
  }
});

/**
 * GET /api/v1/projects/:id/analyses
 * Listar análisis de un proyecto
 */
router.get('/:id/analyses', async (req: Request, res: Response) => {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { projectId: req.params['id'] },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: analyses });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error obteniendo análisis: ${msg}`);
    res.status(500).json({ error: 'Error al obtener análisis' });
  }
});

/**
 * POST /api/v1/projects/:id/analyses
 * Iniciar nuevo análisis
 */
router.post('/:id/analyses', async (req: Request, res: Response) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params['id'] },
    });

    if (!project) {
      res.status(404).json({ error: 'Proyecto no encontrado' });
      return;
    }

    /**
     * Crear análisis en estado PENDING
     */
    const analysis = await prisma.analysis.create({
      data: {
        projectId: project.id,
        status: 'PENDING',
        progress: 0,
      },
    });

    auditLog(AuditEventType.ANALYSIS_STARTED, 'Análisis iniciado', {
      analysisId: analysis.id,
      projectId: project.id,
    });

    /**
     * Encolar análisis para ejecución en background
     * El frontend hará polling a GET /analyses/:id para ver el estado
     * Se pasa el scope para que los agentes adapten el análisis
     */
    queueService.encolar({
      analysisId: analysis.id,
      projectId: project.id,
      repositoryUrl: project.repositoryUrl,
      scope: project.scope as 'REPOSITORY' | 'PULL_REQUEST' | 'ORGANIZATION',
      githubToken: project.githubToken || undefined,
    });

    res.status(201).json({ data: analysis });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error iniciando análisis: ${msg}`);
    res.status(500).json({ error: 'Error al iniciar análisis' });
  }
});

export default router;
