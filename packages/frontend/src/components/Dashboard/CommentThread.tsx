/**
 * ============================================================================
 * COMMENT THREAD - Hilo de comentarios para hallazgos
 * ============================================================================
 *
 * Componente para mostrar y gestionar comentarios en tiempo real
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageSquare, User } from 'lucide-react';
import { commentsService, Comment } from '../../services/comments.service';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import { useSocketEvents } from '../../hooks/useSocketEvents';

interface CommentThreadProps {
  findingId: string;
}

export default function CommentThread({ findingId }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Get current user ID from token
  const getCurrentUserId = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return payload.sub || payload.userId;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Fetch comments
  const { data: comments = [], refetch: refetchComments } = useQuery({
    queryKey: ['comments', findingId],
    queryFn: () => commentsService.getComments(findingId),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) => commentsService.createComment(findingId, content),
    onSuccess: () => {
      setNewComment('');
      toast.success('Comentario añadido');
      refetchComments();
    },
    onError: () => {
      toast.error('Error al crear comentario');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => commentsService.deleteComment(findingId, commentId),
    onSuccess: () => {
      toast.success('Comentario eliminado');
      refetchComments();
    },
    onError: () => {
      toast.error('Error al eliminar comentario');
    },
  });

  // Listen to socket events for new comments
  useSocketEvents({
    onCommentAdded: (data) => {
      if (data.findingId === findingId) {
        console.log('📢 New comment added via socket');
        refetchComments();
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync(newComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('¿Eliminar comentario?')) return;
    await deleteCommentMutation.mutateAsync(commentId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-gray-100">Comentarios ({comments.length})</h3>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No hay comentarios aún</p>
          ) : (
            comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-700/50 rounded-lg p-3 group"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center">
                      <User className="w-3 h-3 text-blue-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-100">
                        {comment.user.name || comment.user.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {currentUserId === comment.userId && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Añadir comentario..."
          className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          disabled={isSubmitting}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="px-3 py-2"
          size="sm"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
