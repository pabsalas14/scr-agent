/**
 * Authentication Service
 * Maneja login, logout, token storage, y usuario actual
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || '/api/v1';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

class AuthService {
  /**
   * Hacer login con email y password
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    // Guardar token y usuario en localStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  }

  /**
   * Hacer logout
   */
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): AuthUser | null {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Verificar si hay usuario autenticado
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  /**
   * Registrar nuevo usuario
   */
  async register(email: string, password: string): Promise<LoginResponse> {
    const { data } = await axios.post<LoginResponse>(`${API_BASE_URL}/auth/register`, {
      email,
      password,
    });

    // Guardar token y usuario en localStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  }

  /**
   * Verificar token
   */
  async verifyToken(token: string): Promise<AuthUser> {
    const { data } = await axios.post<{ user: AuthUser }>(`${API_BASE_URL}/auth/verify`, {
      token,
    });

    return data.user;
  }
}

export const authService = new AuthService();
