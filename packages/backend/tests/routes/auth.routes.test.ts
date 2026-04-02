/**
 * ============================================================================
 * TESTS: Auth Routes
 * ============================================================================
 *
 * Pruebas de los endpoints de autenticación
 * Verifica registro, login y verificación de token
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// ── Mock de Prisma ────────────────────────────────────────────────────────────
vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../../src/services/logger.service', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), http: vi.fn() },
}));

import { prisma } from '../../src/services/prisma.service';
import authRouter from '../../src/routes/auth.routes';

const mockPrisma = prisma as any;

// ── Setup de app Express minimal ─────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);

// ── Fixtures ─────────────────────────────────────────────────────────────────
const TEST_USER = {
  id: 'user-123',
  email: 'test@scr.local',
  name: 'Test User',
  passwordHash: '', // se rellena en beforeAll
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeAll(async () => {
  // Pre-hash the password so login tests work
  const bcrypt = await import('bcryptjs');
  TEST_USER.passwordHash = await bcrypt.hash('Secret123!', 12);
});

afterAll(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('POST /api/v1/auth/register', () => {
  it('crea usuario y retorna token', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockPrisma.user.create.mockResolvedValueOnce(TEST_USER);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'nuevo@scr.local',
      password: 'Secret123!',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('retorna 409 cuando el email ya existe', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@scr.local',
      password: 'Secret123!',
    });

    expect(res.status).toBe(409);
  });

  it('retorna 400 cuando faltan campos requeridos', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'incomplete@scr.local',
      // password ausente
    });

    expect(res.status).toBe(400);
  });

  it('retorna 400 para email inválido', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'no-es-email',
      password: 'Secret123!',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('retorna token con credenciales correctas', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@scr.local',
      password: 'Secret123!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('retorna 401 con contraseña incorrecta', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@scr.local',
      password: 'contraseña-incorrecta',
    });

    expect(res.status).toBe(401);
  });

  it('retorna 401 cuando el usuario no existe', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'noexiste@scr.local',
      password: 'Secret123!',
    });

    expect(res.status).toBe(401);
  });

  it('retorna 400 para cuerpo vacío', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/verify', () => {
  it('verifica token válido y retorna info del usuario', async () => {
    // Primero obtener un token válido haciendo login
    mockPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER);
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'test@scr.local',
      password: 'Secret123!',
    });

    const { token } = loginRes.body;

    mockPrisma.user.findUnique.mockResolvedValueOnce(TEST_USER);
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ token });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_USER.email);
  });

  it('retorna 400 sin token', async () => {
    const res = await request(app).post('/api/v1/auth/verify').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 401 con token inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify')
      .send({ token: 'token.invalido.xxx' });

    expect(res.status).toBe(401);
  });
});
