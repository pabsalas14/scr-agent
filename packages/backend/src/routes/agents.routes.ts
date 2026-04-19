/**
 * ============================================================================
 * AGENT PROMPTS API ROUTES
 * ============================================================================
 *
 * GET    /api/v1/agents/:agentName/prompt    → Get agent prompt/context
 * PUT    /api/v1/agents/:agentName/prompt    → Update agent prompt
 * GET    /api/v1/agents/:agentName/versions  → Get prompt history
 */

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { AuthenticatedRequest, authMiddleware } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';
import fs from 'fs';
import path from 'path';

const router: ExpressRouter = Router();
router.use(authMiddleware);

// Agent names and their default prompt file locations
const AGENT_PROMPTS: Record<string, { label: string; path: string }> = {
  inspector: {
    label: 'Inspector',
    path: path.join(process.cwd(), '../../agents/inspector.agent.md'),
  },
  detective: {
    label: 'Detective',
    path: path.join(process.cwd(), '../../agents/detective.agent.md'),
  },
  fiscal: {
    label: 'Fiscal',
    path: path.join(process.cwd(), '../../agents/fiscal.agent.md'),
  },
};

/**
 * GET /api/v1/agents/:agentName/prompt
 * Obtener prompt actual de un agente
 */
router.get('/:agentName/prompt', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentName } = req.params;

    if (!AGENT_PROMPTS[agentName]) {
      return res.status(404).json({
        success: false,
        error: `Agente '${agentName}' no encontrado`,
      });
    }

    // Obtener prompt de la BD si existe versión personalizada, sino del archivo default
    const agentPrompt = await prisma.agentPrompt.findUnique({
      where: { agentName },
    });

    let prompt = agentPrompt?.prompt || '';

    // Si no hay en BD, intentar leer del archivo default
    if (!prompt) {
      try {
        const agentConfig = AGENT_PROMPTS[agentName];
        prompt = fs.readFileSync(agentConfig.path, 'utf-8');
      } catch (fileError) {
        logger.warn(`Could not read default prompt for ${agentName}:`, fileError);
        prompt = `# ${AGENT_PROMPTS[agentName].label} Agent\n\nDefault prompt not found.`;
      }
    }

    res.json({
      success: true,
      data: {
        agentName,
        label: AGENT_PROMPTS[agentName].label,
        prompt,
        version: agentPrompt?.version || 1,
        lastUpdated: agentPrompt?.updatedAt || null,
        updatedBy: agentPrompt?.updatedBy || null,
        isCustom: !!agentPrompt,
      },
    });
  } catch (error) {
    logger.error('Error fetching agent prompt:', error);
    res.status(500).json({ success: false, error: 'Error fetching agent prompt' });
  }
});

/**
 * PUT /api/v1/agents/:agentName/prompt
 * Actualizar prompt de un agente (solo Admin)
 */
router.put('/:agentName/prompt', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentName } = req.params;
    const { prompt, comment } = req.body;
    const userId = req.user?.id;

    // Validar que el agente existe
    if (!AGENT_PROMPTS[agentName]) {
      return res.status(404).json({
        success: false,
        error: `Agente '${agentName}' no encontrado`,
      });
    }

    // Validar que el prompt no esté vacío
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El prompt no puede estar vacío',
      });
    }

    // Obtener versión anterior para obtener el número de versión
    const currentPrompt = await prisma.agentPrompt.findUnique({
      where: { agentName },
    });

    const newVersion = (currentPrompt?.version || 0) + 1;

    // Guardar o actualizar prompt
    const updated = await prisma.agentPrompt.upsert({
      where: { agentName },
      update: {
        prompt,
        version: newVersion,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      create: {
        agentName,
        prompt,
        version: newVersion,
        updatedBy: userId,
      },
    });

    logger.info(
      `Agent prompt updated: ${agentName} (v${newVersion}) by ${userId}${
        comment ? ` - ${comment}` : ''
      }`
    );

    res.json({
      success: true,
      data: {
        agentName,
        version: updated.version,
        updatedAt: updated.updatedAt,
        updatedBy: updated.updatedBy,
      },
    });
  } catch (error) {
    logger.error('Error updating agent prompt:', error);
    res.status(500).json({ success: false, error: 'Error updating agent prompt' });
  }
});

/**
 * GET /api/v1/agents/:agentName/versions
 * Obtener historial de versiones (solo versiones guardadas en BD)
 */
router.get('/:agentName/versions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentName } = req.params;

    if (!AGENT_PROMPTS[agentName]) {
      return res.status(404).json({
        success: false,
        error: `Agente '${agentName}' no encontrado`,
      });
    }

    // Por ahora, solo tenemos la versión actual en BD
    // En el futuro, se puede implementar una tabla de historial
    const current = await prisma.agentPrompt.findUnique({
      where: { agentName },
      select: {
        version: true,
        updatedAt: true,
        updatedBy: true,
      },
    });

    res.json({
      success: true,
      data: {
        agentName,
        currentVersion: current?.version || 1,
        versions: current
          ? [
              {
                version: current.version,
                updatedAt: current.updatedAt,
                updatedBy: current.updatedBy,
              },
            ]
          : [],
      },
    });
  } catch (error) {
    logger.error('Error fetching agent versions:', error);
    res.status(500).json({ success: false, error: 'Error fetching agent versions' });
  }
});

/**
 * POST /api/v1/agents/:agentName/reset
 * Restaurar prompt a versión default (solo Admin)
 */
router.post('/:agentName/reset', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { agentName } = req.params;

    if (!AGENT_PROMPTS[agentName]) {
      return res.status(404).json({
        success: false,
        error: `Agente '${agentName}' no encontrado`,
      });
    }

    // Eliminar versión personalizada
    await prisma.agentPrompt.delete({
      where: { agentName },
    }).catch(() => {
      // Si no existe, ignorar
    });

    logger.info(`Agent prompt reset to default: ${agentName}`);

    res.json({
      success: true,
      message: `Prompt de ${agentName} restaurado a default`,
    });
  } catch (error) {
    logger.error('Error resetting agent prompt:', error);
    res.status(500).json({ success: false, error: 'Error resetting agent prompt' });
  }
});

export default router;
