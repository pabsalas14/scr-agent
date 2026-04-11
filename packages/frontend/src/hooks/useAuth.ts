/**
 * ============================================================================
 * HOOK DE AUTENTICACIÓN
 * ============================================================================
 *
 * Maneja el estado de autenticación con JWT en localStorage.
 * Clave de almacenamiento: 'auth_token'
 */

import { socketClientService } from '../services/socket.service';

const TOKEN_KEY = 'auth_token';

export function useAuth() {
  function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    // BUG FIX #1: Notify WebSocket of token renewal to prevent silent disconnections
    socketClientService.updateToken(token);
  }

  function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  function getUser(): { id: string; email: string; name?: string; role: string } | null {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
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
  }

  const user = getUser();

  function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;

    // Verificar expiración sin llamar al servidor
    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  return { getToken, setToken, clearToken, isAuthenticated, user, getUser };
}
