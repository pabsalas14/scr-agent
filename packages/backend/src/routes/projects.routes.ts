/**
 * Projects Routes
 * Endpoints para gestionar proyectos de análisis
 */

import { Router, type Request, type Response, type NextFunction, type Router as ExpressRouter } from 'express';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import { enqueueAnalysis, cancelAnalysis } from '../services/analysis-queue';
import { gitService } from '../services/git.service';
import { decrypt } from '../services/crypto.service';

const router: ExpressRouter = Router();

/**
 * GET /api/v1/projects
 * Obtener todos los proyectos del usuario
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
    const search = (req.query['search'] as string)?.trim() || '';
    const skip = (page - 1) * limit;

    const where: any = {
      ...(userId ? { userId } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { repositoryUrl: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    };

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          analyses: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              report: {
                select: {
                  riskScore: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    // Convertir a JSON plain
    const plainProjects = JSON.parse(JSON.stringify(projects));

    res.json({
      success: true,
      data: plainProjects,
      total,
      page,
      limit,
      hasMore: skip + plainProjects.length < total,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/projects/:id
 * Obtener detalles de un proyecto específico
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        analyses: {
          include: {
            findings: {
              select: {
                id: true,
                severity: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado',
      });
    }

    if (userId && project.userId && project.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }

    // Convertir a JSON plain
    const plainProject = JSON.parse(JSON.stringify(project));

    res.json({
      success: true,
      data: plainProject,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/projects/:projectId/analyses
 * Listar análisis de un proyecto
 */
router.get('/:projectId/analyses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
    if (!project) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    if (userId && project.userId && project.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }

    const analyses = await prisma.analysis.findMany({
      where: { projectId },
      include: {
        findings: {
          select: { id: true, severity: true },
        },
        report: {
          select: { id: true, riskScore: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: analyses });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/projects
 * Crear un nuevo proyecto
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, repositoryUrl, branch, scope } = req.body;
    const userId = (req as any).user?.id; // Obtenido del middleware de auth

    // Validar datos básicos
    if (!name || !repositoryUrl || !scope) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: name, repositoryUrl, scope',
      });
    }

    // ========== VALIDACIÓN DE REPOSITORIO ==========
    try {
      // Obtener GitHub token del usuario si está disponible
      let githubToken: string | undefined;
      if (userId) {
        const userSettings = await prisma.userSettings.findUnique({
          where: { userId },
        });
        githubToken = userSettings?.githubToken ? decrypt(userSettings.githubToken) : undefined;
      }

      // Validar acceso al repositorio
      await gitService.testRepositoryAccess(repositoryUrl, githubToken);
    } catch (validationError: any) {
      const errorMessage = validationError.message || '';

      // Extraer código de error específico
      let code = 'VALIDATION_ERROR';
      let statusCode = 400;
      let userMessage = 'Repository validation failed';

      if (errorMessage.startsWith('INVALID_URL:')) {
        code = 'INVALID_URL';
        userMessage = 'Invalid repository URL format (must be HTTPS from GitHub, GitLab, or Bitbucket)';
      } else if (errorMessage.startsWith('REPO_NOT_FOUND:')) {
        code = 'REPO_NOT_FOUND';
        userMessage = 'Repository not found. Please check the URL and try again.';
      } else if (errorMessage.startsWith('NO_ACCESS:')) {
        code = 'NO_ACCESS';
        userMessage = 'No access to this repository. It may be private - configure your GitHub token in Settings.';
      } else if (errorMessage.startsWith('INVALID_TOKEN:')) {
        code = 'INVALID_TOKEN';
        userMessage = 'GitHub token is invalid or expired. Please refresh it in Settings.';
      } else if (errorMessage.startsWith('NETWORK_')) {
        code = 'NETWORK_ERROR';
        statusCode = 503;
        userMessage = 'Failed to verify repository access. Please try again later.';
      }

      logger.warn(`Repository validation failed for ${repositoryUrl}: ${errorMessage}`);

      return res.status(statusCode).json({
        success: false,
        error: userMessage,
        details: {
          code,
          message: errorMessage,
        },
      });
    }
    // ========== FIN VALIDACIÓN ==========

    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositoryUrl,
        branch: branch || 'main',
        scope,
        ...(userId ? { userId } : {}),
      },
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Proyecto creado exitosamente',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/projects/:projectId/analyses
 * Iniciar un nuevo análisis
 */
router.post('/:projectId/analyses', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user?.id;

    // Verificar que el proyecto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado',
      });
    }

    if (userId && project.userId && project.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }

    // Crear análisis
    const analysis = await prisma.analysis.create({
      data: {
        projectId: projectId!,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Encolar análisis en background para procesamiento
    enqueueAnalysis(analysis.id, projectId!);

    logger.info(`Analysis ${analysis.id} enqueued for processing`);

    res.status(201).json({
      success: true,
      data: analysis,
      message: 'Análisis iniciado. Procesando en background...',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/projects/:projectId/analyses/:analysisId/cancel
 * Cancelar un análisis en progreso
 */
router.post('/:projectId/analyses/:analysisId/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, analysisId } = req.params;
    const userId = (req as any).user?.id;

    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
    if (project && userId && project.userId && project.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Acceso denegado' });
    }

    const analysis = await prisma.analysis.findFirst({
      where: { id: analysisId, projectId },
    });

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'Análisis no encontrado' });
    }

    // Only cancel if still running
    const cancellableStatuses = ['PENDING', 'RUNNING', 'INSPECTOR_RUNNING', 'DETECTIVE_RUNNING', 'FISCAL_RUNNING'];
    if (!cancellableStatuses.includes(analysis.status)) {
      return res.status(400).json({
        success: false,
        error: `Análisis no se puede cancelar (estado: ${analysis.status})`,
      });
    }

    cancelAnalysis(analysisId!);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: { status: 'CANCELLED' },
    });

    logger.info(`Analysis ${analysisId} cancelled by user`);

    res.json({ success: true, message: 'Análisis cancelado exitosamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
