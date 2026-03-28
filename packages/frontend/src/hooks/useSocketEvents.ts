/**
 * ============================================================================
 * HOOK - useSocketEvents
 * ============================================================================
 *
 * Hook para suscribirse a eventos de WebSocket en componentes
 * Simplifica la integración de actualizaciones en tiempo real
 */

import { useEffect } from 'react';

interface SocketEventData {
  findingId: string;
  timestamp: Date;
  [key: string]: unknown;
}

export function useSocketEvents(callbacks: {
  onFindingUpdated?: (data: SocketEventData) => void;
  onFindingAssigned?: (data: SocketEventData) => void;
  onRemediationUpdated?: (data: SocketEventData) => void;
  onRemediationVerified?: (data: SocketEventData) => void;
  onCommentAdded?: (data: SocketEventData) => void;
}) {
  useEffect(() => {
    // Listener para cambios de estado
    const handleFindingUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SocketEventData>;
      callbacks.onFindingUpdated?.(customEvent.detail);
    };

    // Listener para asignaciones
    const handleFindingAssigned = (event: Event) => {
      const customEvent = event as CustomEvent<SocketEventData>;
      callbacks.onFindingAssigned?.(customEvent.detail);
    };

    // Listener para actualizaciones de remediación
    const handleRemediationUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<SocketEventData>;
      callbacks.onRemediationUpdated?.(customEvent.detail);
    };

    // Listener para verificación de remediación
    const handleRemediationVerified = (event: Event) => {
      const customEvent = event as CustomEvent<SocketEventData>;
      callbacks.onRemediationVerified?.(customEvent.detail);
    };

    // Listener para comentarios
    const handleCommentAdded = (event: Event) => {
      const customEvent = event as CustomEvent<SocketEventData>;
      callbacks.onCommentAdded?.(customEvent.detail);
    };

    // Registrar listeners
    if (callbacks.onFindingUpdated) {
      window.addEventListener('finding-updated', handleFindingUpdated);
    }
    if (callbacks.onFindingAssigned) {
      window.addEventListener('finding-assigned', handleFindingAssigned);
    }
    if (callbacks.onRemediationUpdated) {
      window.addEventListener('remediation-updated', handleRemediationUpdated);
    }
    if (callbacks.onRemediationVerified) {
      window.addEventListener('remediation-verified', handleRemediationVerified);
    }
    if (callbacks.onCommentAdded) {
      window.addEventListener('comment-added', handleCommentAdded);
    }

    // Cleanup
    return () => {
      if (callbacks.onFindingUpdated) {
        window.removeEventListener('finding-updated', handleFindingUpdated);
      }
      if (callbacks.onFindingAssigned) {
        window.removeEventListener('finding-assigned', handleFindingAssigned);
      }
      if (callbacks.onRemediationUpdated) {
        window.removeEventListener('remediation-updated', handleRemediationUpdated);
      }
      if (callbacks.onRemediationVerified) {
        window.removeEventListener('remediation-verified', handleRemediationVerified);
      }
      if (callbacks.onCommentAdded) {
        window.removeEventListener('comment-added', handleCommentAdded);
      }
    };
  }, [callbacks]);
}
