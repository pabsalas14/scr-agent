import { useState, useEffect } from 'react';
import { GitBranch, Key, Eye, EyeOff, Trash2, ExternalLink, Check, X, Cpu } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../hooks/useToast';

interface GitHubConfig {
  token: string;
  username?: string;
  connected: boolean;
}

interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'lmstudio' | 'ollama' | 'llm-gateway' | 'openai-compatible' | 'custom';
  baseUrl?: string;
  model?: string;
  apiKey?: string;
}

interface LLMAllowlistRule {
  origin: string;
  pathPrefix?: string;
}

const LLM_PROVIDERS = ['anthropic', 'openai', 'lmstudio', 'ollama', 'llm-gateway', 'openai-compatible', 'custom'];
const LLM_PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Claude (Anthropic)',
  openai: 'OpenAI',
  lmstudio: 'LM Studio',
  ollama: 'Ollama',
  'llm-gateway': 'LLM Gateway',
  'openai-compatible': 'OpenAI Compatible',
  custom: 'Custom',
};

const getIntegrations = (githubConnected: boolean) => [
  {
    name: 'GitHub',
    icon: GitBranch,
    description: 'Integra repositorios de GitHub para análisis automatizado',
    status: githubConnected ? 'connected' : 'disconnected',
    color: 'text-gray-400',
  },
];

