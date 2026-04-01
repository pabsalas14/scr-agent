/**
 * ============================================================================
 * HOOK - useSocketEvents
 * ============================================================================
 *
 * Hook para suscribirse a eventos de WebSocket en componentes
 * Simplifica la integración de actualizaciones en tiempo real
 *
 * Soporta eventos de análisis, hallazgos, remediación y comentarios
 */

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// ── Tipos de Eventos ────────────────────────────────────────────────────

interface FindingEventData {
  findingId: string;
  assignedTo?: string;
  newStatus?: string;
  timestamp: Date;
  [key: string]: unknown;
}

interface AnalysisEventData {
  analysisId: string;
  projectId: string;
  newStatus?: string;
  progress?: number;
  findingCount?: number;
  summary?: unknown;
  errorMessage?: string;
  timestamp: Date;
}

interface AnalysisStatusChangedData extends AnalysisEventData {
  newStatus: string;
  progress: number;
}

interface AnalysisFindingsDiscoveredData extends AnalysisEventData {
  findingCount: number;
}

interface AnalysisCompletedData extends AnalysisEventData {
  summary: unknown;
}

interface AnalysisErrorData extends AnalysisEventData {
  errorMessage: string;
}

interface CommentEventData extends FindingEventData {
  commentId: string;
  findingId: string;
  userId?: string;
  userName?: string;
  content?: string;
  mentions?: string[];
}

interface CommentMentionedData {
  commentId: string;
  mentionedUserId: string;
  timestamp: Date;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useSocketEvents(callbacks: {
  // Finding events
  onFindingUpdated?: (data: FindingEventData) => void;
  onFindingAssigned?: (data: FindingEventData) => void;
  onRemediationUpdated?: (data: FindingEventData) => void;
  onRemediationVerified?: (data: FindingEventData) => void;
  onCommentAdded?: (data: CommentEventData) => void;
  onCommentUpdated?: (data: CommentEventData) => void;
  onCommentDeleted?: (data: CommentEventData) => void;
  onCommentMentioned?: (data: CommentMentionedData) => void;

  // Analysis events
  onAnalysisStatusChanged?: (data: AnalysisStatusChangedData) => void;
  onAnalysisFindingsDiscovered?: (data: AnalysisFindingsDiscoveredData) => void;
  onAnalysisCompleted?: (data: AnalysisCompletedData) => void;
  onAnalysisError?: (data: AnalysisErrorData) => void;
}) {
  useEffect(() => {
    let socket: Socket | null = null;

    // Conectar a Socket.io
    try {
      const token = localStorage.getItem('auth_token');
      socket = io(window.location.origin, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      // ── Handlers para Eventos Finding ────────────────────────────────

      socket.on('finding:statusChanged', (data: FindingEventData) => {
        callbacks.onFindingUpdated?.(data);
      });

      socket.on('finding:assigned', (data: FindingEventData) => {
        callbacks.onFindingAssigned?.(data);
      });

      socket.on('remediation:updated', (data: FindingEventData) => {
        callbacks.onRemediationUpdated?.(data);
      });

      socket.on('remediation:verified', (data: FindingEventData) => {
        callbacks.onRemediationVerified?.(data);
      });

      socket.on('comment:added', (data: CommentEventData) => {
        callbacks.onCommentAdded?.(data);
      });

      socket.on('comment:updated', (data: CommentEventData) => {
        callbacks.onCommentUpdated?.(data);
      });

      socket.on('comment:deleted', (data: CommentEventData) => {
        callbacks.onCommentDeleted?.(data);
      });

      socket.on('comment:mentioned', (data: CommentMentionedData) => {
        callbacks.onCommentMentioned?.(data);
      });

      // ── Handlers para Eventos Analysis ───────────────────────────────

      socket.on('analysis:statusChanged', (data: AnalysisStatusChangedData) => {
        callbacks.onAnalysisStatusChanged?.(data);
      });

      socket.on('analysis:findingsDiscovered', (data: AnalysisFindingsDiscoveredData) => {
        callbacks.onAnalysisFindingsDiscovered?.(data);
      });

      socket.on('analysis:completed', (data: AnalysisCompletedData) => {
        callbacks.onAnalysisCompleted?.(data);
      });

      socket.on('analysis:error', (data: AnalysisErrorData) => {
        callbacks.onAnalysisError?.(data);
      });
    } catch (error) {
      console.error('Error initializing Socket.io:', error);
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [callbacks]);
}
