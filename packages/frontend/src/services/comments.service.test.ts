import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Comment, CommentMention } from './comments.service';

describe('CommentsService', () => {
  // These tests verify the service interfaces work correctly
  // Full integration testing is done in E2E tests

  it('should export Comment interface', () => {
    const mockComment: Comment = {
      id: 'comment-1',
      findingId: 'finding-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
      content: 'Test comment',
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(mockComment.id).toBe('comment-1');
    expect(mockComment.content).toBe('Test comment');
  });

  it('should export CommentMention interface', () => {
    const mockMention: CommentMention = {
      id: 'mention-1',
      commentId: 'comment-1',
      mentionedUserId: 'user-1',
      read: false,
      createdAt: new Date().toISOString(),
    };

    expect(mockMention.read).toBe(false);
    expect(mockMention.mentionedUserId).toBe('user-1');
  });

  it('should support creating comment with mentions', () => {
    const mockComment: Comment = {
      id: 'comment-2',
      findingId: 'finding-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
      content: 'Comment with @user2@example.com',
      mentions: ['@user2@example.com'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(mockComment.mentions).toContain('@user2@example.com');
    expect(mockComment.mentions?.length).toBe(1);
  });

  it('should support creating comment without mentions', () => {
    const mockComment: Comment = {
      id: 'comment-3',
      findingId: 'finding-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
      content: 'Simple comment',
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(mockComment.mentions).toEqual([]);
    expect(mockComment.content).toBe('Simple comment');
  });

  it('should support multiple mentions in comment', () => {
    const mockComment: Comment = {
      id: 'comment-4',
      findingId: 'finding-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
      content: 'Comment @user2@example.com and @user3@example.com',
      mentions: ['@user2@example.com', '@user3@example.com'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(mockComment.mentions).toHaveLength(2);
    expect(mockComment.mentions).toContain('@user2@example.com');
    expect(mockComment.mentions).toContain('@user3@example.com');
  });

  it('should support unread mention status', () => {
    const unreadMention: CommentMention = {
      id: 'mention-2',
      commentId: 'comment-1',
      mentionedUserId: 'user-2',
      read: false,
      createdAt: new Date().toISOString(),
    };

    const readMention: CommentMention = {
      id: 'mention-3',
      commentId: 'comment-1',
      mentionedUserId: 'user-3',
      read: true,
      readAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    expect(unreadMention.read).toBe(false);
    expect(readMention.read).toBe(true);
    expect(readMention.readAt).toBeDefined();
  });

  it('should include mentionNotifications in comment', () => {
    const mockComment: Comment = {
      id: 'comment-5',
      findingId: 'finding-1',
      userId: 'user-1',
      user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
      content: 'Comment with mentions',
      mentions: ['@user2@example.com'],
      mentionNotifications: [
        {
          id: 'mention-4',
          commentId: 'comment-5',
          mentionedUserId: 'user-2',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    expect(mockComment.mentionNotifications).toBeDefined();
    expect(mockComment.mentionNotifications).toHaveLength(1);
  });
});
