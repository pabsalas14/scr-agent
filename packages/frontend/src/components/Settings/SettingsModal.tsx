import { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, Check, AlertCircle, Copy, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { setApiKey, clearApiKey, getMaskedApiKey } from '../../services/config.service';
import { settingsService } from '../../services/settings.service';
import NotificationPreferences from './NotificationPreferences';

type Tab = 'api' | 'github' | 'notifications';

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
  const [lastValidatedAt, setLastValidatedAt] = useState<number | null>(null);
  const toast = useToast();

  // Load validation timestamp from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('github_token_validated_at');
    if (saved) {
      setLastValidatedAt(parseInt(saved));
    }
  }, []);

  const maskedKey = getMaskedApiKey();

  const getValidationTimeText = () => {
    if (!lastValidatedAt) return null;
    const now = Date.now();
    const diffMs = now - lastValidatedAt;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  };

  const isTokenStale = lastValidatedAt && Date.now() - lastValidatedAt > 30 * 86400000; // 30 days

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

      // Validar token contra GitHub API (backend)
      const response = await settingsService.saveGitHubToken(githubToken);

      if (response.valid) {
        setTokenValid(true);
        const now = Date.now();
        setLastValidatedAt(now);
        localStorage.setItem('github_token_validated_at', now.toString());
        toast.success('Token válido y guardado en el servidor');
        setGithubToken('');
      } else {
        setTokenValid(false);
        setError('Token inválido o expirado');
        toast.error('Token inválido');
      }
    } catch (err) {
      setTokenValid(false);
      const message = err instanceof Error ? err.message : 'Error validando token';
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

  const handleClearGithubToken = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar el GitHub token?')) {
      try {
        setLoading(true);
        await settingsService.deleteGitHubToken();
        setGithubToken('');
        setTokenValid(null);
        setLastValidatedAt(null);
        localStorage.removeItem('github_token_validated_at');
        toast.warning('GitHub token eliminado');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error eliminando token';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⚙️ Configuración" size="lg">
      {/* Tabs - Responsive */}
      <div className="bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-md rounded-lg border border-slate-700/50 p-1 mb-4 sm:mb-6 shadow-lg overflow-x-auto">
        <div className="flex gap-1 min-w-min sm:min-w-full">
          {[
            { id: 'api', label: '🔑 API Key', color: 'rgb(6, 182, 212)' },      // cyan-500
            { id: 'github', label: '🐙 GitHub', color: 'rgb(168, 85, 247)' },   // purple-500
            { id: 'notifications', label: '🔔 Notificaciones', color: 'rgb(34, 197, 94)' }, // green-500
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-1 sm:flex-none border ${
                activeTab === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
              style={{
                borderColor: activeTab === tab.id ? tab.color : 'transparent',
                backgroundColor: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                color: activeTab === tab.id ? tab.color : undefined,
              }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content - Responsive */}
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 sm:space-y-5">
        {/* API KEY TAB */}
        {activeTab === 'api' && (
          <>
            {/* Status Box - Responsive */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-3 sm:p-4 border transition-all ${
                maskedKey
                  ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border-emerald-500/30'
                  : 'bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/50'
              }`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                {maskedKey ? (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-xs sm:text-base ${maskedKey ? 'text-emerald-300' : 'text-gray-300'}`}>
                    {maskedKey ? '✓ API Key Configurado' : 'Sin API Key configurado'}
                  </p>
                  {maskedKey && (
                    <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-900/50 px-2 sm:px-3 py-0.5 sm:py-1 rounded inline-block break-all">
                      {maskedKey}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Input - Responsive */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                🔐 Nuevo API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-... (dejar vacío para no cambiar)"
                  value={apiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-600/50 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  aria-label="Toggle visibility"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 sm:mt-2">
                💾 Se almacena de forma segura en tu navegador
              </p>
            </div>

            {/* Buttons - Responsive */}
            <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
              <Button
                variant="primary"
                onClick={handleSaveApiKey}
                disabled={loading || !apiKey.trim()}
                isLoading={loading}
                className="flex-1 flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base px-2 sm:px-4 py-1.5 sm:py-2"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="hidden xs:inline">Guardar API Key</span>
                <span className="xs:hidden">Guardar</span>
              </Button>
              {maskedKey && (
                <Button
                  variant="secondary"
                  onClick={handleClearApiKey}
                  className="px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* GITHUB TAB */}
        {activeTab === 'github' && (
          <>
            {/* Status Box with Validation Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 border ${
                isTokenStale
                  ? 'bg-gradient-to-r from-yellow-900/20 to-yellow-800/10 border-yellow-500/30'
                  : tokenValid
                  ? 'bg-gradient-to-r from-pink-900/20 to-pink-800/10 border-pink-500/30'
                  : 'bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {isTokenStale ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                ) : tokenValid ? (
                  <Check className="w-6 h-6 text-pink-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    isTokenStale
                      ? 'text-yellow-300'
                      : tokenValid ? 'text-pink-300' : 'text-gray-300'
                  }`}>
                    {isTokenStale
                      ? '⚠️ Token no validado recientemente'
                      : tokenValid ? '✓ GitHub Token Válido' : 'Sin GitHub Token configurado'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    📦 Acceso a repositorios privados y contribuyentes
                  </p>
                  {lastValidatedAt && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Validado {getValidationTimeText()}
                    </p>
                  )}
                  {isTokenStale && (
                    <p className="text-xs text-yellow-300 mt-2">
                      💡 Se recomienda revalidar el token para asegurar que sigue siendo válido
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                🐙 GitHub Personal Access Token
              </label>
              <div className="relative">
                <input
                  type={showGithubToken ? 'text' : 'password'}
                  placeholder="ghp_... (dejar vacío para no cambiar)"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600/50 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowGithubToken(!showGithubToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Scopes: <code className="bg-gray-900/50 px-2 py-0.5 rounded text-cyan-400">repo, read:org</code>
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-red-900/20 to-red-800/10 border border-red-500/30 rounded-lg p-3"
              >
                <p className="text-sm text-red-300 flex items-center gap-2">
                  <span>⚠️</span>
                  {error}
                </p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleValidateGithubToken}
                disabled={validatingToken || !githubToken.trim()}
                isLoading={validatingToken}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Validar Token
              </Button>
              {tokenValid && (
                <Button
                  variant="secondary"
                  onClick={handleClearGithubToken}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <NotificationPreferences />
          </motion.div>
        )}
      </motion.div>
    </Modal>
  );
}
