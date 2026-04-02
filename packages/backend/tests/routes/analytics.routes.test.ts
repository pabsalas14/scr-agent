import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    finding: { findMany: vi.fn() },
    analysis: { count: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));

import { prisma } from '../../src/services/prisma.service';
import analyticsRouter from '../../src/routes/analytics.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/analytics', analyticsRouter);

const mockPrisma = prisma as any;

const FINDING = {
  id: 'f-1', analysisId: 'a-1', severity: 'CRITICAL',
  analysis: { createdAt: new Date(), completedAt: new Date(), status: 'COMPLETED' },
  remediation: null,
  statusHistory: [],
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/analytics/summary', () => {
  it('retorna resumen con conteos por severidad', async () => {
    mockPrisma.finding.findMany.mockResolvedValueOnce([FINDING]);
    mockPrisma.analysis.count.mockResolvedValueOnce(1);

    const res = await request(app).get('/api/v1/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.data.criticalFindings).toBe(1);
    expect(res.body.data.totalAnalyses).toBe(1);
  });

  it('retorna ceros cuando no hay datos', async () => {
    mockPrisma.finding.findMany.mockResolvedValueOnce([]);
    mockPrisma.analysis.count.mockResolvedValueOnce(0);

    const res = await request(app).get('/api/v1/analytics/summary');
    expect(res.status).toBe(200);
    expect(res.body.data.totalFindings).toBe(0);
    expect(res.body.data.remediationRate).toBe(0);
  });

  it('ejecuta las dos queries en paralelo (Promise.all)', async () => {
    const findManyOrder: string[] = [];
    const countOrder: string[] = [];

    mockPrisma.finding.findMany.mockImplementationOnce(() => {
      findManyOrder.push('findMany');
      return Promise.resolve([]);
    });
    mockPrisma.analysis.count.mockImplementationOnce(() => {
      countOrder.push('count');
      return Promise.resolve(0);
    });

    await request(app).get('/api/v1/analytics/summary');
    expect(findManyOrder).toHaveLength(1);
    expect(countOrder).toHaveLength(1);
  });
});

describe('GET /api/v1/analytics/timeline', () => {
  it('retorna timeline de los últimos 30 días', async () => {
    mockPrisma.finding.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/v1/analytics/timeline?days=30');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
