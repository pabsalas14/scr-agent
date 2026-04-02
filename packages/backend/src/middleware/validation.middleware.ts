/**
 * ============================================================================
 * MIDDLEWARE DE VALIDACIÓN
 * ============================================================================
 *
 * Valida el body de las requests usando esquemas Zod
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../services/logger.service';

/**
 * Middleware genérico de validación con Zod
 */
export function validarBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req.body);

    if (!resultado.success) {
      const errores = resultado.error.errors.map((e) => ({
        campo: e.path.join('.'),
        mensaje: e.message,
      }));

      logger.warn('Validación fallida en request', { errores, path: req.path });

      res.status(400).json({
        error: 'Datos inválidos en la solicitud',
        detalles: errores,
      });
      return;
    }

    req.body = resultado.data;
    next();
  };
}

/**
 * Middleware de validación de parámetros de URL
 */
export function validarParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req.params);

    if (!resultado.success) {
      res.status(400).json({ error: 'Parámetro de URL inválido' });
      return;
    }

    next();
  };
}
