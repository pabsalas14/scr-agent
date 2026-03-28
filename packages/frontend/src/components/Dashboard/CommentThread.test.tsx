import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CommentThread from './CommentThread';
import * as commentsService from '../../services/comments.service';

// Mock the services
vi.mock('../../services/comments.service', () => ({
  commentsService: {
    getComments: vi.fn(),
    createComment: vi.fn(),
    deleteComment: vi.fn(),
    updateComment: vi.fn(),
    getUnreadMentions: vi.fn(),
    markMentionsAsRead: vi.fn(),
  },
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    getToken: () => 'mock-token',
    user: { id: 'user-123', email: 'test@example.com' },
  }),
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock('../../hooks/useSocketEvents', () => ({
  useSocketEvents: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('CommentThread', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (commentsService.commentsService.getComments as any).mockResolvedValue([
      {
        id: 'comment-1',
        findingId: 'finding-123',
        userId: 'user-456',
        user: {
          id: 'user-456',
          name: 'John Doe',
          email: 'john@example.com',
        },
        content: 'First comment',
        mentions: [],
        createdAt: '2024-03-28T10:00:00Z',
        updatedAt: '2024-03-28T10:00:00Z',
      },
    ]);
  });

  it('should render the comment thread component', async () => {
    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    // Use getByRole to be more specific
    expect(screen.getByRole('heading', { name: /Comentarios/i })).toBeInTheDocument();
  });

  it('should display existing comments', async () => {
    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
    });
  });

  it('should show empty state when no comments', async () => {
    (commentsService.commentsService.getComments as any).mockResolvedValue([]);

    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/No hay comentarios aún/i)).toBeInTheDocument();
    });
  });

  it('should allow adding a comment', async () => {
    const user = userEvent.setup();
    (commentsService.commentsService.createComment as any).mockResolvedValue({
      id: 'comment-2',
      findingId: 'finding-123',
      userId: 'user-123',
      user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
      content: 'New comment',
      mentions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    const input = screen.getByPlaceholderText(/Escribir comentario/i);
    await user.type(input, 'New comment');

    const sendButton = screen.getByRole('button', { name: /Enviar/i });
    await user.click(sendButton);

    await waitFor(() => {
      expect(commentsService.commentsService.createComment).toHaveBeenCalled();
    });
  });

  it('should handle mention in comment', async () => {
    const user = userEvent.setup();

    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    const input = screen.getByPlaceholderText(/Escribir comentario/i);

    // Type @ to trigger mention suggestions
    await user.type(input, '@');

    // Should show mention suggestions (if implemented)
    // This is a basic test - full mention handling would require more UI interaction
    expect(input).toHaveValue('@');
  });

  it('should display mentions in comments', async () => {
    (commentsService.commentsService.getComments as any).mockResolvedValue([
      {
        id: 'comment-1',
        findingId: 'finding-123',
        userId: 'user-456',
        user: {
          id: 'user-456',
          name: 'John Doe',
          email: 'john@example.com',
        },
        content: 'Comment with mention',
        mentions: ['@analyst@example.com'],
        createdAt: '2024-03-28T10:00:00Z',
        updatedAt: '2024-03-28T10:00:00Z',
      },
    ]);

    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('@analyst@example.com')).toBeInTheDocument();
    });
  });

  it('should disable submit button when input is empty', async () => {
    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    const sendButton = screen.getByRole('button', { name: /Enviar/i });
    expect(sendButton).toBeDisabled();
  });

  it('should enable submit button when input has text', async () => {
    const user = userEvent.setup();

    render(<CommentThread findingId="finding-123" />, {
      wrapper: createWrapper(),
    });

    const input = screen.getByPlaceholderText(/Escribir comentario/i);
    await user.type(input, 'Test comment');

    const sendButton = screen.getByRole('button', { name: /Enviar/i });
    expect(sendButton).not.toBeDisabled();
  });
});
