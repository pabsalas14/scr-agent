/**
 * ============================================================================
 * SERVICIO DE INICIALIZACIÓN DE AUTENTICACIÓN
 * ============================================================================
 *
 * En modo desarrollo, intenta hacer login automático si no hay token
 * Esto permite testing sin tener que hacer login manualmente
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';
const TOKEN_KEY = 'auth_token';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    role: string;
  };
}

/**
 * Intenta hacer login automático con usuario seededado en desarrollo
 */
export async function initializeAuth(): Promise<boolean> {
  try {
    // Si ya hay token, no hacer nada
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      console.log('[AUTH] Token existente encontrado, usando...');
      return true;
    }

    // En desarrollo, intentar login automático
    if (import.meta.env.DEV) {
      console.log('[AUTH] Modo desarrollo detectado, intentando auto-login...');

      // Credenciales de usuario seededado (del seed-fase1.ts)
      const credentials = {
        email: 'admin@scr.com',
        password: 'admin123',
      };

      try {
        const response = await axios.post<LoginResponse>(
          `${API_BASE_URL}/auth/login`,
          credentials,
          {
            timeout: 5000,
            withCredentials: true, // BUG FIX #12: Include cookies in request
          }
        );

        if (response.data.token) {
          // BUG FIX #12: With HttpOnly cookies, we still save token to localStorage as fallback
          // The HttpOnly cookie is handled automatically by the browser
          localStorage.setItem(TOKEN_KEY, response.data.token);
          localStorage.setItem('userEmail', response.data.user.email);
          localStorage.setItem('userName', response.data.user.name || response.data.user.email);
          localStorage.setItem('userRole', response.data.user.role || 'VIEWER');

          console.log('[AUTH] Auto-login exitoso como:', response.data.user.email);
          console.log('[AUTH] Token almacenado en localStorage (fallback) e HttpOnly cookie (seguro)');

          // Disparar evento para que otros componentes se actualicen
          window.dispatchEvent(new Event('auth_changed'));

          return true;
        }
      } catch (loginError) {
        console.warn('[AUTH] Auto-login falló:', loginError);
        console.log('[AUTH] Intentando con usuario alternativo...');

        // Intentar con usuario alternativo (del seed-fase1.ts)
        const altCredentials = {
          email: 'analyst@scr.com',
          password: 'analyst123',
        };

        try {
          const altResponse = await axios.post<LoginResponse>(
            `${API_BASE_URL}/auth/login`,
            altCredentials,
            {
              timeout: 5000,
              withCredentials: true, // BUG FIX #12: Include cookies in request
            }
          );

          if (altResponse.data.token) {
            localStorage.setItem(TOKEN_KEY, altResponse.data.token);
            localStorage.setItem('userEmail', altResponse.data.user.email);
            localStorage.setItem('userName', altResponse.data.user.name || altResponse.data.user.email);
            localStorage.setItem('userRole', altResponse.data.user.role || 'VIEWER');

            console.log('[AUTH] Auto-login exitoso como:', altResponse.data.user.email);
            window.dispatchEvent(new Event('auth_changed'));

            return true;
          }
        } catch (altLoginError) {
          console.warn('[AUTH] Ambos intentos de login fallaron:', altLoginError);
          return false;
        }
      }
    }

    return false;
  } catch (err) {
    console.error('[AUTH] Error durante inicialización:', err);
    return false;
  }
}
