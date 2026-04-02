import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    analysis: { findUnique: vi.fn(), update: vi.fn() },
    finding:  { findMany: vi.fn(), count: vi.fn() },
    report:   { findUnique: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));
vi.mock('../../src/services/analysis-queue', () => ({ enqueueAnalysis: vi.fn() }));

import { prisma } from '../../src/services/prisma.service';
import analysesRouter from '../../src/routes/analyses.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/analyses', analysesRouter);

const mockPrisma = prisma as any;

const ANALYSIS = {
  id: 'an-1', projectId: 'proj-1', status: 'COMPLETED', progress: 100,
  findings: [], project: { id: 'proj-1', userId: 'user-1' },
  createdAt: new Date(), updatedAt: new Date(),
};

const REPORT = {
  id: 'rep-1', analysisId: 'an-1', executiveSummary: 'OK', riskScore: 20,
  findingsCount: 0, severityBreakdown: {}, compromisedFunctions: [],
  affectedAuthors: [], remediationSteps: [], generalRecommendation: 'None',
  inputTokens: 10, outputTokens: 20, model: 'claude-sonnet-4-6',
};

beforeEach(() => vi.resetAllMocks());

describe('GET /api/v1/analyses/:id', () => {
  it('retorna análisis existente', async () => {
    mockPrisma.analysis.findUnique.mockResolvedValueOnce(ANALYSIS);
    const res = await request(app).get('/api/v1/analyses/an-1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('an-1');
  });

  it('retorna 404 si no existe', async () => {
    mockPrisma.analysis.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/analyses/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/analyses/:id/findings', () => {
  it('retorna hallazgos paginados', async () => {
    mockPrisma.finding.findMany.mockResolvedValueOnce([]);
    mockPrisma.finding.count.mockResolvedValueOnce(0);
    const res = await request(app).get('/api/v1/analyses/an-1/findings?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('retorna lista vacía si el análisis no tiene hallazgos', async () => {
    mockPrisma.finding.findMany.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/v1/analyses/no-existe/findings');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('GET /api/v1/analyses/:id/report', () => {
  it('retorna reporte del análisis', async () => {
    mockPrisma.report.findUnique.mockResolvedValueOnce(REPORT);
    const res = await request(app).get('/api/v1/analyses/an-1/report');
    expect(res.status).toBe(200);
    expect(res.body.data.riskScore).toBe(20);
  });

  it('retorna 404 si no hay reporte', async () => {
    mockPrisma.report.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/analyses/an-1/report');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/analyses/:analysisId/retry', () => {
  it('re-encola análisis fallido', async () => {
    const failed = { ...ANALYSIS, status: 'FAILED', projectId: 'proj-1', project: { id: 'proj-1', userId: 'user-1' } };
    const pending = { ...failed, status: 'PENDING', progress: 0, errorMessage: null };
    mockPrisma.analysis.findUnique.mockResolvedValueOnce(failed);
    mockPrisma.analysis.update.mockResolvedValueOnce(pending);
    const res = await request(app).post('/api/v1/analyses/an-1/retry');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('retorna 400 si el análisis no está fallido', async () => {
    const completed = { ...ANALYSIS, projectId: 'proj-1', project: { id: 'proj-1', userId: 'user-1' } };
    mockPrisma.analysis.findUnique.mockResolvedValueOnce(completed);
    const res = await request(app).post('/api/v1/analyses/an-1/retry');
    expect(res.status).toBe(400);
  });

  it('retorna 404 si el análisis no existe', async () => {
    mockPrisma.analysis.findUnique.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/v1/analyses/an-1/retry');
    expect(res.status).toBe(404);
  });
});
