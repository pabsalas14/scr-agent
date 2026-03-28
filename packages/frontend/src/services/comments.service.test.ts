import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commentsService, Comment, CommentMention } from './comments.service';

// Mock axios
vi.mock('axios', () => {
  const axios = {
    create: vi.fn(() => ({
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    })),
  };
  return { default: axios };
});

describe('CommentsService', () => {
  describe('createComment', () => {
    it('should create a comment with mentions', async () => {
      const mockComment: Comment = {
        id: 'comment-123',
        findingId: 'finding-456',
        userId: 'user-789',
        user: {
          id: 'user-789',
          name: 'John Doe',
          email: 'john@example.com',
        },
        content: 'This is a test comment @user1@example.com',
        mentions: ['@user1@example.com'],
        createdAt: '2024-03-28T10:00:00Z',
        updatedAt: '2024-03-28T10:00:00Z',
      };

      // Mock the service method
      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { data: mockComment } }),
      } as any);

      const result = await commentsService.createComment(
        'finding-456',
        'This is a test comment @user1@example.com',
        ['@user1@example.com']
      );

      expect(result).toEqual(mockComment);
      expect(result.mentions).toContain('@user1@example.com');
    });

    it('should create a comment without mentions', async () => {
      const mockComment: Comment = {
        id: 'comment-123',
        findingId: 'finding-456',
        userId: 'user-789',
        user: {
          id: 'user-789',
          name: 'John Doe',
          email: 'john@example.com',
        },
        content: 'Simple comment',
        mentions: [],
        createdAt: '2024-03-28T10:00:00Z',
        updatedAt: '2024-03-28T10:00:00Z',
      };

      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: { data: mockComment } }),
      } as any);

      const result = await commentsService.createComment(
        'finding-456',
        'Simple comment'
      );

      expect(result.content).toBe('Simple comment');
      expect(result.mentions).toEqual([]);
    });
  });

  describe('getComments', () => {
    it('should fetch comments for a finding', async () => {
      const mockComments: Comment[] = [
        {
          id: 'comment-1',
          findingId: 'finding-456',
          userId: 'user-789',
          user: {
            id: 'user-789',
            name: 'John Doe',
            email: 'john@example.com',
          },
          content: 'Comment 1',
          mentions: [],
          createdAt: '2024-03-28T10:00:00Z',
          updatedAt: '2024-03-28T10:00:00Z',
        },
        {
          id: 'comment-2',
          findingId: 'finding-456',
          userId: 'user-999',
          user: {
            id: 'user-999',
            name: 'Jane Smith',
            email: 'jane@example.com',
          },
          content: 'Comment 2',
          mentions: [],
          createdAt: '2024-03-28T11:00:00Z',
          updatedAt: '2024-03-28T11:00:00Z',
        },
      ];

      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: { data: mockComments } }),
      } as any);

      const result = await commentsService.getComments('finding-456');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Comment 1');
      expect(result[1].content).toBe('Comment 2');
    });

    it('should return empty array if no comments', async () => {
      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      } as any);

      const result = await commentsService.getComments('finding-456');

      expect(result).toEqual([]);
    });
  });

  describe('deleteComment', () => {
    it('should delete a comment', async () => {
      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        delete: vi.fn().mockResolvedValue({ data: { success: true } }),
      } as any);

      await expect(
        commentsService.deleteComment('finding-456', 'comment-123')
      ).resolves.not.toThrow();
    });
  });

  describe('getUnreadMentions', () => {
    it('should fetch unread mentions for current user', async () => {
      const mockMentions: CommentMention[] = [
        {
          id: 'mention-1',
          commentId: 'comment-123',
          mentionedUserId: 'user-789',
          read: false,
          createdAt: '2024-03-28T10:00:00Z',
        },
      ];

      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: { data: mockMentions } }),
      } as any);

      const result = await commentsService.getUnreadMentions();

      expect(result).toHaveLength(1);
      expect(result[0].read).toBe(false);
    });
  });

  describe('markMentionsAsRead', () => {
    it('should mark mentions as read', async () => {
      vi.spyOn(commentsService as any, 'client').mockReturnValue({
        put: vi.fn().mockResolvedValue({ data: { success: true } }),
      } as any);

      await expect(
        commentsService.markMentionsAsRead(['mention-1', 'mention-2'])
      ).resolves.not.toThrow();
    });
  });
});
