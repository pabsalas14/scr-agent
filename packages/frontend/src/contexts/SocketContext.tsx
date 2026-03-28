/**
 * ============================================================================
 * SOCKET CONTEXT - Manejo de eventos de WebSocket en toda la app
 * ============================================================================
 *
 * Proporciona métodos para suscribirse a eventos de socket de forma centralizada
 * Usado por componentes que necesitan reaccionar a cambios en tiempo real
 */

import { createContext, useContext, useCallback, useState } from 'react';

interface SocketContextType {
  socketConnected: boolean;
  onFindingUpdated: (callback: () => void) => void;
  onFindingAssigned: (callback: () => void) => void;
  onRemediationUpdated: (callback: () => void) => void;
  onRemediationVerified: (callback: () => void) => void;
  onCommentAdded: (callback: () => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket debe ser usado dentro de SocketProvider');
  }
  return context;
}

interface SocketProviderProps {
  children: React.ReactNode;
  socketConnected: boolean;
}

export function SocketProvider({ children, socketConnected }: SocketProviderProps) {
  const [findingUpdateCallbacks, setFindingUpdateCallbacks] = useState<Array<() => void>>([]);
  const [findingAssignedCallbacks, setFindingAssignedCallbacks] = useState<Array<() => void>>([]);
  const [remediationUpdatedCallbacks, setRemediationUpdatedCallbacks] = useState<Array<() => void>>([]);
  const [remediationVerifiedCallbacks, setRemediationVerifiedCallbacks] = useState<Array<() => void>>([]);
  const [commentAddedCallbacks, setCommentAddedCallbacks] = useState<Array<() => void>>([]);

  const onFindingUpdated = useCallback((callback: () => void) => {
    setFindingUpdateCallbacks((prev) => [...prev, callback]);
    return () => {
      setFindingUpdateCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const onFindingAssigned = useCallback((callback: () => void) => {
    setFindingAssignedCallbacks((prev) => [...prev, callback]);
    return () => {
      setFindingAssignedCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const onRemediationUpdated = useCallback((callback: () => void) => {
    setRemediationUpdatedCallbacks((prev) => [...prev, callback]);
    return () => {
      setRemediationUpdatedCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const onRemediationVerified = useCallback((callback: () => void) => {
    setRemediationVerifiedCallbacks((prev) => [...prev, callback]);
    return () => {
      setRemediationVerifiedCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const onCommentAdded = useCallback((callback: () => void) => {
    setCommentAddedCallbacks((prev) => [...prev, callback]);
    return () => {
      setCommentAddedCallbacks((prev) => prev.filter((cb) => cb !== callback));
    };
  }, []);

  const value: SocketContextType = {
    socketConnected,
    onFindingUpdated,
    onFindingAssigned,
    onRemediationUpdated,
    onRemediationVerified,
    onCommentAdded,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
