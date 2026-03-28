/**
 * ============================================================================
 * COMMENT THREAD - Hilo de comentarios para hallazgos
 * ============================================================================
 *
 * Componente para mostrar y gestionar comentarios en tiempo real
 */

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageSquare, User, AtSign } from 'lucide-react';
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
  const [mentions, setMentions] = useState<string[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
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
    mutationFn: (content: string) => commentsService.createComment(findingId, content, mentions),
    onSuccess: () => {
      setNewComment('');
      setMentions([]);
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
    onCommentUpdated: (data) => {
      if (data.findingId === findingId) {
        console.log('✏️ Comment updated via socket');
        refetchComments();
      }
    },
    onCommentDeleted: (data) => {
      if (data.findingId === findingId) {
        console.log('🗑️ Comment deleted via socket');
        refetchComments();
      }
    },
    onCommentMentioned: (data) => {
      if (getCurrentUserId() === data.mentionedUserId) {
        console.log('👤 You were mentioned in a comment');
        toast.info('Fuiste mencionado en un comentario');
      }
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewComment(value);

    // Detect @mention
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionSuggestions(true);
      setMentionQuery('');
    } else if (lastAtIndex !== -1) {
      const queryText = value.substring(lastAtIndex + 1);
      if (queryText.includes(' ')) {
        setShowMentionSuggestions(false);
      } else {
        setShowMentionSuggestions(true);
        setMentionQuery(queryText.toLowerCase());
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const addMention = (email: string) => {
    const mention = `@${email}`;
    if (!mentions.includes(mention)) {
      setMentions([...mentions, mention]);
    }

    // Remove @mention from input
    const lastAtIndex = newComment.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = newComment.substring(0, lastAtIndex);
      setNewComment(beforeAt);
    }
    setShowMentionSuggestions(false);
    setMentionQuery('');
  };

  const removeMention = (mention: string) => {
    setMentions(mentions.filter((m) => m !== mention));
  };

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

                {/* Mentions Display */}
                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.mentions.map((mention) => (
                      <span
                        key={mention}
                        className="inline-block bg-blue-500/10 border border-blue-500/30 rounded text-xs px-2 py-1 text-blue-300"
                      >
                        {mention}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Mentions Display */}
        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mentions.map((mention) => (
              <div
                key={mention}
                className="inline-flex items-center gap-1 bg-blue-500/20 border border-blue-500/50 rounded-full px-3 py-1 text-xs text-blue-300"
              >
                <AtSign className="w-3 h-3" />
                {mention}
                <button
                  type="button"
                  onClick={() => removeMention(mention)}
                  className="ml-1 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input with Autocomplete */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={newComment}
            onChange={handleInputChange}
            placeholder="Escribir comentario... (usa @ para mencionar)"
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            disabled={isSubmitting}
          />

          {/* Mention Suggestions */}
          {showMentionSuggestions && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-700 border border-slate-600 rounded-lg p-2 max-h-40 overflow-y-auto z-10">
              {['user1@example.com', 'user2@example.com', 'analyst@example.com'].map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => addMention(email)}
                  className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-blue-500/20 rounded hover:text-blue-300 transition-colors"
                >
                  <AtSign className="w-3 h-3 inline mr-1" />
                  {email}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!newComment.trim() || isSubmitting}
          className="w-full"
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          Enviar
        </Button>
      </form>
    </div>
  );
}
