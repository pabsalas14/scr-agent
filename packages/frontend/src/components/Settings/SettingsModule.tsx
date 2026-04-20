import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Terminal,
  Loader2,
  Brain,
  Zap,
  Bell,
  GitBranch,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import NotificationPreferences from './NotificationPreferences';

type SettingsTab = 'integraciones' | 'preferencias';

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Settings; description: string }> = [
  { id: 'integraciones', label: 'Integraciones', icon: GitBranch, description: 'APIs y webhooks' },
  { id: 'preferencias', label: 'Preferencias', icon: Settings, description: 'Idioma, tema, notificaciones' },
];

const ANTHROPIC_MODELS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (Recomendado)' },
  { value: 'claude-opus-4-7', label: 'Claude Opus 4.7 (Más potente)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Rápido)' },
];

export default function SettingsModule() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<SettingsTab>('integraciones');
  const [githubToken, setGithubToken] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-6');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [llmProvider, setLlmProvider] = useState<'anthropic' | 'lmstudio'>('anthropic');
  const [llmBaseUrl, setLlmBaseUrl] = useState('http://localhost:1234/v1');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [language, setLanguage] = useState('es');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [iaTestLoading, setIaTestLoading] = useState(false);
  const [iaTestStatus, setIaTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Validate tokens
  const validateGithubToken = (token: string): boolean => {
    return token.length >= 10;
  };

  const validateClaudeToken = (token: string): boolean => {
    return token.length >= 10;
  };

  const validateWebhookUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  // Load user settings
  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiService.obtenerConfiguracionUsuario(),
    select: (data: any) => data?.data,
  });

  const isLoading = settingsLoading;

  useEffect(() => {
    if (userSettings) {
      if (userSettings.githubToken) setGithubToken(userSettings.githubToken);
      if (userSettings.claudeApiKey) setClaudeApiKey(userSettings.claudeApiKey);
      if (userSettings.selectedModel) setSelectedModel(userSettings.selectedModel);
      if (userSettings.temperature) setTemperature(userSettings.temperature);
      if (userSettings.maxTokens) setMaxTokens(userSettings.maxTokens);
      if (userSettings.webhookUrl) setWebhookUrl(userSettings.webhookUrl);
      if (userSettings.llmProvider) setLlmProvider(userSettings.llmProvider);
      if (userSettings.llmBaseUrl) setLlmBaseUrl(userSettings.llmBaseUrl);
    }
  }, [userSettings]);

  // Mutations
  const [githubUser, setGithubUser] = useState<{ login: string; repositories: number } | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  // Verify GitHub token and fetch user info
  const verifyGithubToken = async (token: string) => {
    if (!token) return;
    setGithubLoading(true);
    try {
      // Call GitHub API to verify token and get user info
      const response = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        // Fetch repository count
        const reposResponse = await fetch('https://api.github.com/user/repos?per_page=1', {
          headers: { Authorization: `token ${token}` },
        });
        const repoLink = reposResponse.headers.get('link');
        const repoCount = repoLink ? parseInt(repoLink.match(/&page=(\d+)>; rel="last"/)?.[1] || '0') : 0;

        setGithubUser({ login: userData.login, repositories: repoCount });
        return true;
      } else {
        setGithubUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error verifying GitHub token:', error);
      setGithubUser(null);
      return false;
    } finally {
      setGithubLoading(false);
    }
  };

  const guardarTokenMutation = useMutation({
    mutationFn: async (token: string) => {
      if (!validateGithubToken(token)) {
        throw new Error('Token de GitHub debe tener un formato válido');
      }
      // Verify token first
      const isValid = await verifyGithubToken(token);
      if (!isValid) {
        throw new Error('Token de GitHub no válido o expirado');
      }
      return apiService.guardarTokenGithub(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setStatus({ type: 'success', message: githubUser ? `✓ Conectado como @${githubUser.login} (${githubUser.repositories} repositorios)` : 'Token de GitHub actualizado.' });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: (error: any) => {
      const message = error?.message || 'Error al procesar el token.';
      setStatus({ type: 'error', message });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const testIAConnection = async (provider: 'anthropic' | 'lmstudio', apiKey?: string) => {
    setIaTestLoading(true);
    try {
      if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: { 'X-API-Key': apiKey || claudeApiKey },
        });
        if (response.ok) {
          setIaTestStatus({ type: 'success', message: '✓ Conectado a Anthropic Claude' });
        } else {
          setIaTestStatus({ type: 'error', message: 'API Key no válida o expirada' });
        }
      } else if (provider === 'lmstudio') {
        const response = await fetch(`${llmBaseUrl}/models`);
        if (response.ok) {
          setIaTestStatus({ type: 'success', message: '✓ Conectado a LM Studio' });
        } else {
          setIaTestStatus({ type: 'error', message: 'LM Studio no accesible en ' + llmBaseUrl });
        }
      }
    } catch (error) {
      setIaTestStatus({ type: 'error', message: 'Error al conectar: ' + (error as any).message });
    } finally {
      setIaTestLoading(false);
      setTimeout(() => setIaTestStatus(null), 5000);
    }
  };

  const guardarConfiguracionIAMutation = useMutation({
    mutationFn: (config: any) => {
      if (config.claudeApiKey && !validateClaudeToken(config.claudeApiKey)) {
        throw new Error('API Key debe tener un formato válido');
      }
      if (config.webhookUrl && !validateWebhookUrl(config.webhookUrl)) {
        throw new Error('URL del webhook debe ser una URL válida');
      }
      return apiService.guardarConfiguracionIA(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      const providerText = llmProvider === 'anthropic' ? 'Claude Sonnet 4.6' : 'LM Studio';
      setStatus({ type: 'success', message: `✓ Configuración Guardada | Usando: ${providerText}` });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: () => {
      setStatus({ type: 'error', message: 'Error al guardar la configuración de IA.' });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
        <p className="text-sm text-[#6B7280]">Cargando configuración...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'integraciones':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* AI Configuration */}
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[#2D2D2D]">
                <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-[#C4B5FD]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Configuración de IA</h3>
                  <p className="text-sm text-[#6B7280] mt-1">Modelos y parámetros de generación</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Provider toggle */}
                <div>
                  <label className="text-sm font-medium text-[#E5E7EB] block mb-3">Proveedor de IA</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setLlmProvider('anthropic');
                        setSelectedModel('claude-sonnet-4-6');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                        llmProvider === 'anthropic'
                          ? 'bg-[#8B5CF6]/15 border-[#8B5CF6]/50 text-white'
                          : 'bg-[#1C1C1E] border-[#2D2D2D] text-[#6B7280] hover:border-[#3D3D3D]'
                      }`}
                    >
                      <Brain className={`w-4 h-4 ${llmProvider === 'anthropic' ? 'text-[#C4B5FD]' : ''}`} />
                      <div className="text-left">
                        <div>Anthropic</div>
                        <div className="text-xs opacity-60 font-normal">Claude (nube)</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setLlmProvider('lmstudio');
                        setSelectedModel('qwen2.5-coder-7b-instruct');
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                        llmProvider === 'lmstudio'
                          ? 'bg-[#22C55E]/15 border-[#22C55E]/50 text-white'
                          : 'bg-[#1C1C1E] border-[#2D2D2D] text-[#6B7280] hover:border-[#3D3D3D]'
                      }`}
                    >
                      <Zap className={`w-4 h-4 ${llmProvider === 'lmstudio' ? 'text-[#86EFAC]' : ''}`} />
                      <div className="text-left">
                        <div>LM Studio</div>
                        <div className="text-xs opacity-60 font-normal">Local (gratis)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Anthropic fields */}
                {llmProvider === 'anthropic' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-[#E5E7EB] block mb-2">API Key de Claude</label>
                      <div className="relative">
                        <input
                          type={showClaudeKey ? 'text' : 'password'}
                          value={claudeApiKey}
                          onChange={(e) => setClaudeApiKey(e.target.value)}
                          placeholder="sk-ant-xxxxxxxxxxxx"
                          className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 outline-none transition-all pr-11 font-mono"
                        />
                        <button
                          onClick={() => setShowClaudeKey(!showClaudeKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                        >
                          {showClaudeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-2">Obtén tu clave en <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:underline">console.anthropic.com</a></p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#E5E7EB] block mb-2">Modelo</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 outline-none transition-all"
                      >
                        {ANTHROPIC_MODELS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* LM Studio fields */}
                {llmProvider === 'lmstudio' && (
                  <>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-[#22C55E]/5 border border-[#22C55E]/20">
                      <Terminal className="w-4 h-4 text-[#86EFAC] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#86EFAC]">
                        Abre LM Studio → pestaña <strong>Developer</strong> → <strong>Start Server</strong> (puerto 1234 por defecto).
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#E5E7EB] block mb-2">URL del servidor</label>
                      <input
                        type="text"
                        value={llmBaseUrl}
                        onChange={(e) => setLlmBaseUrl(e.target.value)}
                        placeholder="http://localhost:1234/v1"
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#22C55E]/50 focus:ring-1 focus:ring-[#22C55E]/20 outline-none transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#E5E7EB] block mb-2">Nombre del modelo</label>
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        placeholder="qwen2.5-coder-7b-instruct"
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#22C55E]/50 focus:ring-1 focus:ring-[#22C55E]/20 outline-none transition-all font-mono"
                      />
                    </div>
                  </>
                )}

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">Temperatura</label>
                      <span className="text-xs bg-[#8B5CF6]/20 text-[#C4B5FD] px-2.5 py-1 rounded-md font-mono">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range" min="0" max="2" step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">Máximo de Tokens</label>
                      <span className="text-xs bg-[#8B5CF6]/20 text-[#C4B5FD] px-2.5 py-1 rounded-md font-mono">{maxTokens}</span>
                    </div>
                    <input
                      type="range" min="512" max="8192" step="256"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#E5E7EB] block mb-2">Webhook URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://tu-dominio.com/webhook"
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => testIAConnection(llmProvider)}
                  disabled={iaTestLoading || guardarConfiguracionIAMutation.isPending}
                  className="flex-1 bg-[#242424] border border-[#2D2D2D] text-white text-sm font-semibold py-3 rounded-lg hover:border-[#8B5CF6]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {iaTestLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Probando...</>
                    : <>⚡ Probar Conexión</>
                  }
                </button>
                <button
                  onClick={() =>
                    guardarConfiguracionIAMutation.mutate({
                      claudeApiKey: llmProvider === 'anthropic' ? (claudeApiKey || undefined) : undefined,
                      selectedModel,
                      temperature,
                      maxTokens,
                      webhookUrl: webhookUrl || undefined,
                      llmProvider,
                      llmBaseUrl: llmProvider === 'lmstudio' ? (llmBaseUrl || undefined) : undefined,
                    })
                  }
                  disabled={guardarConfiguracionIAMutation.isPending || !selectedModel}
                  className="flex-1 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-sm font-semibold py-3 rounded-lg hover:from-[#7C3AED] hover:to-[#6D28D9] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardarConfiguracionIAMutation.isPending
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Save className="w-4 h-4" /> Guardar Configuración</>
                  }
                </button>
              </div>

              {iaTestStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium mt-4 ${
                    iaTestStatus.type === 'success'
                      ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                      : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                  }`}
                >
                  {iaTestStatus.type === 'success'
                    ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    : <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  }
                  {iaTestStatus.message}
                </motion.div>
              )}

              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-3 p-4 rounded-lg text-sm font-medium ${
                      status.type === 'success'
                        ? 'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                        : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                    }`}
                  >
                    {status.type === 'success'
                      ? <CheckCircle className="w-5 h-5 flex-shrink-0" />
                      : <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    }
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* GitHub Integration */}
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[#2D2D2D]">
                <div className="w-12 h-12 rounded-lg bg-[#242424] border border-[#2D2D2D] flex items-center justify-center">
                  <GitBranch className="w-6 h-6 text-[#A0A0A0]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Integración GitHub</h3>
                  <p className="text-sm text-[#6B7280] mt-1">Conexión con repositorios</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#E5E7EB] block mb-2">Token de acceso personal</label>
                <div className="relative">
                  <input
                    type={showGithubToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 outline-none transition-all pr-11 font-mono"
                  />
                  <button
                    onClick={() => setShowGithubToken(!showGithubToken)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                  >
                    {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-[#6B7280] mt-2">Proporciona acceso a tus repositorios para análisis automáticos</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => guardarTokenMutation.mutate(githubToken)}
                  disabled={guardarTokenMutation.isPending || !githubToken.trim()}
                  className="flex-1 bg-gradient-to-r from-[#F97316] to-[#EA6D00] text-white text-sm font-semibold py-3 rounded-lg hover:from-[#EA6D00] hover:to-[#D45A00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardarTokenMutation.isPending || githubLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : <><Save className="w-4 h-4" /> Guardar Token</>
                  }
                </button>
                <button
                  onClick={() => {
                    if (githubToken) verifyGithubToken(githubToken);
                  }}
                  disabled={!githubToken.trim() || githubLoading}
                  className="flex-1 bg-[#242424] border border-[#2D2D2D] text-white text-sm font-semibold py-3 rounded-lg hover:border-[#F97316]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {githubLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Probando...</>
                    : <>⚡ Probar Conexión</>
                  }
                </button>
              </div>

              {githubUser && (
                <div className="p-4 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20">
                  <p className="text-sm text-[#22C55E] font-semibold">✓ Conectado como @{githubUser.login}</p>
                  <p className="text-xs text-[#22C55E]/70 mt-1">{githubUser.repositories} repositorios accesibles</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'preferencias':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[#2D2D2D]">
                <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-[#FCD34D]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Preferencias Generales</h3>
                  <p className="text-sm text-[#6B7280] mt-1">Personaliza tu experiencia</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Language */}
                <div>
                  <label className="text-sm font-medium text-[#E5E7EB] block mb-2">Idioma</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 outline-none transition-all"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-sm font-medium text-[#E5E7EB] block mb-3">Tema</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                        theme === 'dark'
                          ? 'bg-[#F97316]/15 border-[#F97316]/50 text-white'
                          : 'bg-[#1C1C1E] border-[#2D2D2D] text-[#6B7280] hover:border-[#3D3D3D]'
                      }`}
                    >
                      🌙 Oscuro
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                        theme === 'light'
                          ? 'bg-[#F97316]/15 border-[#F97316]/50 text-white'
                          : 'bg-[#1C1C1E] border-[#2D2D2D] text-[#6B7280] hover:border-[#3D3D3D]'
                      }`}
                    >
                      ☀️ Claro
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8">
              <div className="flex items-center gap-4 pb-6 border-b border-[#2D2D2D] mb-6">
                <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#FCD34D]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
                  <p className="text-sm text-[#6B7280] mt-1">Gestiona cómo recibir alertas</p>
                </div>
              </div>
              <NotificationPreferences />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border border-[#2D2D2D]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#F97316]/10 via-transparent to-[#8B5CF6]/10" />
        <div className="relative p-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-5 h-5 text-[#F97316]" />
            <span className="text-xs font-semibold text-[#F97316] uppercase tracking-wide">Configuración</span>
          </div>
          <h1 className="text-3xl font-bold text-white mt-2">Preferencias y Configuración</h1>
          <p className="text-sm text-[#6B7280] mt-3 max-w-xl">
            Personaliza tu experiencia, integra herramientas externas y gestiona notificaciones.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2D2D2D] overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-[#6B7280] hover:text-[#A0A0A0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
