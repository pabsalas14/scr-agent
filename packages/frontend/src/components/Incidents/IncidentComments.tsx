import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface IncidentComment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  avatar?: string;
}

interface IncidentCommentsProps {
  comments: IncidentComment[];
  currentUser?: string;
  onAddComment?: (content: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  isLoading?: boolean;
}

export default function IncidentComments({
  comments,
  currentUser = 'Yo',
  onAddComment,
  onDeleteComment,
  isLoading,
}: IncidentCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.warning('El comentario no puede estar vacío');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddComment?.(newComment);
      setNewComment('');
      toast.success('Comentario agregado');
    } catch (error) {
      toast.error('Error al agregar comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await onDeleteComment?.(commentId);
      toast.success('Comentario eliminado');
    } catch (error) {
      toast.error('Error al eliminar comentario');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddComment();
    }
  };

  return (
    <div className="space-y-4">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="p-6 text-center rounded-lg border border-dashed border-[#2D2D2D] bg-[#1E1E20]/50">
            <MessageSquare className="w-8 h-8 text-[#6B7280] mx-auto mb-2 opacity-50" />
            <p className="text-sm text-[#6B7280]">Sin comentarios aún</p>
          </div>
        ) : (
          <AnimatePresence>
            {comments.map((comment, index) => {
              const isOwn = comment.author === currentUser;
              const timeAgo = formatDistanceToNow(comment.createdAt, {
                addSuffix: true,
                locale: es,
              });

              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    isOwn ? 'bg-[#F97316]/5 border-[#F97316]/20' : 'bg-[#242424] border-[#2D2D2D]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-sm font-semibold text-white">
                          {comment.author}
                          {isOwn && <span className="ml-2 text-xs text-[#F97316]">(Tú)</span>}
                        </p>
                        <p className="text-xs text-[#6B7280] ml-auto flex-shrink-0">{timeAgo}</p>
                      </div>
                      <p className="text-sm text-[#A0A0A0] leading-relaxed">{comment.content}</p>
                    </div>

                    {isOwn && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 rounded-lg hover:bg-[#EF4444]/20 text-[#6B7280] hover:text-[#EF4444] transition-colors flex-shrink-0"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* New Comment Input */}
      <div className="space-y-2 pt-4 border-t border-[#2D2D2D]">
        <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
          Agregar Comentario
        </label>
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
            className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm resize-none h-20"
            disabled={isSubmitting || isLoading}
          />
          <button
            onClick={handleAddComment}
            disabled={isSubmitting || isLoading || !newComment.trim()}
            className="px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium text-sm flex-shrink-0"
            title="Enviar comentario (Ctrl+Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-[#6B7280]">Presiona Ctrl+Enter para enviar rápidamente</p>
      </div>
    </div>
  );
}
