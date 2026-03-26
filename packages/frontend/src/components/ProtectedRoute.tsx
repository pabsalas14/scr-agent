/**
 * ============================================================================
 * RUTA PROTEGIDA
 * ============================================================================
 *
 * Verifica autenticación antes de renderizar el contenido.
 * Redirige a login si no hay token válido.
 */

import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onUnauthenticated: () => void;
}

export default function ProtectedRoute({ children, onUnauthenticated }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated()) {
      onUnauthenticated();
    }
  }, [isAuthenticated, onUnauthenticated]);

  if (!isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}
