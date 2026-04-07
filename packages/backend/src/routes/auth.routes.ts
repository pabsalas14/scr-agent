/**
 * ============================================================================
 * RUTAS DE AUTENTICACIÓN
 * ============================================================================
 *
 * POST /api/v1/auth/register - Crear usuario con bcrypt
 * POST /api/v1/auth/login    - Verificar credenciales, devolver JWT
 * POST /api/v1/auth/verify   - Verificar token, devolver usuario
 */

import { Router, Request, Response, IRouter } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../services/prisma.service';
import { logger } from '../services/logger.service';

const router: IRouter = Router();

const JWT_SECRET = process.env['JWT_SECRET'];
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '24h';
const BCRYPT_ROUNDS = 12;

// ==================== SCHEMAS DE VALIDACIÓN ====================

const RegisterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(128),
});

const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const VerifySchema = z.object({
  token: z.string().min(1, 'Token requerido'),
});

// ==================== HELPER ====================

function generateToken(id: string, email: string): string {
  return jwt.sign({ id, email }, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

// ==================== RUTAS ====================

/**
 * POST /api/v1/auth/register
 * Crea un nuevo usuario
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, ...(name ? { name } : {}) },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const token = generateToken(user.id, user.email);
    logger.info({ message: 'Usuario registrado', userId: user.id });

    res.status(201).json({ token, user });
  } catch (err) {
    logger.error({ message: 'Error en register', error: err });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/v1/auth/login
 * Verifica credenciales y devuelve JWT
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = generateToken(user.id, user.email);
    logger.info({ message: 'Login exitoso', userId: user.id });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name ?? null, createdAt: user.createdAt } });
  } catch (err) {
    logger.error({ message: 'Error en login', error: err });
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/v1/auth/verify
 * Verifica token JWT y devuelve usuario
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  const parsed = VerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Token requerido' });
    return;
  }

  const { token } = parsed.data;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { id: string; email: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, createdAt: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ valid: true, user });
  } catch {
    res.status(401).json({ valid: false, error: 'Token inválido o expirado' });
  }
});

export default router;
