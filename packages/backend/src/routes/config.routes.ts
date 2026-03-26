/**
 * ============================================================================
 * RUTAS DE CONFIGURACIÓN
 * ============================================================================
 *
 * GET  /api/v1/config        → Obtener configuración actual (sin API key)
 * POST /api/v1/config        → Actualizar configuración
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { configService } from '../services/config.service';
import { validarBody } from '../middleware/validation.middleware';

const router = Router();

const UpdateConfigSchema = z.object({
  anthropicApiKey: z.string().min(10).optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  maxFilesPerRepo: z.number().int().min(1).max(200).optional(),
  maxFileSizeKb: z.number().int().min(1).max(1000).optional(),
});

/**
 * GET /api/v1/config
 * Devuelve la configuración pública (sin exponer el API key)
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ data: configService.getPublic() });
});

/**
 * POST /api/v1/config
 * Actualizar configuración del servidor
 */
router.post('/', validarBody(UpdateConfigSchema), (req: Request, res: Response) => {
  configService.update(req.body);
  res.json({ data: configService.getPublic(), message: 'Configuración actualizada' });
});

export default router;
