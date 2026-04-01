import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Shield,
  Eye,
  EyeOff,
  Save,
  Database,
  Key,
  Bell,
  Monitor,
  CheckCircle,
  AlertCircle,
  Terminal,
  Loader2,
} from 'lucide-react';
import { apiService } from '../../services/api.service';

export default function SettingsModule() {
  const queryClient = useQueryClient();
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiService.obtenerConfiguracionUsuario(),
    select: (data: { data?: { githubToken?: string } }) => data?.data,
  });

  useEffect(() => {
    if (userSettings?.githubToken) {
      setGithubToken(userSettings.githubToken);
    }
  }, [userSettings]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Loader2 className="w-6 h-6 text-[#F97316] animate-spin" />
        <p className="text-sm text-[#6B7280]">Cargando preferencias...</p>
      </div>
    );
  }

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
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-xl font-semibold text-[#F97316]">
              A
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Admin CODA</h2>
              <p className="text-sm text-[#6B7280]">admin@coda.local</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-md bg-[#22C55E]/10 border border-[#22C55E]/20 text-xs text-[#22C55E]">Verificado</span>
                <span className="px-2 py-0.5 rounded-md bg-[#F97316]/10 border border-[#F97316]/20 text-xs text-[#F97316]">Admin</span>
              </div>
            </div>
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
                  type={showToken ? 'text' : 'password'}
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-[#4B5563] focus:border-[#F97316]/50 focus:ring-1 focus:ring-[#F97316]/40 outline-none transition-all pr-10 font-mono"
                />
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#A0A0A0] transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

          {/* System Preferences */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-[#2D2D2D]">
              <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-[#F97316]" />
              </div>
              <h3 className="text-sm font-medium text-white">Interfaz y sistema</h3>
            </div>

            <div className="space-y-3">
              {/* Toggle activo: notificaciones in-app — gestionado desde el panel de campana */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#242424] border border-[#2D2D2D]">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-[#22C55E]" />
                  <div>
                    <span className="text-sm text-[#A0A0A0]">Notificaciones en tiempo real</span>
                    <p className="text-[11px] text-[#475569] mt-0.5">Via Socket.io — siempre activo</p>
                  </div>
                </div>
                <div className="w-9 h-5 rounded-full bg-[#22C55E] p-0.5 relative">
                  <div className="w-4 h-4 bg-white rounded-full shadow-sm translate-x-4" />
                </div>
              </div>

              {/* Próximamente */}
              {[
                { icon: Shield,   label: 'Auditoría agresiva' },
                { icon: Database, label: 'Persistencia de memoria' },
                { icon: Key,      label: 'Protección biométrica' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#242424] border border-[#2D2D2D] opacity-50 cursor-not-allowed"
                  title="Próximamente"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-[#6B7280]" />
                    <span className="text-sm text-[#6B7280]">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#475569] border border-[#2D2D2D] rounded px-1.5 py-0.5 uppercase tracking-wide">
                    Próximamente
                  </span>
                </div>
              ))}
            </div>
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
      </div>
    </div>
  );
}
