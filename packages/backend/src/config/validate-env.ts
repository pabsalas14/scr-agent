/**
 * Valida variables de entorno en arranque (Zod).
 * En producción exige credenciales críticas; en development solo advierte.
 */

import { z } from 'zod';
import { logger } from '../services/logger.service';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  BACKEND_PORT: z.coerce.number().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

let validated = false;

export function validateEnvOrExit(): void {
  if (validated) {
    return;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const msg = `Variables de entorno: ${result.error.issues.map((i) => i.path.join('.')).join(', ')} — ${result.error.message}`;
    if (process.env['NODE_ENV'] === 'production') {
      throw new Error(msg);
    }
    logger.warn(msg);
  }

  const isProd = (process.env['NODE_ENV'] || 'development') === 'production';
  if (isProd) {
    if (!process.env['JWT_SECRET'] || process.env['JWT_SECRET']!.length < 32) {
      throw new Error('JWT_SECRET debe existir y tener al menos 32 caracteres en producción.');
    }
    if (!process.env['ENCRYPTION_KEY'] || process.env['ENCRYPTION_KEY']!.length !== 64) {
      throw new Error('ENCRYPTION_KEY debe ser 64 caracteres hex (32 bytes) en producción.');
    }
  } else {
    if (!process.env['JWT_SECRET']) {
      logger.warn('JWT_SECRET no definida: la autenticación y WebSockets JWT pueden fallar.');
    }
  }

  validated = true;
}
