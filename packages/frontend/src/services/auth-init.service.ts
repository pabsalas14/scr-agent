/**
 * ============================================================================
 * SERVICIO DE INICIALIZACIÓN DE AUTENTICACIÓN
 * ============================================================================
 *
 * Valida que existe un token válido en localStorage
 *
 * SECURITY FIX: Se removió auto-login automático con credenciales hardcodeadas
 * Los usuarios deben autenticarse explícitamente via login form
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
 * Valida que existe un token en localStorage
 * NO intenta auto-login automático por razones de seguridad
 */
export async function initializeAuth(): Promise<boolean> {
  try {
    // Verificar si ya hay token existente
    const existingToken = localStorage.getItem(TOKEN_KEY);
    if (existingToken) {
      console.log('[AUTH] Token existente encontrado, usando...');
      return true;
    }

    // ⚠️ SECURITY FIX: Auto-login removido
    // Las credenciales NO deben estar hardcodeadas en el código
    // Los usuarios deben usar el login form explícitamente
    console.log('[AUTH] No hay token, usuario debe hacer login explícito');
    return false;
  } catch (err) {
    console.error('[AUTH] Error durante inicialización:', err);
    return false;
  }
}
