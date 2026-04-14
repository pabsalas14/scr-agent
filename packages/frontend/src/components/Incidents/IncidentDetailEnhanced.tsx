/**
 * ============================================================================
 * ENHANCED INCIDENT DETAIL - Collaboration & SLA Tracking
 * ============================================================================
 * Shows full incident details with comments, assignments, and SLA tracking
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, MessageSquare, User, AlertCircle, CheckCircle2,
  Send, Loader, Trash2, Calendar
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  mentions: string[];
}

interface SLAInfo {
  findingId: string;
  severity: string;
  createdAt: string;
  targetDate: string;
  resolvedAt: string | null;
  slaHours: number;
  isOverdue: boolean;
  timeRemainingHours: number;
  actualResolutionTimeHours: number | null;
  metSLA: boolean | null;
  status: string;
}

interface Assignment {
  id: string;
  assignedTo: string;
  assignedUser?: {
    name: string;
    email: string;
  };
}

interface IncidentDetailEnhancedProps {
  findingId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  file: string;
  whySuspicious: string;
  assignment?: Assignment;
  onAssign?: (userId: string) => void;
  onCommentAdded?: () => void;
}

export default function IncidentDetailEnhanced({
  findingId,
  severity,
  file,
  whySuspicious,
  assignment,
  onAssign,
  onCommentAdded,
}: IncidentDetailEnhancedProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [slaInfo, setSLAInfo] = useState<SLAInfo | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingSLA, setIsLoadingSLA] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  // Load comments and SLA info
  useEffect(() => {
    loadComments();
    loadSLAInfo();
  }, [findingId]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await apiService.get(`/findings/${findingId}/comments`);
      if (response.success) {
        setComments(response.data || []);
      }
    } catch (error) {
      console.warn('Failed to load comments');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const loadSLAInfo = async () => {
    setIsLoadingSLA(true);
    try {
      const response = await apiService.get(`/findings/${findingId}/sla`);
      if (response.success) {
        setSLAInfo(response.data);
      }
    } catch (error) {
      console.warn('Failed to load SLA info');
    } finally {
      setIsLoadingSLA(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.warning('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.post(`/findings/${findingId}/comments`, {
        content: newComment,
      });

      if (response.success) {
        toast.success('✅ Comment added');
        setNewComment('');
        loadComments();
        onCommentAdded?.();
      }
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await confirm.confirm({
      title: 'Delete Comment',
      message: 'Are you sure you want to delete this comment?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await apiService.delete(`/findings/${findingId}/comments/${commentId}`);
          toast.success('Comment deleted');
          loadComments();
        } catch (error) {
          toast.error('Failed to delete comment');
        }
      },
    });
  };

  const severityColor = {
    CRITICAL: 'text-[#EF4444] bg-[#EF4444]/10',
    HIGH: 'text-[#F97316] bg-[#F97316]/10',
    MEDIUM: 'text-[#FBBF24] bg-[#FBBF24]/10',
    LOW: 'text-[#22C55E] bg-[#22C55E]/10',
  };

  const formatTime = (ms: number): string => {
    const hours = Math.floor(ms);
    const minutes = Math.floor((ms % 1) * 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* SLA Status */}
      {isLoadingSLA ? (
        <div className="flex items-center justify-center py-6">
          <Loader className="w-4 h-4 animate-spin text-[#F97316]" />
        </div>
      ) : slaInfo ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`rounded-lg border p-6 space-y-4 ${
            slaInfo.isOverdue
              ? 'border-[#EF4444]/50 bg-[#EF4444]/5'
              : slaInfo.metSLA === true
              ? 'border-[#22C55E]/50 bg-[#22C55E]/5'
              : 'border-[#2D2D2D] bg-[#1E1E20]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {slaInfo.isOverdue && !slaInfo.metSLA ? (
                <>
                  <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                  <div>
                    <h3 className="font-semibold text-white">SLA Breached</h3>
                    <p className="text-sm text-[#EF4444]">
                      Target was {formatTime(Math.abs(slaInfo.timeRemainingHours))} ago
                    </p>
                  </div>
                </>
              ) : slaInfo.metSLA ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                  <div>
                    <h3 className="font-semibold text-white">SLA Met</h3>
                    <p className="text-sm text-[#22C55E]">
                      Resolved in {formatTime(slaInfo.actualResolutionTimeHours || 0)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-[#F97316]" />
                  <div>
                    <h3 className="font-semibold text-white">SLA In Progress</h3>
                    <p className="text-sm text-[#F97316]">
                      {formatTime(slaInfo.timeRemainingHours)} remaining
                    </p>
                  </div>
                </>
              )}
            </div>
            <span className={`px-3 py-1 rounded text-xs font-semibold ${severityColor[slaInfo.severity as keyof typeof severityColor]}`}>
              {slaInfo.slaHours}h SLA
            </span>
          </div>

          {/* Timeline */}
          <div className="space-y-2 pt-2 border-t border-[#2D2D2D]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Created</span>
              <span className="text-white">{new Date(slaInfo.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6B7280]">Target</span>
              <span className={slaInfo.isOverdue ? 'text-[#EF4444]' : 'text-white'}>
                {new Date(slaInfo.targetDate).toLocaleString()}
              </span>
            </div>
            {slaInfo.resolvedAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">Resolved</span>
                <span className="text-[#22C55E]">{new Date(slaInfo.resolvedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* Assignment Info */}
      {assignment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-[#2D2D2D] bg-[#1E1E20] p-4"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#F97316]" />
            <span className="text-sm text-[#6B7280]">Assigned to:</span>
            <span className="text-sm font-semibold text-white">
              {assignment.assignedUser?.name || assignment.assignedUser?.email}
            </span>
          </div>
        </motion.div>
      )}

      {/* Comments Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-lg border border-[#2D2D2D] bg-[#1E1E20] p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#F97316]" />
            <h3 className="font-semibold text-white">Discussion</h3>
            <span className="px-2 py-0.5 rounded-full text-xs bg-[#2D2D2D] text-[#A0A0A0]">
              {comments.length}
            </span>
          </div>
        </div>

        {/* Comments List */}
        {isLoadingComments ? (
          <div className="flex items-center justify-center py-6">
            <Loader className="w-4 h-4 animate-spin text-[#F97316]" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-3 rounded-lg bg-[#242424] border border-[#2D2D2D]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-semibold text-white text-sm">{comment.userName}</span>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="p-1 rounded hover:bg-[#1E1E20] text-[#6B7280] hover:text-[#EF4444] transition-colors"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-[#A0A0A0] mb-1">{comment.content}</p>
                  <span className="text-xs text-[#6B7280]">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-sm text-[#6B7280] text-center py-4">No comments yet</p>
        )}

        {/* Add Comment */}
        <div className="space-y-2 pt-4 border-t border-[#2D2D2D]">
          {showCommentInput ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment... (use @name to mention users)"
                className="w-full px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white text-sm placeholder-[#6B7280] resize-none focus:outline-none focus:border-[#F97316]"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddComment}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowCommentInput(false);
                    setNewComment('');
                  }}
                  className="px-3 py-2 rounded-lg border border-[#2D2D2D] text-[#6B7280] hover:text-white hover:border-[#F97316] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowCommentInput(true)}
              className="w-full px-3 py-2 rounded-lg border border-dashed border-[#2D2D2D] text-[#6B7280] hover:text-white hover:border-[#F97316] transition-colors text-sm"
            >
              + Add Comment
            </button>
          )}
        </div>

        {/* Mention Help */}
        <p className="text-xs text-[#6B7280] text-center">
          Use @username to mention team members
        </p>
      </motion.div>
    </motion.div>
  );
}
