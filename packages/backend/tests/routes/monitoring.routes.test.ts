import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    analysis: { count: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    report: { findMany: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/config/model-prices', () => ({
  MODEL_PRICES: { 'claude-sonnet-4-6': { input: 0.000003, output: 0.000015 } },
  DEFAULT_PRICE: { input: 0.000003, output: 0.000015 },
}));

import { prisma } from '../../src/services/prisma.service';
import monitoringRouter from '../../src/routes/monitoring.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/monitoring', monitoringRouter);

const mockPrisma = prisma as any;

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/monitoring/agents', () => {
  it('retorna lista de agentes con conteo de análisis', async () => {
    mockPrisma.analysis.count.mockResolvedValueOnce(5);
    mockPrisma.analysis.findFirst.mockResolvedValueOnce({ completedAt: new Date() });

    const res = await request(app).get('/api/v1/monitoring/agents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(3);
    expect(res.body.data[0].executionCount).toBe(5);
  });
});

describe('GET /api/v1/monitoring/agents/:id', () => {
  it('retorna agente específico', async () => {
    mockPrisma.analysis.count.mockResolvedValueOnce(3);
    mockPrisma.analysis.findFirst.mockResolvedValueOnce(null);

    const res = await request(app).get('/api/v1/monitoring/agents/inspector-001');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('inspector-001');
  });

  it('retorna 404 para agente inexistente', async () => {
    const res = await request(app).get('/api/v1/monitoring/agents/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/monitoring/agents/:id/executions', () => {
  it('retorna historial de ejecuciones con IDs reales', async () => {
    const analyses = [
      { id: 'analysis-real-id-1', createdAt: new Date(), completedAt: new Date(), status: 'COMPLETED' },
      { id: 'analysis-real-id-2', createdAt: new Date(), completedAt: null, status: 'RUNNING' },
    ];
    mockPrisma.analysis.findMany.mockResolvedValueOnce(analyses);

    const res = await request(app).get('/api/v1/monitoring/agents/inspector-001/executions');
    expect(res.status).toBe(200);
    expect(res.body.data[0].id).toBe('analysis-real-id-1');
    expect(res.body.data[0].id).not.toMatch(/^exec-/);
  });
});

describe('GET /api/v1/monitoring/costs', () => {
  it('retorna costos del período', async () => {
    mockPrisma.analysis.findMany.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/v1/monitoring/costs?period=today');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalCostUSD');
  });
});
