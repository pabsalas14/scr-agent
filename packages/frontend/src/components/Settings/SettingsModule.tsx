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
  Webhook,
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

export default function SettingsModule() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';
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
    select: (data: { data?: { githubToken?: string } }) => data?.data,
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
    mutationFn: (token: string) => apiService.guardarTokenGithub(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setStatus({ type: 'success', message: 'Token de GitHub actualizado.' });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: () => {
      setStatus({ type: 'error', message: 'Error al procesar el token.' });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const guardarConfiguracionIAMutation = useMutation({
    mutationFn: (config: { claudeApiKey?: string; selectedModel: string; temperature: number; maxTokens: number; webhookUrl?: string }) =>
      apiService.guardarConfiguracionIA(config),
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

  // ── Equipo (solo admin) ──────────────────────────────────────────────────
  const { data: teamUsers = [] } = useQuery({
    queryKey: ['team-users'],
    queryFn: () => apiService.listarUsuarios(),
    enabled: isAdmin,
  });

  const cambiarRolMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiService.cambiarRolUsuario(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-users'] }),
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

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-3.5 h-3.5 text-[#6B7280]" />
          <span className="text-xs text-[#6B7280]">Configuración del sistema</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Ajustes</h1>
        <p className="text-sm text-[#6B7280] mt-1 max-w-lg">
          Gestiona integraciones externas y configura los niveles de seguridad de los agentes.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6">
          {editingProfile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Editar perfil</span>
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({ name: perfil?.name || '', email: perfil?.email || '', avatar: perfil?.avatar || '', bio: perfil?.bio || '' });
                  }}
                  className="text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B7280]">Nombre</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Tu nombre"
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B7280]">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="tu@email.com"
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-[#6B7280]">URL de avatar (opcional)</label>
                  <input
                    type="url"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm((f) => ({ ...f, avatar: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs text-[#6B7280]">Bio (opcional)</label>
                  <input
                    type="text"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                    placeholder="Analista de seguridad..."
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileForm({ name: perfil?.name || '', email: perfil?.email || '', avatar: perfil?.avatar || '', bio: perfil?.bio || '' });
                  }}
                  className="px-4 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:text-white transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarPerfil}
                  disabled={actualizarPerfilMutation.isPending || (!profileForm.name.trim() && !profileForm.email.trim())}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA6D00] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actualizarPerfilMutation.isPending
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                    : <><Save className="w-3.5 h-3.5" /> Guardar</>
                  }
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-xl font-semibold text-[#F97316] overflow-hidden flex-shrink-0">
                  {perfil?.avatar
                    ? <img src={perfil.avatar} alt="avatar" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : avatarInitial
                  }
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{perfil?.name || perfil?.email || 'Usuario'}</h2>
                  <p className="text-sm text-[#6B7280]">{perfil?.email}</p>
                  {perfil?.bio && <p className="text-xs text-[#4B5563] mt-0.5 italic">{perfil.bio}</p>}
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#22C55E]">Verificado</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEditingProfile(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242424] border border-[#2D2D2D] text-xs text-[#A0A0A0] hover:border-[#F97316]/30 hover:text-white transition-all"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Configuration */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center">
                <Brain className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <h3 className="text-sm font-medium text-white">Configuración de IA</h3>
            </div>

            <div className="space-y-4">
              {/* Claude API Key */}
              <div className="space-y-2">
                <label className="text-xs text-[#6B7280]">Claude API Key</label>
                <div className="relative">
                  <input
                    type={showClaudeKey ? 'text' : 'password'}
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    placeholder="sk-ant-xxxxxxxxxxxx"
                    className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/40 outline-none transition-all pr-10 font-mono"
                  />
                  <button
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                  >
                    {showClaudeKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#6B7280]">Obtén tu clave en https://console.anthropic.com</p>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-xs text-[#6B7280]">Modelo de IA</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/40 outline-none transition-all"
                >
                  {AI_MODELS.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#6B7280]">Temperatura (Creatividad)</label>
                  <span className="text-xs bg-[#8B5CF6]/20 text-[#C4B5FD] px-2 py-1 rounded">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
                <p className="text-[11px] text-[#6B7280]">0 = Determinista, 2 = Muy creativo</p>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-[#6B7280]">Máximo de Tokens</label>
                  <span className="text-xs bg-[#8B5CF6]/20 text-[#C4B5FD] px-2 py-1 rounded">{maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-[#8B5CF6]"
                />
                <p className="text-[11px] text-[#6B7280]">Limita la longitud de la respuesta</p>
              </div>

              {/* Webhook URL */}
              <div className="space-y-2">
                <label className="text-xs text-[#6B7280]">Webhook URL (Opcional)</label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://tu-dominio.com/webhook"
                  className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] focus:border-[#8B5CF6]/50 focus:ring-1 focus:ring-[#8B5CF6]/40 outline-none transition-all font-mono"
                />
                <p className="text-[11px] text-[#6B7280]">Recibe notificaciones cuando se completen análisis</p>
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
              className="w-full bg-[#8B5CF6] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#7C3AED] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardarConfiguracionIAMutation.isPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                : <><Save className="w-3.5 h-3.5" /> Guardar Configuración IA</>
              }
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* GitHub Integration */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
              <div className="w-8 h-8 rounded-lg bg-[#242424] border border-[#2D2D2D] flex items-center justify-center">
                <Terminal className="w-4 h-4 text-[#A0A0A0]" />
              </div>
              <h3 className="text-sm font-medium text-white">Integración GitHub</h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#6B7280]">Token de acceso personal</label>
              <div className="relative">
                <input
                  type={showGithubToken ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/40 outline-none transition-all pr-10 font-mono"
                />
                <button
                  onClick={() => setShowGithubToken(!showGithubToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                >
                  {showGithubToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => guardarTokenMutation.mutate(githubToken)}
              disabled={guardarTokenMutation.isPending || !githubToken.trim()}
              className="w-full bg-[#F97316] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#EA6D00] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardarTokenMutation.isPending
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                : <><Save className="w-3.5 h-3.5" /> Guardar token</>
              }
            </button>

            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2.5 p-3 rounded-lg text-sm ${
                    status.type === 'success'
                      ? 'bg-[#22C55E]/5 text-[#22C55E] border border-[#22C55E]/20'
                      : 'bg-[#EF4444]/5 text-[#EF4444] border border-[#EF4444]/20'
                  }`}
                >
                  {status.type === 'success'
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  }
                  {status.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Security Note */}
        <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Zona de seguridad crítica</p>
            <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
              Los tokens de acceso se almacenan cifrados en el backend. Los agentes utilizan estos tokens para acceder a tus recursos a través de canales protegidos.
            </p>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6">
           <NotificationPreferences />
        </div>

        {/* Gestión de equipo — solo admin */}
        {isAdmin && (
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-[#6366F1]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Equipo</h3>
                <p className="text-[11px] text-[#6B7280]">Gestión de usuarios y roles</p>
              </div>
            </div>

            {teamUsers.length === 0 ? (
              <p className="text-xs text-[#6B7280] text-center py-4">No hay otros usuarios registrados.</p>
            ) : (
              <div className="space-y-2">
                {teamUsers.map((u: any) => {
                  const role = u.roles?.[0]?.role ?? 'VIEWER';
                  const isCurrentUser = u.id === currentUser?.id;
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#242424] border border-[#2D2D2D]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#F97316]">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-white truncate">{u.name || '—'}</p>
                          <p className="text-[11px] text-[#6B7280] truncate">{u.email}</p>
                        </div>
                      </div>

                      {isCurrentUser ? (
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded border ${ROLE_COLORS[role]}`}>
                          {ROLE_LABELS[role] ?? role} (tú)
                        </span>
                      ) : (
                        <select
                          value={role}
                          onChange={(e) => cambiarRolMutation.mutate({ userId: u.id, role: e.target.value })}
                          disabled={cambiarRolMutation.isPending}
                          className="text-[11px] font-medium bg-[#1C1C1E] border border-[#2D2D2D] text-[#A0A0A0] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#6366F1]/50 cursor-pointer"
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
        )}
      </div>
    </div>
  );
}
