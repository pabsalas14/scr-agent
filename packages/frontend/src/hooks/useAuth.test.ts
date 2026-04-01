/**
 * ============================================================================
 * TESTS: useAuth hook
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuth } from './useAuth';

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeJwtToken(payload: Record<string, unknown>, expired = false): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = expired
    ? Math.floor(Date.now() / 1000) - 3600   // 1 hora en el pasado
    : Math.floor(Date.now() / 1000) + 3600;  // 1 hora en el futuro
  const body = btoa(JSON.stringify({ exp, iat: Math.floor(Date.now() / 1000), ...payload }));
  const sig = btoa('fake-signature');
  return `${header}.${body}.${sig}`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getToken()', () => {
    it('retorna null cuando no hay token en localStorage', () => {
      const auth = useAuth();
      expect(auth.getToken()).toBeNull();
    });

    it('retorna el token almacenado', () => {
      const token = makeJwtToken({ id: 'u1', email: 'a@b.com' });
      localStorage.setItem('auth_token', token);

      const auth = useAuth();
      expect(auth.getToken()).toBe(token);
    });
  });

  describe('setToken() y clearToken()', () => {
    it('almacena el token en localStorage', () => {
      const token = makeJwtToken({ id: 'u1', email: 'a@b.com' });
      const auth = useAuth();
      auth.setToken(token);

      expect(localStorage.getItem('auth_token')).toBe(token);
    });

    it('elimina el token con clearToken()', () => {
      const token = makeJwtToken({ id: 'u1', email: 'a@b.com' });
      localStorage.setItem('auth_token', token);
      const auth = useAuth();
      auth.clearToken();

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('getUser()', () => {
    it('retorna null cuando no hay token', () => {
      const auth = useAuth();
      expect(auth.getUser()).toBeNull();
    });

    it('parsea correctamente el payload del JWT', () => {
      const payload = { id: 'user-123', email: 'user@scr.local', name: 'Test User' };
      const token = makeJwtToken(payload);
      localStorage.setItem('auth_token', token);

      const auth = useAuth();
      const user = auth.getUser();

      expect(user).not.toBeNull();
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('user@scr.local');
    });

    it('retorna null para token expirado', () => {
      const token = makeJwtToken({ id: 'u1', email: 'a@b.com' }, true);
      localStorage.setItem('auth_token', token);

      const auth = useAuth();
      expect(auth.getUser()).toBeNull();
    });

    it('retorna null para token malformado', () => {
      localStorage.setItem('auth_token', 'esto.no.es.un.jwt.valido');
      const auth = useAuth();
      expect(auth.getUser()).toBeNull();
    });
  });

  describe('isAuthenticated()', () => {
    it('retorna false sin token', () => {
      const auth = useAuth();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('retorna true con token válido', () => {
      const token = makeJwtToken({ id: 'u1', email: 'a@b.com' });
      localStorage.setItem('auth_token', token);

      const auth = useAuth();
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('retorna false con token expirado', () => {
      const token = makeJwtToken({ id: 'u1', email: 'a@b.com' }, true);
      localStorage.setItem('auth_token', token);

      const auth = useAuth();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('user (propiedad computed)', () => {
    it('refleja el usuario del token activo', () => {
      const token = makeJwtToken({ id: 'u1', email: 'x@y.com', name: 'X' });
      localStorage.setItem('auth_token', token);

      const { user } = useAuth();
      expect(user?.email).toBe('x@y.com');
    });

    it('es null sin token', () => {
      const { user } = useAuth();
      expect(user).toBeNull();
    });
  });
});
