import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: { finding: { findUnique: vi.fn() } },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));
vi.mock('../../src/services/findings.service', () => ({
  findingsService: {
    getFindings:          vi.fn(),
    getFindingDetail:     vi.fn(),
    updateFindingStatus:  vi.fn(),
    assignFinding:        vi.fn(),
    unassignFinding:      vi.fn(),
    getRemediation:       vi.fn(),
    createOrUpdateRemediation: vi.fn(),
    verifyRemediation:    vi.fn(),
    getFindingsStats:     vi.fn(),
  },
}));
vi.mock('../../src/services/users.service', () => ({
  usersService: { getUserDetail: vi.fn(), getUserRole: vi.fn() },
}));
vi.mock('../../src/services/notifications.service', () => ({
  notificationsService: { notifyFindingStatusChange: vi.fn(), notifyFindingAssigned: vi.fn() },
}));
vi.mock('../../src/services/socket.service', () => ({
  socketService: { emitFindingStatusChanged: vi.fn(), emitFindingAssigned: vi.fn() },
}));

import { findingsService } from '../../src/services/findings.service';
import findingsRouter from '../../src/routes/findings.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/findings', findingsRouter);

const mockService = findingsService as any;

const FINDING = {
  id: 'f-1', analysisId: 'a-1', severity: 'CRITICAL', status: 'DETECTED',
  description: 'Test finding', file: 'src/auth.js',
  createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/findings/analysis/:analysisId', () => {
  it('retorna hallazgos sin paginar', async () => {
    mockService.getFindings.mockResolvedValueOnce([FINDING]);
    const res = await request(app).get('/api/v1/findings/analysis/a-1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('retorna hallazgos paginados', async () => {
    mockService.getFindings.mockResolvedValueOnce({ data: [FINDING], total: 1, page: 1, limit: 10, hasMore: false });
    const res = await request(app).get('/api/v1/findings/analysis/a-1?page=1&limit=10');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/v1/findings/:findingId', () => {
  it('retorna detalle del hallazgo', async () => {
    mockService.getFindingDetail.mockResolvedValueOnce(FINDING);
    const res = await request(app).get('/api/v1/findings/f-1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('f-1');
  });

  it('retorna 404 si no existe', async () => {
    mockService.getFindingDetail.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/v1/findings/no-existe');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/v1/findings/:findingId/status', () => {
  it('cambia estado correctamente', async () => {
    mockService.updateFindingStatus.mockResolvedValueOnce({ ...FINDING, status: 'IN_REVIEW' });
    const { usersService } = await import('../../src/services/users.service');
    (usersService.getUserDetail as any).mockResolvedValueOnce({ name: 'Tester' });
    const res = await request(app)
      .put('/api/v1/findings/f-1/status')
      .send({ status: 'IN_REVIEW' });
    expect(res.status).toBe(200);
  });

  it('retorna 400 sin status', async () => {
    const res = await request(app).put('/api/v1/findings/f-1/status').send({});
    expect(res.status).toBe(400);
  });

  it('retorna 400 con status inválido', async () => {
    const res = await request(app)
      .put('/api/v1/findings/f-1/status')
      .send({ status: 'INVALID_STATUS' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/findings/analysis/:analysisId/stats', () => {
  it('retorna estadísticas por severidad', async () => {
    mockService.getFindingsStats.mockResolvedValueOnce({ CRITICAL: 1, HIGH: 2, MEDIUM: 0, LOW: 0 });
    const res = await request(app).get('/api/v1/findings/analysis/a-1/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
