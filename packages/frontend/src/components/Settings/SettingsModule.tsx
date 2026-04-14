import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertCircle,
  Terminal,
  Loader2,
  Pencil,
  X,
  Users,
  Brain,
  Zap,
  Bell,
  Lock,
  GitBranch,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useAuth } from '../../hooks/useAuth';
import type { UserProfile } from '../../types/api';
import NotificationPreferences from './NotificationPreferences';

const ROLES = ['ADMIN', 'ANALYST', 'DEVELOPER', 'VIEWER'] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  ANALYST: 'Analista',
  DEVELOPER: 'Desarrollador',
  VIEWER: 'Viewer',
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN:     'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20',
  ANALYST:   'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
  DEVELOPER: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/20',
  VIEWER:    'text-[#6B7280] bg-[#6B7280]/10 border-[#6B7280]/20',
};

type SettingsTab = 'profile' | 'integrations' | 'security' | 'notifications' | 'team';

const TABS: Array<{ id: SettingsTab; label: string; icon: typeof Settings; description: string }> = [
  { id: 'profile', label: 'Perfil', icon: Shield, description: 'Información personal' },
  { id: 'integrations', label: 'Integraciones', icon: GitBranch, description: 'APIs y webhooks' },
  { id: 'security', label: 'Seguridad', icon: Lock, description: 'Configuración de seguridad' },
  { id: 'notifications', label: 'Notificaciones', icon: Bell, description: 'Alertas y eventos' },
];

