/**
 * ============================================================================
 * MIDDLEWARE JWT - Verificación de autenticación
 * ============================================================================
 *
 * Verifica el token JWT en el header Authorization de cada request.
 * Aplica a todas las rutas excepto /api/v1/auth/*
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../services/logger.service';

const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware de autenticación JWT
 * Rutas públicas (excluidas): /api/v1/auth/*
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // Excluir rutas de autenticación
  if (req.path.startsWith('/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticación requerido' });
    return;
  }

  const token = authHeader.split(' ')[1]!;

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as unknown as { id: string; email: string; role?: string };
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role ?? 'VIEWER' };
    next();
  } catch (err) {
    logger.warn({ message: 'Token JWT inválido', error: err });
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
