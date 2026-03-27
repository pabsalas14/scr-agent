/**
 * Módulo de Configuración
 * Page completa con todas las configuraciones del usuario
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, X, Eye, EyeOff, Save } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function SettingsModule() {
  const queryClient = useQueryClient();
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Obtener configuración del usuario
  const { data: userSettings } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiService.obtenerConfiguracionUsuario(),
    select: (data: any) => data?.data,
  });

  // Guardar token GitHub
  const guardarToken = useMutation({
    mutationFn: (token: string) => apiService.guardarTokenGithub(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setValidationStatus('valid');
      setTimeout(() => setValidationStatus('idle'), 3000);
    },
    onError: () => {
      setValidationStatus('invalid');
      setTimeout(() => setValidationStatus('idle'), 3000);
    },
  });

  const handleValidarToken = async () => {
    if (!githubToken.trim()) {
      setValidationStatus('invalid');
      return;
    }
    setValidationStatus('validating');
    guardarToken.mutate(githubToken);
  };

  const handleTemaChange = (nuevoTema: 'light' | 'dark') => {
    setTheme(nuevoTema);
    const html = document.documentElement;
    if (nuevoTema === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Gestiona tu perfil, integraciones y preferencias
        </p>
      </div>

      {/* GitHub Token */}
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🔐 Token de GitHub</span>
              {userSettings?.githubToken && validationStatus === 'valid' && (
                <span className="ml-auto">
                  <Check className="w-5 h-5 text-green-600" />
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Conecta tu cuenta de GitHub para acceder a tus repositorios
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token Personal de Acceso
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="github_pat_..."
                value={githubToken || userSettings?.githubToken || ''}
                onChange={(e) => setGithubToken(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 ${
                  validationStatus === 'valid'
                    ? 'border-green-500 focus:ring-green-500'
                    : validationStatus === 'invalid'
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
              />
              <button
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Necesita permisos: repo, admin:org_hook
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleValidarToken}
            disabled={!githubToken.trim() || guardarToken.isPending}
            isLoading={guardarToken.isPending}
            className="w-full"
          >
            <Save className="w-4 h-4" />
            {validationStatus === 'validating'
              ? 'Validando...'
              : validationStatus === 'valid'
                ? '✓ Guardado'
                : 'Guardar Token'}
          </Button>

          {validationStatus === 'invalid' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2"
            >
              <X className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-700 dark:text-red-400">
                Token inválido. Verifica que sea correcto y tenga los permisos necesarios
              </span>
            </motion.div>
          )}
        </div>
      </Card>

      {/* Tema */}
      <Card>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🎨 Tema</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Elige tu tema preferido
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleTemaChange('light')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">☀️</div>
              <p className="font-medium text-gray-900 dark:text-white">Claro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fondo blanco</p>
            </button>

            <button
              onClick={() => handleTemaChange('dark')}
              className={`p-4 rounded-lg border-2 transition-all ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">🌙</div>
              <p className="font-medium text-gray-900 dark:text-white">Oscuro</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fondo oscuro</p>
            </button>
          </div>
        </div>
      </Card>

      {/* Información de la Cuenta */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">👤 Cuenta</h2>

          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              Email
            </label>
            <p className="text-gray-900 dark:text-white font-medium">admin@coda.local</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Miembro desde</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Plan</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Profesional</p>
            </div>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🔑 API Keys</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generan claves de API para acceso programático (próximamente)
          </p>
          <Button variant="secondary" disabled className="w-full">
            Crear Clave de API
          </Button>
        </div>
      </Card>

      {/* Peligro */}
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-900 dark:text-red-200">⚠️ Zona de Peligro</h2>
          <Button variant="danger" disabled className="w-full">
            Eliminar Cuenta
          </Button>
        </div>
      </Card>
    </div>
  );
}
