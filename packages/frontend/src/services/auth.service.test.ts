/**
 * ============================================================================
 * TESTS: AuthService
 * ============================================================================
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mock axios ────────────────────────────────────────────────────────────────
vi.mock('axios', () => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  return {
    default: {
      create: () => ({
        post: mockPost,
        get: mockGet,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
    },
    __mockPost: mockPost,
    __mockGet: mockGet,
  };
});

import { authService } from './auth.service';

// ── Helpers ───────────────────────────────────────────────────────────────────
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6InUxIiwiZW1haWwiOiJ0ZXN0QHNjci5sb2NhbCIsImV4cCI6OTk5OTk5OTk5OX0.sig';
const MOCK_USER = { id: 'u1', email: 'test@scr.local', name: 'Test User' };

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getToken()', () => {
    it('retorna null sin token almacenado', () => {
      expect(authService.getToken()).toBeNull();
    });

    it('retorna el token de localStorage', () => {
      localStorage.setItem('auth_token', MOCK_TOKEN);
      expect(authService.getToken()).toBe(MOCK_TOKEN);
    });
  });

  describe('isAuthenticated()', () => {
    it('retorna false sin token', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('retorna true con token almacenado', () => {
      localStorage.setItem('auth_token', MOCK_TOKEN);
      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('getCurrentUser()', () => {
    it('retorna null sin datos de usuario', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });

    it('retorna el usuario almacenado en localStorage', () => {
      localStorage.setItem('user_data', JSON.stringify(MOCK_USER));
      const user = authService.getCurrentUser();
      expect(user?.email).toBe(MOCK_USER.email);
      expect(user?.id).toBe(MOCK_USER.id);
    });

    it('retorna null para JSON corrupto en localStorage', () => {
      localStorage.setItem('user_data', 'not-valid-json{{{');
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('logout()', () => {
    it('elimina el token y datos del usuario', () => {
      localStorage.setItem('auth_token', MOCK_TOKEN);
      localStorage.setItem('user_data', JSON.stringify(MOCK_USER));

      authService.logout();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });
});