export default function SettingsModule() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [githubToken, setGithubToken] = useState('');
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', avatar: '', bio: '' });

  // Local validation functions for tokens (flexible - backend validates actual format)
  const validateGithubToken = (token: string): boolean => {
    // Accept any token with minimum length - backend will validate actual format
    return token.length >= 10;
  };

  const validateClaudeToken = (token: string): boolean => {
    // Accept any token with minimum length - backend will validate actual format
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

  const AI_MODELS = [
    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Recomendado)' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku (Rápido)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
  ];

  const { data: userSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiService.obtenerConfiguracionUsuario(),
    select: (data: { data?: { githubToken?: string; claudeApiKey?: string; selectedModel?: string; temperature?: number; maxTokens?: number; webhookUrl?: string } }) => data?.data,
  });

  const { data: perfil, isLoading: perfilLoading } = useQuery<UserProfile>({
    queryKey: ['user-profile'],
    queryFn: () => apiService.obtenerPerfil(),
  });

  const isLoading = settingsLoading || perfilLoading;

  useEffect(() => {
    if (userSettings?.githubToken) {
      setGithubToken(userSettings.githubToken);
    }
    if (userSettings?.claudeApiKey) {
      setClaudeApiKey(userSettings.claudeApiKey);
    }
    if (userSettings?.selectedModel) {
      setSelectedModel(userSettings.selectedModel);
    }
    if (userSettings?.temperature) {
      setTemperature(userSettings.temperature);
    }
    if (userSettings?.maxTokens) {
      setMaxTokens(userSettings.maxTokens);
    }
    if (userSettings?.webhookUrl) {
      setWebhookUrl(userSettings.webhookUrl);
    }
  }, [userSettings]);

  useEffect(() => {
    if (perfil) {
      setProfileForm({ name: perfil.name || '', email: perfil.email, avatar: perfil.avatar || '', bio: perfil.bio || '' });
    }
  }, [perfil]);

  const guardarTokenMutation = useMutation({
    mutationFn: (token: string) => {
      // BUG FIX #3: Validate token format before sending
      if (!validateGithubToken(token)) {
        throw new Error('Token de GitHub debe empezar con "ghp_" y tener el formato correcto');
      }
      return apiService.guardarTokenGithub(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setStatus({ type: 'success', message: 'Token de GitHub actualizado.' });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: (error: any) => {
      const message = error?.message || 'Error al procesar el token. Verifica el formato.';
      setStatus({ type: 'error', message });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const guardarConfiguracionIAMutation = useMutation({
    mutationFn: (config: { claudeApiKey?: string; selectedModel: string; temperature: number; maxTokens: number; webhookUrl?: string }) => {
      // BUG FIX #3: Validate before sending network request
      if (config.claudeApiKey && !validateClaudeToken(config.claudeApiKey)) {
        throw new Error('API Key debe empezar con "sk-ant-"');
      }
      if (config.webhookUrl && !validateWebhookUrl(config.webhookUrl)) {
        throw new Error('URL del webhook debe ser una URL válida (http:// o https://)');
      }
      return apiService.guardarConfiguracionIA(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setStatus({ type: 'success', message: 'Configuración de IA actualizada correctamente.' });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: () => {
      setStatus({ type: 'error', message: 'Error al guardar la configuración de IA.' });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const actualizarPerfilMutation = useMutation({
    mutationFn: (updates: { name?: string; email?: string }) => apiService.actualizarPerfil(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setEditingProfile(false);
      setStatus({ type: 'success', message: 'Perfil actualizado correctamente.' });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: () => {
      setStatus({ type: 'error', message: 'Error al actualizar el perfil.' });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const { data: teamUsers = [] } = useQuery({
    queryKey: ['team-users'],
    queryFn: () => apiService.listarUsuarios(),
    enabled: isAdmin,
  });

  const cambiarRolMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiService.cambiarRolUsuario(userId, role),
    // BUG FIX #3: Optimistic update to prevent UI flicker
    onMutate: async ({ userId, role }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['team-users'] });

      // Snapshot old data
      const previousUsers = queryClient.getQueryData(['team-users']);

      // Optimistically update cache
      queryClient.setQueryData(['team-users'], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((user: any) =>
            user.id === userId ? { ...user, role } : user
          ),
        };
      });

      return { previousUsers };
    },
    onError: (_, __, context) => {
      // Revert to previous state if mutation fails
      if (context?.previousUsers) {
        queryClient.setQueryData(['team-users'], context.previousUsers);
      }
    },
    onSuccess: () => {
      // Optionally refetch to ensure data is fresh
      queryClient.invalidateQueries({ queryKey: ['team-users'] });
    },
  });

  const handleGuardarPerfil = () => {
    const updates: { name?: string; email?: string; avatar?: string | null; bio?: string | null } = {};
    if (profileForm.name.trim()) updates.name = profileForm.name.trim();
    if (profileForm.email.trim()) updates.email = profileForm.email.trim();
    updates.avatar = profileForm.avatar.trim() || null;
    updates.bio = profileForm.bio.trim() || null;
    actualizarPerfilMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
        <p className="text-sm text-[#6B7280]">Cargando preferencias...</p>
      </div>
    );
  }

  const avatarInitial = (perfil?.name || perfil?.email || 'U').charAt(0).toUpperCase();
  const displayTabs = isAdmin ? [...TABS, { id: 'team' as SettingsTab, label: 'Equipo', icon: Users, description: 'Usuarios y roles' }] : TABS;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-[#1E1E20] to-[#242424] border border-[#2D2D2D] rounded-xl p-8">
              {editingProfile ? (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Editar tu perfil</h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">Nombre</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Tu nombre completo"
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="tu@email.com"
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">URL de avatar</label>
                      <input
                        type="url"
                        value={profileForm.avatar}
                        onChange={(e) => setProfileForm((f) => ({ ...f, avatar: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">Biografía</label>
                      <input
                        type="text"
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                        placeholder="Analista de seguridad, investigador..."
                        className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-[#2D2D2D]">
                    <button
                      onClick={() => {
                        setEditingProfile(false);
                        setProfileForm({ name: perfil?.name || '', email: perfil?.email || '', avatar: perfil?.avatar || '', bio: perfil?.bio || '' });
                      }}
                      className="px-5 py-2.5 rounded-lg bg-[#242424] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:text-white transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGuardarPerfil}
                      disabled={actualizarPerfilMutation.isPending || (!profileForm.name.trim() && !profileForm.email.trim())}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#F97316] to-[#EA6D00] text-white text-sm font-semibold hover:from-[#EA6D00] hover:to-[#D45A00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actualizarPerfilMutation.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                        : <><Save className="w-4 h-4" /> Guardar Cambios</>
                      }
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#F97316] to-[#EA6D00] border border-[#F97316]/30 flex items-center justify-center text-2xl font-bold text-white overflow-hidden flex-shrink-0">
                      {perfil?.avatar
                        ? <img src={perfil.avatar} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : avatarInitial
                      }
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{perfil?.name || perfil?.email || 'Usuario'}</h2>
                      <p className="text-sm text-[#6B7280] mt-1">{perfil?.email}</p>
                      {perfil?.bio && <p className="text-xs text-[#4B5563] mt-2 italic">{perfil.bio}</p>}
                      <div className="flex gap-2 mt-3">
                        <span className="px-3 py-1 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs font-semibold text-[#22C55E]">✓ Verificado</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#242424] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:border-[#F97316]/30 hover:text-white transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'integrations':
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
                  <p className="text-xs text-[#6B7280] mt-2">Obtén tu clave en <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:underline">https://console.anthropic.com</a></p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-[#E5E7EB] block mb-2">Modelo de IA</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-3 text-sm text-white focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/20 outline-none transition-all"
                    >
                      {AI_MODELS.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-[#E5E7EB]">Temperatura</label>
                      <span className="text-xs bg-[#8B5CF6]/20 text-[#C4B5FD] px-2.5 py-1 rounded-md font-mono">{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-[#8B5CF6] cursor-pointer"
                    />
                    <p className="text-xs text-[#6B7280] mt-2">0 = Determinista, 2 = Muy creativo</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[#E5E7EB]">Máximo de Tokens</label>
                    <span className="text-xs bg-[#8B5CF6]/20 text-[#C4B5FD] px-2.5 py-1 rounded-md font-mono">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="8192"
                    step="256"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full accent-[#8B5CF6] cursor-pointer"
                  />
                  <p className="text-xs text-[#6B7280] mt-2">Limita la longitud de la respuesta</p>
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
                  <p className="text-xs text-[#6B7280] mt-2">Recibe notificaciones cuando se completen análisis</p>
                </div>
              </div>

              <button
                onClick={() =>
                  guardarConfiguracionIAMutation.mutate({
                    claudeApiKey: claudeApiKey || undefined,
                    selectedModel,
                    temperature,
                    maxTokens,
                    webhookUrl: webhookUrl || undefined,
                  })
                }
                disabled={guardarConfiguracionIAMutation.isPending || !selectedModel}
                className="w-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white text-sm font-semibold py-3 rounded-lg hover:from-[#7C3AED] hover:to-[#6D28D9] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {guardarConfiguracionIAMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  : <><Save className="w-4 h-4" /> Guardar Configuración</>
                }
              </button>
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

              <button
                onClick={() => guardarTokenMutation.mutate(githubToken)}
                disabled={guardarTokenMutation.isPending || !githubToken.trim()}
                className="w-full bg-gradient-to-r from-[#F97316] to-[#EA6D00] text-white text-sm font-semibold py-3 rounded-lg hover:from-[#EA6D00] hover:to-[#D45A00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guardarTokenMutation.isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  : <><Save className="w-4 h-4" /> Guardar Token</>
                }
              </button>

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
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#EF4444]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Zona de seguridad crítica</p>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                  Los tokens de acceso se almacenan cifrados en el backend. Los agentes utilizan estos tokens para acceder a tus recursos a través de canales protegidos.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#F97316]" />
                  <h3 className="text-sm font-semibold text-white">Contraseña</h3>
                </div>
                <button className="w-full px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:text-white hover:border-[#F97316]/30 transition-all">
                  Cambiar contraseña
                </button>
              </div>

              <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#22C55E]" />
                  <h3 className="text-sm font-semibold text-white">Autenticación</h3>
                </div>
                <button className="w-full px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:text-white hover:border-[#22C55E]/30 transition-all">
                  Configurar 2FA
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="animate-in fade-in duration-300">
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8">
              <div className="flex items-center gap-4 pb-6 border-b border-[#2D2D2D] mb-6">
                <div className="w-12 h-12 rounded-lg bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#FCD34D]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Preferencias de Notificaciones</h3>
                  <p className="text-sm text-[#6B7280] mt-1">Gestiona cómo y cuándo recibir alertas</p>
                </div>
              </div>
              <NotificationPreferences />
            </div>
          </div>
        );

      case 'team':
        if (!isAdmin) return null;
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[#2D2D2D]">
                <div className="w-12 h-12 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#A5B4FC]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Gestión del Equipo</h3>
                  <p className="text-sm text-[#6B7280] mt-1">Usuarios, roles y permisos</p>
                </div>
              </div>

              {teamUsers.length === 0 ? (
                <p className="text-sm text-[#6B7280] text-center py-8">No hay otros usuarios registrados.</p>
              ) : (
                <div className="space-y-3">
                  {teamUsers.map((u: any) => {
                    const role = u.roles?.[0]?.role ?? 'VIEWER';
                    const isCurrentUser = u.id === currentUser?.id;
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#F97316]/20 transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F97316] to-[#EA6D00] border border-[#F97316]/20 flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{u.name || '—'}</p>
                            <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
                          </div>
                        </div>

                        {isCurrentUser ? (
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${ROLE_COLORS[role]}`}>
                            {ROLE_LABELS[role] ?? role} (tú)
                          </span>
                        ) : (
                          <select
                            value={role}
                            onChange={(e) => cambiarRolMutation.mutate({ userId: u.id, role: e.target.value })}
                            disabled={cambiarRolMutation.isPending}
                            className="text-xs font-medium bg-[#1C1C1E] border border-[#2D2D2D] text-[#A0A0A0] rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#6366F1]/50 cursor-pointer transition-all"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
            Personaliza tu experiencia, integra herramientas externas y administra la seguridad de tu cuenta.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2D2D2D] overflow-x-auto">
        {displayTabs.map((tab) => {
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
