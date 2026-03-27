import { useState } from 'react';
import { Eye, EyeOff, Trash2, Check, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { setApiKey, clearApiKey, getMaskedApiKey } from '../../services/config.service';
import { settingsService } from '../../services/settings.service';

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

      // Validar token contra GitHub API (backend)
      const response = await settingsService.saveGitHubToken(githubToken);

      if (response.valid) {
        setTokenValid(true);
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
      {/* Tabs con nuevo diseño */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700/50 p-1 mb-6 shadow-lg">
        <div className="flex gap-2">
          {[
            { id: 'api', label: '🔑 API Key', color: '#0EA5E9' },
            { id: 'github', label: '🐙 GitHub', color: '#EC4899' },
            { id: 'preferences', label: '⚙️ Preferencias', color: '#8B5CF6' },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-1 ${
                activeTab === tab.id
                  ? 'text-white border shadow-lg'
                  : 'text-gray-400 border border-transparent hover:text-gray-300'
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

      {/* Tab Content */}
      <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
        {/* API KEY TAB */}
        {activeTab === 'api' && (
          <>
            {/* Status Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 border ${
                maskedKey
                  ? 'bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border-emerald-500/30'
                  : 'bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {maskedKey ? (
                  <Check className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${maskedKey ? 'text-emerald-300' : 'text-gray-300'}`}>
                    {maskedKey ? '✓ API Key Configurado' : 'Sin API Key configurado'}
                  </p>
                  {maskedKey && (
                    <p className="text-xs text-gray-400 mt-2 font-mono bg-gray-900/50 px-3 py-1 rounded inline-block">
                      {maskedKey}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                🔐 Nuevo API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-... (dejar vacío para no cambiar)"
                  value={apiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-600/50 rounded-lg bg-gray-800/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💾 Se almacena de forma segura en tu navegador
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleSaveApiKey}
                disabled={loading || !apiKey.trim()}
                isLoading={loading}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Guardar API Key
              </Button>
              {maskedKey && (
                <Button
                  variant="secondary"
                  onClick={handleClearApiKey}
                  className="flex-1"
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
            {/* Status Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-4 border ${
                tokenValid
                  ? 'bg-gradient-to-r from-pink-900/20 to-pink-800/10 border-pink-500/30'
                  : 'bg-gradient-to-r from-gray-800/50 to-gray-700/30 border-gray-600/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {tokenValid ? (
                  <Check className="w-6 h-6 text-pink-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold ${tokenValid ? 'text-pink-300' : 'text-gray-300'}`}>
                    {tokenValid ? '✓ GitHub Token Válido' : 'Sin GitHub Token configurado'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    📦 Acceso a repositorios privados y contribuyentes
                  </p>
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

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/10 border border-purple-500/30 rounded-lg p-6 text-center">
              <p className="text-3xl mb-3">🚀</p>
              <p className="text-gray-300 font-semibold mb-1">Próximamente</p>
              <p className="text-gray-400 text-sm">
                Tema, idioma, notificaciones y más opciones de personalización
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Modal>
  );
}
