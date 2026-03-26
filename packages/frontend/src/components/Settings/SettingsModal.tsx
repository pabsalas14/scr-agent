import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Check, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../hooks/useToast';
import { getApiKey, setApiKey, clearApiKey, getMaskedApiKey } from '../../services/config.service';

type Tab = 'api' | 'github' | 'preferences';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('api');
  const [apiKey, setLocalApiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const toast = useToast();

  const maskedKey = getMaskedApiKey();

  const handleSaveApiKey = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!apiKey.trim()) {
        setError('El API key no puede estar vacío');
        return;
      }

      setApiKey(apiKey);
      toast.success('API key guardado correctamente');
      setLocalApiKey('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar API key';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateGithubToken = async () => {
    if (!githubToken.trim()) {
      setError('El token no puede estar vacío');
      return;
    }

    try {
      setError(null);
      setValidatingToken(true);

      // Validar token contra GitHub API
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${githubToken}` },
      });

      if (response.ok) {
        setTokenValid(true);
        toast.success('Token válido y guardado');
        localStorage.setItem('github_token', githubToken);
        setGithubToken('');
        // También guardar en backend si es necesario
      } else {
        setTokenValid(false);
        setError('Token inválido o expirado');
        toast.error('Token inválido');
      }
    } catch (err) {
      setTokenValid(false);
      const message = 'Error validando token';
      setError(message);
      toast.error(message);
    } finally {
      setValidatingToken(false);
    }
  };

  const handleClearApiKey = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar el API key?')) {
      clearApiKey();
      setLocalApiKey('');
      toast.warning('API key eliminado');
    }
  };

  const handleClearGithubToken = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar el GitHub token?')) {
      localStorage.removeItem('github_token');
      setGithubToken('');
      setTokenValid(null);
      toast.warning('GitHub token eliminado');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configuración" size="lg">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'api', label: 'API Key', icon: '🔑' },
          { id: 'github', label: 'GitHub', icon: '🐙' },
          { id: 'preferences', label: 'Preferencias', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-5">
        {/* API KEY TAB */}
        {activeTab === 'api' && (
          <>
            {/* Status Box */}
            <div className={`border rounded-md p-4 ${
              maskedKey
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-start gap-2">
                {maskedKey ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {maskedKey ? 'API Key guardado' : 'Sin API Key configurado'}
                  </p>
                  {maskedKey && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {maskedKey}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Nuevo API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Ingresa tu API key"
                  value={apiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Se almacena de forma segura localmente
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleSaveApiKey}
                disabled={loading || !apiKey.trim()}
                isLoading={loading}
                className="flex-1"
              >
                Guardar API Key
              </Button>
              {maskedKey && (
                <Button
                  variant="danger"
                  onClick={handleClearApiKey}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </Button>
              )}
            </div>
          </>
        )}

        {/* GITHUB TAB */}
        {activeTab === 'github' && (
          <>
            {/* Status Box */}
            <div className={`border rounded-md p-4 ${
              tokenValid
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-start gap-2">
                {tokenValid ? (
                  <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {tokenValid ? 'GitHub Token válido' : 'Sin GitHub Token configurado'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Requerido para acceder a repositorios privados
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                GitHub Personal Access Token
              </label>
              <div className="relative">
                <input
                  type={showGithubToken ? 'text' : 'password'}
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGithubToken(!showGithubToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Scopes requeridos: repo, read:org
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleValidateGithubToken}
                disabled={validatingToken || !githubToken.trim()}
                isLoading={validatingToken}
                className="flex-1"
              >
                Validar Token
              </Button>
              {tokenValid && (
                <Button
                  variant="danger"
                  onClick={handleClearGithubToken}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </Button>
              )}
            </div>
          </>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p>Próximamente: Tema, idioma, notificaciones</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
