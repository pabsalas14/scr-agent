/**
 * Projects Routes
 * Endpoints para gestionar proyectos de análisis
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';

const router = Router();

/**
 * GET /api/v1/projects
 * Obtener todos los proyectos del usuario
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        analyses: {
          select: {
            id: true,
            status: true,
            createdAt: true,
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
    });

    res.json({
      success: true,
      data: projects,
      count: projects.length,
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

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/analyses/:analysisId
 * Obtener detalles de un análisis específico
 */
router.get('/analyses/:analysisId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { analysisId } = req.params;

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        findings: true,
      },
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Análisis no encontrado',
      });
    }

    // Debug: Log what we got back
    logger.info({
      message: `[DEBUG] Analysis ${analysisId}`,
      findingsCount: (analysis as any).findings?.length ?? 'undefined',
      keys: Object.keys(analysis),
    });

    res.json({
      success: true,
      data: analysis,
    });
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
    const { name, description, repositoryUrl, scope } = req.body;

    // Validar datos
    if (!name || !repositoryUrl || !scope) {
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: name, repositoryUrl, scope',
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        repositoryUrl,
        scope,
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

    // Crear análisis
    const analysis = await prisma.analysis.create({
      data: {
        projectId,
        status: 'PENDING',
        progress: 0,
      },
    });

    res.status(201).json({
      success: true,
      data: analysis,
      message: 'Análisis iniciado. Procesando...',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
