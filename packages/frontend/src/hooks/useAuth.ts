/**
 * ============================================================================
 * HOOK DE AUTENTICACIÓN
 * ============================================================================
 *
 * Maneja el estado de autenticación con JWT en localStorage.
 * Clave de almacenamiento: 'auth_token'
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { socketClientService } from '../services/socket.service';

const TOKEN_KEY = 'auth_token';

export function useAuth() {
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        setAuthToken(e.newValue);
      }
    };
    const handleAuthEvent = () => setAuthToken(localStorage.getItem(TOKEN_KEY));

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth_changed', handleAuthEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth_changed', handleAuthEvent);
    };
  }, []);

  const getToken = useCallback((): string | null => {
    return authToken || localStorage.getItem(TOKEN_KEY);
  }, [authToken]);

  const setToken = useCallback((token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    window.dispatchEvent(new Event('auth_changed'));
    socketClientService.updateToken(token);
  }, []);

  const clearToken = useCallback((): void => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    window.dispatchEvent(new Event('auth_changed'));
  }, []);

  const getUser = useCallback((): { id: string; email: string; name?: string; role: string } | null => {
    const token = authToken || localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1] ?? '';
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (payload.exp && payload.exp * 1000 < Date.now()) return null;
      return {
        id: payload.sub || payload.userId || payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role ?? 'VIEWER',
      };
    } catch {
      return null;
    }
  }, [authToken]);

  const isAuthenticated = useCallback((): boolean => {
    const token = authToken || localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    try {
      const base64Url = token.split('.')[1] ?? '';
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }, [authToken]);

  const user = useMemo(() => getUser(), [getUser]);

  return { getToken, setToken, clearToken, isAuthenticated, user, getUser };
}
