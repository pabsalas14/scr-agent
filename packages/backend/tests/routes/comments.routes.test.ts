import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../src/services/prisma.service', () => ({
  prisma: {
    comment: { findUnique: vi.fn() },
  },
}));
vi.mock('../../src/services/logger.service', () => ({ logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() } }));
vi.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => { req.user = { id: 'user-1', role: 'ANALYST' }; next(); },
}));
vi.mock('../../src/services/comments.service', () => ({
  commentsService: {
    createComment:         vi.fn(),
    getCommentsByFinding:  vi.fn(),
    getCommentById:        vi.fn(),
    updateComment:         vi.fn(),
    deleteComment:         vi.fn(),
    getUnreadMentions:     vi.fn(),
    markMentionsAsRead:    vi.fn(),
  },
}));
vi.mock('../../src/services/socket.service', () => ({
  socketService: { emitNewComment: vi.fn(), emitCommentUpdated: vi.fn(), emitCommentDeleted: vi.fn() },
}));
vi.mock('../../src/services/notifications.service', () => ({
  notificationsService: { notifyMention: vi.fn() },
}));

import { prisma } from '../../src/services/prisma.service';
import { commentsService } from '../../src/services/comments.service';
import commentsRouter from '../../src/routes/comments.routes';

const app = express();
app.use(express.json());
app.use('/api/v1/findings', commentsRouter);

const mockService = commentsService as any;
const mockPrisma = prisma as any;

const COMMENT = {
  id: 'c-1', findingId: 'f-1', userId: 'user-1',
  content: 'Test comment', mentions: [],
  createdAt: new Date(), updatedAt: new Date(),
  user: { id: 'user-1', name: 'Tester', email: 'test@test.com' },
};

beforeEach(() => vi.clearAllMocks());

describe('POST /api/v1/findings/:findingId/comments', () => {
  it('crea comentario correctamente', async () => {
    mockService.createComment.mockResolvedValueOnce(COMMENT);
    const res = await request(app)
      .post('/api/v1/findings/f-1/comments')
      .send({ content: 'Test comment' });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe('c-1');
  });

  it('retorna 400 sin contenido', async () => {
    const res = await request(app)
      .post('/api/v1/findings/f-1/comments')
      .send({ content: '' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/findings/:findingId/comments', () => {
  it('retorna lista de comentarios', async () => {
    mockService.getCommentsByFinding.mockResolvedValueOnce([COMMENT]);
    const res = await request(app).get('/api/v1/findings/f-1/comments');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('PUT /api/v1/findings/:findingId/comments/:commentId', () => {
  it('actualiza comentario del autor', async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(COMMENT); // owner = user-1
    mockService.updateComment.mockResolvedValueOnce({ ...COMMENT, content: 'Updated' });
    const res = await request(app)
      .put('/api/v1/findings/f-1/comments/c-1')
      .send({ content: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.content).toBe('Updated');
  });

  it('retorna 403 si no es el autor', async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce({ ...COMMENT, userId: 'otro-user' });
    const res = await request(app)
      .put('/api/v1/findings/f-1/comments/c-1')
      .send({ content: 'Hack' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/findings/:findingId/comments/:commentId', () => {
  it('elimina comentario del autor', async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce(COMMENT);
    mockService.deleteComment.mockResolvedValueOnce(COMMENT);
    const res = await request(app).delete('/api/v1/findings/f-1/comments/c-1');
    expect(res.status).toBe(200);
  });

  it('retorna 403 si no es el autor', async () => {
    mockPrisma.comment.findUnique.mockResolvedValueOnce({ ...COMMENT, userId: 'otro-user' });
    const res = await request(app).delete('/api/v1/findings/f-1/comments/c-1');
    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/findings/mentions/unread', () => {
  it('retorna menciones no leídas', async () => {
    mockService.getUnreadMentions.mockResolvedValueOnce([]);
    const res = await request(app).get('/api/v1/findings/mentions/unread');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
