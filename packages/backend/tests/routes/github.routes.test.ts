import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    userSettings: { findUnique: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  AuthenticatedRequest: {},
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));
vi.mock('../../src/services/crypto.service', () => ({ decrypt: vi.fn(() => 'gh-token-decrypted') }));
vi.mock('axios');

import { prisma } from '../../src/services/prisma.service';
import axios from 'axios';
import githubRouter from '../../src/routes/github.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/github', githubRouter);

const mockPrisma = prisma as any;
const mockAxios = axios as any;

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/github/repos', () => {
  it('retorna 400 cuando no hay token configurado', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/github/repos');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/token/i);
  });

  it('retorna repos cuando hay token y GitHub responde', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValueOnce({ githubToken: 'encrypted' });
    const repo = { id: 1, name: 'repo1', full_name: 'testuser/repo1', private: false, clone_url: 'https://github.com/testuser/repo1.git', html_url: 'https://github.com/testuser/repo1', default_branch: 'main', language: 'TypeScript', stargazers_count: 0, updated_at: new Date().toISOString() };
    mockAxios.get = vi.fn()
      .mockResolvedValueOnce({ data: { login: 'testuser', organizations_url: 'https://api.github.com/users/testuser/orgs' } })
      .mockResolvedValueOnce({ data: { items: [repo], total_count: 1 } });

    const res = await request(app).get('/api/v1/github/repos');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/github/repos/:owner/:repo/branches', () => {
  it('retorna 400 cuando no hay token', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/github/repos/owner/repo/branches');
    expect(res.status).toBe(400);
  });

  it('retorna ramas del repositorio', async () => {
    mockPrisma.userSettings.findUnique.mockResolvedValueOnce({ githubToken: 'encrypted' });
    mockAxios.get = vi.fn().mockResolvedValueOnce({
      data: [{ name: 'main', commit: { sha: 'abc123' }, protected: false }],
    });
    const res = await request(app).get('/api/v1/github/repos/owner/repo/branches');
    expect(res.status).toBe(200);
    expect(res.body.data.branches[0].name).toBe('main');
  });
});
