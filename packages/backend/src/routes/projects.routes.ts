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
    const userRole = (req as any).user?.role; // ADMIN, ANALYST, DEVELOPER, VIEWER
    const page = Math.max(1, parseInt(req.query['page'] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query['limit'] as string) || 20));
    const search = (req.query['search'] as string)?.trim() || '';
    const showAll = req.query['showAll'] === 'true'; // Permitir ver todos los proyectos
    const skip = (page - 1) * limit;

    // ADMINs ven todos los proyectos por defecto, otros usuarios solo los suyos
    const isAdmin = userRole === 'ADMIN';

    const where: any = {
      // Monitoreo Colectivo: Todos los usuarios ven todos los proyectos
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

    // Accesso global habilitado

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
    // Accesso global habilitado

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
    const { name, description, repositoryUrl, branch, scope, maxFileSizeKb, maxTotalSizeMb, maxDirectoryDepth, maxCommits } = req.body;
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
        // Network errors don't block project creation — repo may be accessible during analysis
        logger.warn(`Repository validation failed for ${repositoryUrl}: ${errorMessage} — proceeding with project creation`);
        code = 'NETWORK_ERROR';
        // Fall through: don't return, allow project creation to continue
      }

      if (code !== 'NETWORK_ERROR') {
        logger.warn(`Repository validation failed for ${repositoryUrl}: ${errorMessage}`);
        return res.status(statusCode).json({
          success: false,
          error: userMessage,
          details: { code, message: errorMessage },
        });
      }
    }
    // ========== FIN VALIDACIÓN ==========

    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositoryUrl,
        branch: branch || 'main',
        scope,
        ...(maxFileSizeKb   ? { maxFileSizeKb:     Math.min(500, Math.max(10, Number(maxFileSizeKb)))   } : {}),
        ...(maxTotalSizeMb  ? { maxTotalSizeMb:    Math.min(20,  Math.max(1,  Number(maxTotalSizeMb)))  } : {}),
        ...(maxDirectoryDepth ? { maxDirectoryDepth: Math.min(10,  Math.max(2,  Number(maxDirectoryDepth))) } : {}),
        ...(maxCommits      ? { maxCommits:         Math.min(200, Math.max(10, Number(maxCommits)))      } : {}),
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
 * PUT /api/v1/projects/:id
 * Actualizar nombre, descripción, rama o límites de un proyecto
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const { name, description, branch, maxFileSizeKb, maxTotalSizeMb, maxDirectoryDepth, maxCommits } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }
    if (project.userId && project.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Acceso denegado (Solo el propietario o ADMIN puede editar)' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(name        !== undefined ? { name }        : {}),
        ...(description !== undefined ? { description } : {}),
        ...(branch      !== undefined ? { branch }      : {}),
        ...(maxFileSizeKb     ? { maxFileSizeKb:     Math.min(500, Math.max(10,  Number(maxFileSizeKb)))   } : {}),
        ...(maxTotalSizeMb    ? { maxTotalSizeMb:    Math.min(20,  Math.max(1,   Number(maxTotalSizeMb)))  } : {}),
        ...(maxDirectoryDepth ? { maxDirectoryDepth: Math.min(10,  Math.max(2,   Number(maxDirectoryDepth))) } : {}),
        ...(maxCommits        ? { maxCommits:         Math.min(200, Math.max(10, Number(maxCommits)))      } : {}),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/projects/:id
 * Eliminar un proyecto y todos sus análisis asociados
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    logger.info(`[DELETE Project] Usuario ${userId} (role: ${userRole}) intenta eliminar proyecto ${id}`);

    // Obtener proyecto con sus análisis para validación
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        analyses: {
          select: { id: true, status: true },
        },
      },
    });

    if (!project) {
      logger.warn(`[DELETE Project] Proyecto ${id} no encontrado`);
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    // Validación de permisos: si el proyecto tiene userId, solo el propietario o ADMIN puede eliminar
    if (project.userId && project.userId !== userId && userRole !== 'ADMIN') {
      logger.warn(
        `[DELETE Project] Acceso denegado: userId=${userId}, projectUserId=${project.userId}, role=${userRole}`
      );
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado (Solo el propietario o ADMIN puede eliminar)',
      });
    }

    logger.info(
      `[DELETE Project] Preparando eliminación de proyecto ${id} con ${project.analyses.length} análisis asociados`
    );

    // Paso 1: Eliminar todos los análisis (que cascadearán sus relaciones)
    const analysisIds = project.analyses.map((a) => a.id);
    if (analysisIds.length > 0) {
      logger.info(`[DELETE Project] Eliminando ${analysisIds.length} análisis...`);
      await prisma.analysis.deleteMany({
        where: { id: { in: analysisIds } },
      });
      logger.info(`[DELETE Project] Análisis eliminados exitosamente`);
    }

    // Paso 2: Eliminar el proyecto
    logger.info(`[DELETE Project] Eliminando proyecto ${id}...`);
    await prisma.project.delete({ where: { id } });

    logger.info(`[DELETE Project] Proyecto ${id} eliminado exitosamente`);
    res.json({
      success: true,
      message: 'Proyecto eliminado correctamente',
      deletedAnalyses: analysisIds.length,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code || 'UNKNOWN';

    logger.error(`[DELETE Project] Error (${errorCode}): ${errorMsg}`);

    // Proporcionar mensajes de error más específicos
    if (errorMsg.includes('unique constraint')) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar: hay datos relacionados que impiden la eliminación',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al eliminar el proyecto',
      details: errorMsg,
    });
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

    // Accesso global habilitado

    // Crear análisis
    const { isIncremental } = req.body;
    
    const analysis = await prisma.analysis.create({
      data: {
        projectId: projectId!,
        status: 'PENDING',
        progress: 0,
      },
    });

    // Encolar análisis en background para procesamiento
    enqueueAnalysis(analysis.id, projectId!, !!isIncremental);

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