export default function IntegrationsPage() {
  const isAdmin = localStorage.getItem('userRole') === 'ADMIN';
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isTestingToken, setIsTestingToken] = useState(false);

  // LLM Config state
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({ provider: 'anthropic' });
  const [llmProvider, setLLMProvider] = useState('anthropic');
  const [llmBaseUrl, setLLMBaseUrl] = useState('');
  const [llmModel, setLLMModel] = useState('');
  const [llmApiKey, setLLMApiKey] = useState('');
  const [showLLMApiKey, setShowLLMApiKey] = useState(false);
  const [isSavingLLM, setIsSavingLLM] = useState(false);
  const [allowlistRules, setAllowlistRules] = useState<LLMAllowlistRule[]>([]);
  const [isLoadingAllowlist, setIsLoadingAllowlist] = useState(false);
  const [isSavingAllowlist, setIsSavingAllowlist] = useState(false);

  // Load API keys from localStorage
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; provider: string; key: string }>>(() => {
    try {
      const stored = localStorage.getItem('llm_api_keys');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load GitHub config from backend (not localStorage to avoid stale data after DB reset)
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({ token: '', username: undefined, connected: false });

  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);
  const [newApiKeyProvider, setNewApiKeyProvider] = useState('Claude');
  const [newApiKey, setNewApiKey] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const toast = useToast();

  // Load GitHub config from backend on mount
  useEffect(() => {
    const loadGitHubConfig = async () => {
      try {
        const response = await fetch('/api/v1/user-settings/github-token', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setGithubConfig({
              token: '****' + (data.data.token?.slice(-4) || ''),
              username: data.data.username,
              connected: true,
            });
          }
        }
      } catch (error) {
        console.log('No se puede cargar config de GitHub');
      }
    };

    loadGitHubConfig();
  }, []);

  // Load API keys from backend on mount
  useEffect(() => {
    const loadApiKeys = async () => {
      try {
        const response = await fetch('/api/v1/user-settings/llm-keys', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Update with backend keys (which may be empty)
          setApiKeys(data.keys || []);
        }
      } catch (error) {
        console.log('No se pueden cargar claves del backend');
      }
    };

    loadApiKeys();
  }, []);

  // Load LLM config from backend on mount
  useEffect(() => {
    const loadLLMConfig = async () => {
      try {
        const response = await fetch('/api/v1/user-settings/llm-config', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const config = data.data;
          setLLMConfig(config);
          setLLMProvider(config.provider || 'anthropic');
          setLLMBaseUrl(config.baseUrl || '');
          setLLMModel(config.model || '');
          setLLMApiKey(config.apiKey || '');
        }
      } catch (error) {
        console.log('No se puede cargar configuración LLM, usando Anthropic por defecto');
      }
    };

    loadLLMConfig();
  }, []);

  // Admin: load LLM allowlist from backend
  useEffect(() => {
    if (!isAdmin) return;

    const loadAllowlist = async () => {
      setIsLoadingAllowlist(true);
      try {
        const response = await fetch('/api/v1/user-settings/system/llm-allowlist', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAllowlistRules(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        console.log('No se puede cargar allowlist LLM');
      } finally {
        setIsLoadingAllowlist(false);
      }
    };

    loadAllowlist();
  }, [isAdmin]);

  // Persist API keys to localStorage as backup
  useEffect(() => {
    localStorage.setItem('llm_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);


  const saveLLMConfig = async () => {
    // Validación básica
    if (!llmModel.trim()) {
      toast.error('El modelo es requerido');
      return;
    }

    // Validaciones específicas por proveedor
    switch (llmProvider) {
      case 'anthropic':
        // No requiere más campos
        break;

      case 'openai':
        if (!llmApiKey.trim()) {
          toast.error('API Key es requerida para OpenAI');
          return;
        }
        break;

      case 'llm-gateway':
        if (!llmApiKey.trim()) {
          toast.error('API Key es requerida para LLM Gateway');
          return;
        }
        if (!llmBaseUrl.trim()) {
          toast.error('URL del servidor es requerida para LLM Gateway');
          return;
        }
        break;

      case 'lmstudio':
      case 'ollama':
      case 'openai-compatible':
      case 'custom':
        if (!llmBaseUrl.trim()) {
          toast.error(`URL del servidor es requerida para ${LLM_PROVIDER_LABELS[llmProvider]}`);
          return;
        }
        break;
    }

    setIsSavingLLM(true);
    try {
      const configPayload: any = {
        provider: llmProvider,
        model: llmModel,
      };

      // Agregar campos opcionales
      if (llmBaseUrl.trim()) {
        configPayload.baseUrl = llmBaseUrl;
      }
      if (llmApiKey.trim()) {
        configPayload.apiKey = llmApiKey;
      }

      const response = await fetch('/api/v1/user-settings/llm-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify(configPayload),
      });

      if (response.ok) {
        const data = await response.json();
        setLLMConfig({
          provider: data.data.provider,
          baseUrl: data.data.baseUrl,
          model: data.data.model,
        });
        toast.success(`Configuración LLM actualizada: ${llmProvider}/${llmModel}`);
        setShowLLMModal(false);
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      toast.error('Error al guardar configuración LLM');
      console.error(error);
    } finally {
      setIsSavingLLM(false);
    }
  };

  const saveAllowlist = async () => {
    if (!isAdmin) return;
    if (allowlistRules.length === 0) {
      toast.error('Agrega al menos una regla a la allowlist');
      return;
    }

    setIsSavingAllowlist(true);
    try {
      const response = await fetch('/api/v1/user-settings/system/llm-allowlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({ rules: allowlistRules }),
      });

      if (response.ok) {
        toast.success('Allowlist LLM actualizada');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error || 'No se pudo actualizar la allowlist');
      }
    } catch {
      toast.error('Error actualizando allowlist');
    } finally {
      setIsSavingAllowlist(false);
    }
  };

  const testGitHubToken = async () => {
    if (!githubToken.trim()) {
      toast.error('Por favor ingresa un token de GitHub');
      return;
    }

    // Validar formato: debe comenzar con ghp_ o github_pat_
    const isValidFormat = githubToken.startsWith('ghp_') || githubToken.startsWith('github_pat_');

    if (!isValidFormat) {
      toast.error('Formato de token inválido. Debe comenzar con ghp_ o github_pat_');
      return;
    }

    if (githubToken.length < 20) {
      toast.error('Token muy corto. Verifica que sea completo.');
      return;
    }

    setIsTestingToken(true);

    try {
      // Primero, guardar el token en la base de datos
      const saveResponse = await fetch('/api/v1/user-settings/github-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({ token: githubToken }),
      });

      if (!saveResponse.ok) {
        const error = await saveResponse.json();
        toast.error(`Error al guardar token: ${error.error || 'Unknown error'}`);
        setIsTestingToken(false);
        return;
      }

      const saveData = await saveResponse.json();
      const username = saveData.username || 'github-user';

      // Actualizar estado local
      setGithubConfig({
        token: githubToken,
        username: username,
        connected: true,
      });

      toast.success(`✅ GitHub conectado. Token guardado en base de datos.`);
      setShowGitHubModal(false);
      setGithubToken('');
    } catch (error) {
      console.error('Error saving GitHub token:', error);
      toast.error('Error al guardar el token en la base de datos');
    } finally {
      setIsTestingToken(false);
    }
  };

  const disconnectGitHub = async () => {
    try {
      // Remove token from database
      await fetch('/api/v1/user-settings/github-token', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
    }

    // Update local state
    setGithubConfig({
      token: '',
      username: undefined,
      connected: false,
    });
    toast.info('GitHub desconectado');
  };

  const handleConfigure = (integrationName: string) => {
    if (integrationName === 'GitHub') {
      setShowGitHubModal(true);
    }
  };

  const addAPIKey = async () => {
    if (!newApiKey.trim()) {
      toast.error('Por favor ingresa una clave API');
      return;
    }

    try {
      // Guardar en backend
      const response = await fetch('/api/v1/user-settings/llm-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
        body: JSON.stringify({
          provider: newApiKeyProvider,
          key: newApiKey,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newKey = {
          id: result.id || Date.now().toString(),
          provider: newApiKeyProvider,
          key: newApiKey,
        };

        setApiKeys([...apiKeys, newKey]);
        setNewApiKey('');
        setShowNewApiKeyForm(false);
        toast.success(`Clave API de ${newApiKeyProvider} guardada en la base de datos`);
      } else {
        // Fallback: guardar localmente si el backend no responde
        const newKey = {
          id: Date.now().toString(),
          provider: newApiKeyProvider,
          key: newApiKey,
        };
        setApiKeys([...apiKeys, newKey]);
        setNewApiKey('');
        setShowNewApiKeyForm(false);
        toast.success(`Clave API de ${newApiKeyProvider} guardada correctamente`);
      }
    } catch (error) {
      toast.error('Error al guardar la clave API');
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const deleteAPIKey = async (keyId: string) => {
    try {
      // Intentar eliminar del backend
      await fetch(`/api/v1/user-settings/llm-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
    } catch (error) {
      console.log('Error eliminando de BD, eliminando localmente');
    }

    // Eliminar localmente
    setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    toast.info('Clave API eliminada');
  };

  const maskKey = (key: string) => {
    if (key.length <= 11) return key;
    return `${key.substring(0, 7)}${'*'.repeat(key.length - 11)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Integraciones</h1>
        <p className="text-sm text-[#A0A0A0]">
          Conecta con tus herramientas favoritas para automatizar flujos de trabajo
        </p>
      </div>

      {/* Herramientas Externas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Herramientas Externas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {getIntegrations(githubConfig.connected).map((integration) => {
            const Icon = integration.icon;
            return (
              <div
                key={integration.name}
                className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 hover:border-[#4B5563] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`${integration.color}`} size={24} />
                    <div>
                      <h3 className="font-semibold text-white">{integration.name}</h3>
                      <p className="text-xs text-[#A0A0A0]">{integration.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        integration.status === 'connected'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {integration.status === 'connected' ? (
                        <>
                          <Check size={14} /> Conectado
                        </>
                      ) : (
                        <>
                          <X size={14} /> Desconectado
                        </>
                      )}
                    </span>
                    {integration.name === 'GitHub' && githubConfig.username && (
                      <span className="text-xs text-[#6B7280]">@{githubConfig.username}</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={configuring === integration.name}
                      onClick={() => {
                        if (integration.status === 'connected') {
                          handleConfigure(integration.name);
                        } else {
                          setShowGitHubModal(true);
                        }
                      }}
                    >
                      {configuring === integration.name ? 'Cargando...' : (integration.status === 'connected' ? 'Configurar' : 'Conectar')}
                    </Button>
                    {integration.status === 'connected' && integration.name === 'GitHub' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={disconnectGitHub}
                      >
                        <X size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* LLM Provider Card */}
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 hover:border-[#4B5563] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Cpu className="text-orange-400" size={24} />
                <div>
                  <h3 className="font-semibold text-white">LLM Provider</h3>
                  <p className="text-xs text-[#A0A0A0]">Configura Claude, LM Studio u otro proveedor</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 bg-blue-500/20 text-blue-400">
                  <Check size={14} /> {llmProvider === 'anthropic' ? 'Claude' : llmProvider}
                </span>
                {llmModel && <span className="text-xs text-[#6B7280]">{llmModel}</span>}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowLLMModal(true)}
              >
                Configurar
              </Button>
            </div>
          </div>
	        </div>
	      </div>

	      {/* Admin: Allowlist de baseUrl para LLM (mitigación SSRF) */}
	      {isAdmin && (
	        <div className="space-y-3">
	          <div>
	            <h2 className="text-lg font-semibold text-white">Seguridad (Admin)</h2>
	            <p className="text-xs text-[#A0A0A0] mt-1">
	              Allowlist de servidores permitidos para `baseUrl` (LM Studio/Ollama/Custom/Gateway).
	            </p>
	          </div>

	          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-3">
	            {isLoadingAllowlist ? (
	              <div className="text-sm text-[#A0A0A0]">Cargando allowlist...</div>
	            ) : (
	              <div className="space-y-2">
	                {allowlistRules.map((rule, idx) => (
	                  <div key={`${rule.origin}-${idx}`} className="flex gap-2 items-center">
	                    <input
	                      value={rule.origin}
	                      onChange={(e) => {
	                        const next = [...allowlistRules];
	                        next[idx] = { ...next[idx]!, origin: e.target.value };
	                        setAllowlistRules(next);
	                      }}
	                      placeholder="Origin (ej: http://localhost:1234)"
	                      className="flex-1 px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white placeholder-[#4B5563] focus:outline-none focus:border-[#4B5563]"
	                    />
	                    <input
	                      value={rule.pathPrefix || ''}
	                      onChange={(e) => {
	                        const next = [...allowlistRules];
	                        next[idx] = { ...next[idx]!, pathPrefix: e.target.value || undefined };
	                        setAllowlistRules(next);
	                      }}
	                      placeholder="Path (opcional, ej: /v1)"
	                      className="w-40 px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white placeholder-[#4B5563] focus:outline-none focus:border-[#4B5563]"
	                    />
	                    <Button
	                      variant="secondary"
	                      size="sm"
	                      onClick={() => setAllowlistRules(allowlistRules.filter((_, i) => i !== idx))}
	                    >
	                      <X size={14} />
	                    </Button>
	                  </div>
	                ))}
	              </div>
	            )}

	            <div className="flex gap-2 justify-between">
	              <Button
	                variant="secondary"
	                size="sm"
	                onClick={() => setAllowlistRules([...allowlistRules, { origin: '', pathPrefix: '/v1' }])}
	              >
	                Agregar regla
	              </Button>
	              <Button
	                variant="primary"
	                size="sm"
	                disabled={isSavingAllowlist || isLoadingAllowlist}
	                onClick={saveAllowlist}
	              >
	                {isSavingAllowlist ? 'Guardando...' : 'Guardar'}
	              </Button>
	            </div>
	          </div>
	        </div>
	      )}

	      {/* Claves API para LLM - Only show for providers that need API keys */}
	      {(llmProvider === 'anthropic' || llmProvider === 'openai-compatible') && (
	      <div className="space-y-4">
	        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key size={20} />
              Claves API de LLM
            </h2>
            <p className="text-xs text-[#A0A0A0] mt-1">Configura tus claves de API para usar modelos de lenguaje</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewApiKeyForm(true)}
          >
            Agregar Clave
          </Button>
        </div>

        {showNewApiKeyForm && (
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[#A0A0A0]">Proveedor</label>
              <select
                value={newApiKeyProvider}
                onChange={(e) => setNewApiKeyProvider(e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white focus:outline-none focus:border-[#4B5563]"
              >
                {LLM_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#A0A0A0]">Clave API</label>
              <input
                type="password"
                placeholder="Pega tu clave API aquí"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white placeholder-[#4B5563] focus:outline-none focus:border-[#4B5563]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNewApiKeyForm(false);
                  setNewApiKey('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={addAPIKey}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        {apiKeys.length === 0 && !showNewApiKeyForm && (
          <div className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-4 text-center">
            <p className="text-sm text-[#A0A0A0]">No hay claves API configuradas aún</p>
          </div>
        )}

        {apiKeys.length > 0 && (
          <div className="space-y-2">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-[#2D2D2D] p-2 rounded">
                    <Key size={16} className="text-[#A0A0A0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{apiKey.provider}</p>
                    <p className="text-xs text-[#6B7280] font-mono truncate">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    className="text-[#A0A0A0] hover:text-white transition-colors"
                    title={visibleKeys.has(apiKey.id) ? 'Ocultar' : 'Mostrar'}
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => deleteAPIKey(apiKey.id)}
                    className="text-[#A0A0A0] hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* GitHub Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <GitBranch size={24} className="text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Conectar GitHub</h2>
            </div>

            <p className="text-sm text-[#A0A0A0] mb-4">
              Ingresa tu token de GitHub para conectar repositorios.
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F97316] hover:text-[#FF6B6B] ml-1 inline-flex items-center gap-1"
              >
                Crear token <ExternalLink size={12} />
              </a>
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#A0A0A0] block mb-2">Token de GitHub</label>
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#4B5563]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowGitHubModal(false);
                    setGithubToken('');
                  }}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={testGitHubToken}
                  disabled={isTestingToken || !githubToken.trim()}
                  className="flex-1"
                >
                  {isTestingToken ? 'Validando...' : 'Conectar'}
                </Button>
              </div>

              <p className="text-xs text-[#6B7280] text-center">
                Tu token se valida contra la API de GitHub pero no se almacena en el servidor
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LLM Config Modal */}
      {showLLMModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-2 mb-4">
              <Cpu size={24} className="text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Configurar LLM</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-[#A0A0A0] block mb-2">Proveedor</label>
                <select
                  value={llmProvider}
                  onChange={(e) => {
                    setLLMProvider(e.target.value);
                    // Clear optional fields when switching providers
                    setLLMApiKey('');
                    setLLMBaseUrl('');
                  }}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-[#4B5563]"
                >
                  {LLM_PROVIDERS.map((provider) => (
                    <option key={provider} value={provider}>
                      {LLM_PROVIDER_LABELS[provider]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-[#A0A0A0] block mb-2">Modelo</label>
                <input
                  type="text"
                  value={llmModel}
                  onChange={(e) => setLLMModel(e.target.value)}
                  placeholder={llmProvider === 'anthropic' ? 'claude-sonnet-4-6' : 'qwen2.5-coder-7b-instruct'}
                  className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#4B5563]"
                />
              </div>

              {llmProvider !== 'anthropic' && (
                <>
                  <div>
                    <label className="text-sm text-[#A0A0A0] block mb-2">URL del servidor</label>
                    <input
                      type="text"
                      value={llmBaseUrl}
                      onChange={(e) => setLLMBaseUrl(e.target.value)}
                      placeholder="http://localhost:1234 o https://api.example.com"
                      className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#4B5563]"
                    />
                  </div>
                </>
              )}

              {['openai', 'llm-gateway'].includes(llmProvider) && (
                <div>
                  <label className="text-sm text-[#A0A0A0] block mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showLLMApiKey ? 'text' : 'password'}
                      value={llmApiKey}
                      onChange={(e) => setLLMApiKey(e.target.value)}
                      placeholder="sk-... o tu clave API"
                      className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#6B7280] focus:outline-none focus:border-[#4B5563] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLLMApiKey(!showLLMApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white"
                    >
                      {showLLMApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowLLMModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={saveLLMConfig}
                  disabled={isSavingLLM}
                  className="flex-1"
                >
                  {isSavingLLM ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
