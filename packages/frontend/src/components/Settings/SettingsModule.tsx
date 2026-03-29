/**
 * Módulo de Configuración - Premium Redesign
 * Gestión de tokens, preferencias y perfiles de usuario
 */

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
  Terminal
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function SettingsModule() {
  const queryClient = useQueryClient();
  const [githubToken, setGithubToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Obtener configuración del usuario
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['user-settings'],
    queryFn: () => apiService.obtenerConfiguracionUsuario(),
    select: (data: any) => data?.data,
  });

  useEffect(() => {
    if (userSettings?.githubToken) {
      setGithubToken(userSettings.githubToken);
    }
  }, [userSettings]);

  // Mutación para guardar token
  const guardarTokenMutation = useMutation({
    mutationFn: (token: string) => apiService.guardarTokenGithub(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      setStatus({ type: 'success', message: 'Token de GitHub actualizado y cifrado.' });
      setTimeout(() => setStatus(null), 5000);
    },
    onError: () => {
      setStatus({ type: 'error', message: 'Error al procesar el token en el servidor.' });
      setTimeout(() => setStatus(null), 5000);
    },
  });

  const handleSaveToken = () => {
    if (!githubToken.trim()) return;
    guardarTokenMutation.mutate(githubToken);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Settings className="w-12 h-12 text-[#64748B] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Sincronizando Preferencias de Usuario...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#1F2937]/30 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B]">
            <Settings className="w-3 h-3" />
            <span>Centro de Control de Preferencias</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">AJUSTES</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl">
             Personaliza tu entorno de auditoría, gestiona integraciones externas y configura los niveles de seguridad de los agentes.
          </p>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Profile Card */}
        <Card className="relative overflow-hidden border-white/[0.03] bg-gradient-to-br from-white/[0.02] to-transparent">
           <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#00D1FF] to-[#7000FF] flex items-center justify-center text-3xl font-black text-white shadow-[0_0_30px_rgba(0,209,255,0.3)]">
                 A
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                 <h2 className="text-2xl font-black text-white tracking-tight">Admin CODA</h2>
                 <p className="text-[#64748B] font-medium text-sm">admin@coda.local</p>
                 <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                    <Badge type="success" size="sm">USUARIO VERIFICADO</Badge>
                    <Badge type="info" size="sm">ADMIN ACCESS</Badge>
                 </div>
              </div>
           </div>
        </Card>

        {/* Configuration Groups */}
        <div className="grid md:grid-cols-2 gap-8">
           {/* GitHub Integration */}
           <Card className="space-y-6 border-white/[0.03]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[#1F2937] flex items-center justify-center text-white">
                    <Terminal className="w-5 h-5" />
                 </div>
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Integración GitHub</h3>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Personal Access Token</label>
                    <div className="relative">
                       <input 
                         type={showToken ? 'text' : 'password'}
                         value={githubToken}
                         onChange={(e) => setGithubToken(e.target.value)}
                         placeholder="ghp_xxxxxxxxxxxx"
                         className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#3D4A5C] focus:border-[#00D1FF]/50 focus:ring-1 focus:ring-[#00D1FF]/50 transition-all outline-none pr-12 font-mono"
                       />
                       <button 
                         onClick={() => setShowToken(!showToken)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3D4A5C] hover:text-white transition-colors"
                       >
                         {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={handleSaveToken}
                      disabled={guardarTokenMutation.isPending}
                      className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-widest py-4 rounded-2xl hover:bg-[#00D1FF] transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,209,255,0.4)]"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {guardarTokenMutation.isPending ? 'Validando...' : 'Actualizar'}
                    </button>
                 </div>
              </div>
              
              <AnimatePresence>
                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest ${
                      status.type === 'success' ? 'bg-[#00FF94]/10 text-[#00FF94]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>
           </Card>

           {/* System Preferences */}
           <Card className="space-y-6 border-white/[0.03]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF]">
                    <Monitor className="w-5 h-5" />
                 </div>
                 <h3 className="text-xs font-black text-white uppercase tracking-widest">Interfaz y Sistema</h3>
              </div>
              
              <div className="space-y-4">
                 {[
                   { icon: Bell, label: 'Notificaciones de Seguridad', enabled: true },
                   { icon: Shield, label: 'Modo de Auditoría Agresivo', enabled: false },
                   { icon: Database, label: 'Persistencia de Memoria IA', enabled: true },
                   { icon: Key, label: 'Autenticación Biométrica (FIDO2)', enabled: false },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 text-[#475569] group-hover:text-[#00D1FF] transition-colors" />
                        <span className="text-[11px] font-bold text-[#94A3B8] tracking-tight">{item.label}</span>
                      </div>
                      <div className={`w-10 h-5 rounded-full p-1 transition-colors relative cursor-pointer ${item.enabled ? 'bg-[#00D1FF]' : 'bg-[#1F2937]'}`}>
                         <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${item.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Security Footer */}
        <div className="p-8 rounded-[2.5rem] bg-[#FF3B3B]/5 border border-[#FF3B3B]/10 flex flex-col md:flex-row items-center gap-6">
           <div className="w-12 h-12 rounded-2xl bg-[#FF3B3B]/10 flex items-center justify-center text-[#FF3B3B]">
              <Shield className="w-6 h-6" />
           </div>
           <div className="flex-1 space-y-1 text-center md:text-left">
              <p className="text-white font-black text-sm uppercase tracking-widest">ZONA DE SEGURIDAD CRÍTICA</p>
              <p className="text-[11px] text-[#64748B] font-medium leading-relaxed">
                Toda la información sensible, incluyendo tokens de acceso, se almacena de forma cifrada en el backend de CODA. Los agentes utilizan estos tokens para acceder a tus recursos de forma segura.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
