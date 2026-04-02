import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    project: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
    analysis: { create: vi.fn(), findMany: vi.fn() },
    userSettings: { findUnique: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }, auditLog: vi.fn() }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));
vi.mock('../../src/services/git.service', () => ({ gitService: { testRepositoryAccess: vi.fn() } }));
vi.mock('../../src/services/analysis-queue', () => ({ enqueueAnalysis: vi.fn() }));
vi.mock('../../src/services/crypto.service', () => ({ decrypt: vi.fn(() => 'decrypted-token') }));

import { prisma } from '../../src/services/prisma.service';
import projectsRouter from '../../src/routes/projects.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/projects', projectsRouter);

const mockPrisma = prisma as any;

const PROJECT = {
  id: 'proj-1', name: 'Test Project', repositoryUrl: 'https://github.com/test/repo',
  branch: 'main', scope: 'REPOSITORY', userId: 'user-1',
  createdAt: new Date(), updatedAt: new Date(), analyses: [],
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/projects', () => {
  it('retorna lista de proyectos', async () => {
    mockPrisma.project.findMany.mockResolvedValueOnce([PROJECT]);
    mockPrisma.project.count.mockResolvedValueOnce(1);
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/projects/:id', () => {
  it('retorna proyecto por id', async () => {
    mockPrisma.project.findUnique.mockResolvedValueOnce(PROJECT);
    const res = await request(app).get('/api/v1/projects/proj-1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('proj-1');
  });

  it('retorna 404 si no existe', async () => {
    mockPrisma.project.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/projects/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/projects', () => {
  it('valida campos requeridos', async () => {
    const res = await request(app).post('/api/v1/projects').send({ name: 'X' });
    expect(res.status).toBe(400);
  });

  it('crea proyecto cuando el repo es accesible', async () => {
    const { gitService } = await import('../../src/services/git.service');
    (gitService.testRepositoryAccess as any).mockResolvedValueOnce(undefined);
    mockPrisma.userSettings.findUnique.mockResolvedValueOnce(null);
    mockPrisma.project.create.mockResolvedValueOnce(PROJECT);

    const res = await request(app).post('/api/v1/projects').send({
      name: 'Test', repositoryUrl: 'https://github.com/test/repo', scope: 'REPOSITORY',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('proj-1');
  });

  it('retorna 400 cuando el repo no existe', async () => {
    const { gitService } = await import('../../src/services/git.service');
    (gitService.testRepositoryAccess as any).mockRejectedValueOnce(new Error('REPO_NOT_FOUND: not found'));
    mockPrisma.userSettings.findUnique.mockResolvedValueOnce(null);

    const res = await request(app).post('/api/v1/projects').send({
      name: 'Test', repositoryUrl: 'https://github.com/test/repo', scope: 'REPOSITORY',
    });
    expect(res.status).toBe(400);
    expect(res.body.details.code).toBe('REPO_NOT_FOUND');
  });
});

