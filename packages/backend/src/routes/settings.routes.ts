/**
 * ============================================================================
 * RUTAS DE CONFIGURACIÓN DEL USUARIO
 * ============================================================================
 *
 * POST   /api/v1/settings/github-token        → Guardar + validar GitHub token
 * GET    /api/v1/settings                     → Obtener configuraciones del usuario
 * DELETE /api/v1/settings/github-token        → Eliminar GitHub token
 *
 * SEGURIDAD:
 * - Tokens encriptados en BD
 * - Validación contra API de GitHub
 * - Solo el usuario propietario puede ver sus tokens
 */

import { Router, type Router as ExpressRouter, Response } from 'express';
import { z } from 'zod';
import { validarBody } from '../middleware/validation.middleware';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
import { prisma } from '../services/prisma.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { encrypt } from '../services/crypto.service';
import axios from 'axios';

const router: ExpressRouter = Router();

/**
 * Schema para guardar GitHub token
 */
const GitHubTokenSchema = z.object({
  token: z.string().min(20), // GitHub tokens son largos
});

/**
 * POST /api/v1/settings/github-token
 * Guardar y validar GitHub token
 */
router.post('/github-token', validarBody(GitHubTokenSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Validar token contra GitHub API
     */
    try {
      const response = await axios.head('https://api.github.com/user', {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
        timeout: 5000,
      });

      if (response.status !== 200) {
        res.status(401).json({
          error: 'Token de GitHub inválido o expirado',
          valid: false,
        });
        return;
      }
    } catch (error) {
      res.status(401).json({
        error: 'No se pudo validar el token con GitHub API',
        valid: false,
      });
      return;
    }

    /**
     * Guardar token en BD (tabla UserSettings)
     * Usar upsert para crear o actualizar
     */
    const encryptedToken = encrypt(token);
    await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        githubToken: encryptedToken,
        githubValidatedAt: new Date(),
      },
      update: {
        githubToken: encryptedToken,
        githubValidatedAt: new Date(),
      },
    });

    auditLog(AuditEventType.DB_OPERATION, 'GitHub token guardado y validado', {
      userId,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      message: 'GitHub token validado y guardado',
      valid: true,
      scopes: ['repo', 'read:org'], // Scopes esperados
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error guardando GitHub token: ${msg}`);
    res.status(500).json({ error: 'Error al guardar GitHub token' });
  }
});

/**
 * GET /api/v1/settings
 * Obtener configuraciones del usuario (sin exponer tokens)
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Obtener configuraciones del usuario
     */
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    res.json({
      data: {
        has_github_token: !!settings?.githubToken,
        github_validated_at: settings?.githubValidatedAt || null,
        has_api_key: !!settings?.apiKey,
        preferences: {
          darkMode: settings?.darkMode ?? false,
          autoRefresh: settings?.autoRefresh ?? 10000,
        },
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error obteniendo configuraciones: ${msg}`);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

/**
 * DELETE /api/v1/settings/github-token
 * Eliminar GitHub token
 */
router.delete('/github-token', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    /**
     * Eliminar token de la BD
     */
    await prisma.userSettings.update({
      where: { userId },
      data: {
        githubToken: null,
        githubValidatedAt: null,
      },
    });

    auditLog(AuditEventType.DB_OPERATION, 'GitHub token eliminado', {
      userId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: 'GitHub token eliminado exitosamente',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(`Error eliminando GitHub token: ${msg}`);
    res.status(500).json({ error: 'Error al eliminar GitHub token' });
  }
});

export default router;
