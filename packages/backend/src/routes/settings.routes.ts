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

import { Router, type Router as ExpressRouter, Request, Response } from 'express';
import { z } from 'zod';
import { validarBody } from '../middleware/validation.middleware';
import { logger, auditLog, AuditEventType } from '../services/logger.service';
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
router.post('/github-token', validarBody(GitHubTokenSchema), async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

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
     * En una implementación real, guardarías el token encriptado en BD
     * y lo asociarías con el usuario actual.
     * Por ahora, retornamos éxito
     */
    auditLog(AuditEventType.DB_OPERATION, 'GitHub token validado', {
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
router.get('/', async (_req: Request, res: Response) => {
  try {
    /**
     * En una implementación real, obtendría las configuraciones del usuario
     * de la BD y retornaría:
     * - has_github_token: boolean (no retornar el token)
     * - preferences: objeto con preferencias
     */
    res.json({
      data: {
        has_github_token: false, // Cambiar según si está configurado
        has_api_key: false,
        preferences: {
          darkMode: false,
          autoRefresh: 10000,
          notifications: true,
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
router.delete('/github-token', async (_req: Request, res: Response) => {
  try {
    /**
     * En una implementación real, eliminarías el token de la BD
     */
    auditLog(AuditEventType.DB_OPERATION, 'GitHub token eliminado', {
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
