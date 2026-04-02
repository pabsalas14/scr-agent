import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    notification: { findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));

import { prisma } from '../../src/services/prisma.service';
import notificationsRouter from '../../src/routes/notifications.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/notifications', notificationsRouter);

const mockPrisma = prisma as any;

const NOTIF = {
  id: 'notif-1', userId: 'user-1', type: 'FINDING_ASSIGNED',
  title: 'Test', message: 'Test message', isRead: false,
  createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('GET /api/v1/notifications', () => {
  it('retorna lista de notificaciones del usuario', async () => {
    mockPrisma.notification.findMany.mockResolvedValueOnce([NOTIF]);
    mockPrisma.notification.count.mockResolvedValueOnce(1);

    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('PUT /api/v1/notifications/:notificationId/read', () => {
  it('marca notificación como leída', async () => {
    mockPrisma.notification.findFirst.mockResolvedValueOnce(NOTIF);
    mockPrisma.notification.update.mockResolvedValueOnce({ ...NOTIF, isRead: true });

    const res = await request(app).put('/api/v1/notifications/notif-1/read');
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/v1/notifications/mark-all-read', () => {
  it('marca todas como leídas', async () => {
    mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 3 });

    const res = await request(app).put('/api/v1/notifications/mark-all-read');
    expect(res.status).toBe(200);
  });
});
