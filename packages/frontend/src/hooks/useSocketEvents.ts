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

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  relatedId?: string;
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

  // Notification events
  onNotificationReceived?: (data: NotificationData) => void;
}) {
  useEffect(() => {
    let socket: Socket | null = null;
    let connectionAttempts = 0;
    const MAX_RETRIES = 5;

    // Conectar a Socket.io con manejo robusto de errores y autenticación
    const connectSocket = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');

        if (!token || !user) {
          console.warn('[Socket] No auth credentials found, deferring connection');
          return;
        }

        const userId = JSON.parse(user).id;

        socket = io(window.location.origin, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: MAX_RETRIES,
          withCredentials: true,
          path: '/socket.io',
        });

        socket.on('connect', () => {
          console.info('[Socket] Connected, authenticating...');
          // Authenticate immediately after connection
          socket?.emit('auth:user', { userId, token });
        });

        socket.on('auth:success', () => {
          console.info('[Socket] Authentication successful');
          connectionAttempts = 0; // Reset counter on success
        });

        socket.on('auth:error', (error: any) => {
          console.error('[Socket] Auth error:', error);
        });

        socket.on('connect_error', (error: any) => {
          console.error('[Socket] Connection error:', error);
          connectionAttempts++;
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
          console.debug('[Socket] analysis:statusChanged', data);
          callbacks.onAnalysisStatusChanged?.(data);
        });

        socket.on('analysis:findingsDiscovered', (data: AnalysisFindingsDiscoveredData) => {
          console.debug('[Socket] analysis:findingsDiscovered', data);
          callbacks.onAnalysisFindingsDiscovered?.(data);
        });

        socket.on('analysis:completed', (data: AnalysisCompletedData) => {
          console.debug('[Socket] analysis:completed', data);
          callbacks.onAnalysisCompleted?.(data);
        });

        socket.on('analysis:error', (data: AnalysisErrorData) => {
          console.error('[Socket] analysis:error', data);
          callbacks.onAnalysisError?.(data);
        });

        // ── Handlers para Eventos Notification ──────────────────────────────

        socket.on('notification:received', (data: NotificationData) => {
          callbacks.onNotificationReceived?.(data);
        });
      } catch (error) {
        console.error('[Socket] Error initializing Socket.io:', error);
      }
    };

    // Retry connection if needed
    const retryInterval = setTimeout(() => {
      if (!socket || !socket.connected) {
        console.warn('[Socket] Attempting to reconnect...');
        connectSocket();
      }
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(retryInterval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [callbacks]);
}