/**
 * GET /api/v1/projects/:id/estimate
 * Obtener estimado de tokens y costo antes de un análisis
 */
router.get('/:id/estimate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    // Accesso global habilitado

    // Obtener GitHub token si existe para evitar rate limits
    let githubToken: string | undefined;
    if (userId) {
      const userSettings = await prisma.userSettings.findUnique({ where: { userId } });
      githubToken = userSettings?.githubToken ? decrypt(userSettings.githubToken) : undefined;
    }

    // Realizar un clone ligero (shallow) para contar archivos y bytes
    const localPath = await gitService.cloneOrPullRepository(project.repositoryUrl, githubToken, project.branch);
    const repoData = gitService.readRepositoryFiles(localPath, undefined, {
      maxFileSizeKb: project.maxFileSizeKb || 150,
      maxTotalSizeMb: project.maxTotalSizeMb || 2,
    });

    // Estimación técnica:
    // 1 token approx 4 caracteres (bytes)
    // Agregamos un 20% de overhead por prompts y contexto de agentes
    const estimatedInputTokens = Math.ceil((repoData.totalSize / 4) * 1.2);
    
    // Output tokens estimado: asumimos que por cada archivo Claude genera ~300 tokens de hallazgos
    const estimatedOutputTokens = repoData.fileCount * 300;

    // Precios Claude 3.5 Sonnet (USD per 1M tokens)
    // Input: $3.00, Output: $15.00
    const inputCost = (estimatedInputTokens / 1_000_000) * 3;
    const outputCost = (estimatedOutputTokens / 1_000_000) * 15;
    const totalCostUsd = inputCost + outputCost;

    res.json({
      success: true,
      data: {
        tokens: estimatedInputTokens + estimatedOutputTokens,
        costUsd: parseFloat(totalCostUsd.toFixed(4)),
        fileCount: repoData.fileCount,
        totalSizeKb: Math.round(repoData.totalSize / 1024),
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
