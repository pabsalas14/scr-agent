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
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Refined Header - Control Center */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 text-[#64748B]">
             <Settings className="w-3.5 h-3.5 opacity-50" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em]">Centro de Control de Preferencias</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none uppercase">AJUSTES</h1>
          <p className="text-[#64748B] text-xs font-medium max-w-lg leading-relaxed">
             Personaliza tu entorno de auditoría CODA, gestiona integraciones externas y configura los niveles de seguridad de los agentes.
          </p>
        </div>
      </div>

      <div className="grid gap-10">
        {/* Profile Card - Elite Redesign */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 md:p-10 group">
           <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#00D1FF] to-[#7000FF] flex items-center justify-center text-2xl font-black text-white shadow-[0_15px_30px_rgba(0,209,255,0.2)]">
                 A
              </div>
              <div className="flex-1 text-center md:text-left space-y-3">
                 <div className="space-y-1">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Admin CODA</h2>
                    <p className="text-[#64748B] font-bold text-[10px] uppercase tracking-widest">admin@coda.local</p>
                 </div>
                 <div className="flex flex-wrap justify-center md:justify-start gap-2.5">
                    <div className="px-2 py-0.5 rounded-md bg-[#00FF94]/10 border border-[#00FF94]/20 text-[8px] font-black text-[#00FF94] uppercase tracking-widest">USUARIO VERIFICADO</div>
                    <div className="px-2 py-0.5 rounded-md bg-[#00D1FF]/10 border border-[#00D1FF]/20 text-[8px] font-black text-[#00D1FF] uppercase tracking-widest">ACCESO ADMIN</div>
                 </div>
              </div>
           </div>
           
           <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-5 transition-opacity duration-700 pointer-events-none">
              <Shield className="w-32 h-32" />
           </div>
        </div>

        {/* Configuration Groups */}
        {/* Configuration Groups - Balanced Layout */}
        <div className="grid md:grid-cols-2 gap-10">
           {/* GitHub Integration */}
           <div className="rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 space-y-8 transition-all duration-300 hover:border-white/10">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.03]">
                 <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white border border-white/5">
                    <Terminal className="w-4 h-4 opacity-70" />
                 </div>
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Integración GitHub</h3>
              </div>
              
              <div className="space-y-6">
                 <div className="space-y-2.5">
                    <label className="text-[9px] font-black text-[#64748B] uppercase tracking-widest ml-1">Token de Acceso Personal</label>
                    <div className="relative group">
                       <input 
                         type={showToken ? 'text' : 'password'}
                         value={githubToken}
                         onChange={(e) => setGithubToken(e.target.value)}
                         placeholder="ghp_xxxxxxxxxxxx"
                         className="w-full bg-[#07080D] border border-white/5 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-[#3D4A5C] focus:border-[#00D1FF]/30 focus:ring-0 transition-all outline-none pr-12 font-mono"
                       />
                       <button 
                         onClick={() => setShowToken(!showToken)}
                         className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3D4A5C] hover:text-white transition-colors"
                       >
                         {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleSaveToken}
                   disabled={guardarTokenMutation.isPending}
                   className="w-full bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-[#00D1FF] transition-all flex items-center justify-center gap-2.5 hover:shadow-[0_10px_30px_rgba(0,209,255,0.2)]"
                 >
                   <Save className="w-3.5 h-3.5" />
                   {guardarTokenMutation.isPending ? 'Sincronizando...' : 'Actualizar Credenciales'}
                 </button>
              </div>
              
              <AnimatePresence>
                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-3 p-4 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                      status.type === 'success' ? 'bg-[#00FF94]/5 text-[#00FF94] border border-[#00FF94]/10' : 'bg-[#FF3B3B]/5 text-[#FF3B3B] border border-[#FF3B3B]/10'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>

           {/* System Preferences */}
           <div className="rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 space-y-8 transition-all duration-300 hover:border-white/10">
              <div className="flex items-center gap-3 pb-4 border-b border-white/[0.03]">
                 <div className="w-8 h-8 rounded-xl bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF] border border-[#00D1FF]/20">
                    <Monitor className="w-4 h-4 shadow-[0_0_8px_#00D1FF40]" />
                 </div>
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Interfaz y Sistema</h3>
              </div>
              
              <div className="space-y-3.5">
                 {[
                   { icon: Bell, label: 'Notificaciones Críticas', enabled: true },
                   { icon: Shield, label: 'Auditoría Agresiva', enabled: false },
                   { icon: Database, label: 'Persistencia de Memoria', enabled: true },
                   { icon: Key, label: 'Protección Biométrica', enabled: false },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-[1.5rem] bg-white/[0.01] border border-white/[0.02] hover:border-white/10 transition-all group">
                      <div className="flex items-center gap-3.5">
                        <item.icon className="w-4 h-4 text-[#475569] group-hover:text-[#00D1FF] transition-colors" />
                        <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-widest leading-none">{item.label}</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full p-1 transition-all relative cursor-pointer ${item.enabled ? 'bg-[#00D1FF]' : 'bg-[#1F2937]'}`}>
                         <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Security Footer - Refined Proportions */}
        <div className="p-8 md:p-10 rounded-[3rem] bg-[#FF3B3B]/5 border border-[#FF3B3B]/10 flex flex-col md:flex-row items-center gap-8 group">
           <div className="w-14 h-14 rounded-2xl bg-[#FF3B3B]/10 flex items-center justify-center text-[#FF3B3B] border border-[#FF3B3B]/20 transition-transform duration-500 group-hover:rotate-12">
              <Shield className="w-6 h-6" />
           </div>
           <div className="flex-1 space-y-2 text-center md:text-left">
              <p className="text-white font-black text-xs uppercase tracking-[0.2em]">Zona de Seguridad Crítica</p>
              <p className="text-[10px] text-[#475569] font-medium leading-relaxed uppercase tracking-tight">
                Toda la información sensible, incluyendo tokens de acceso, se almacena de forma cifrada en el backend de CODA. Los agentes utilizan estos tokens para acceder a tus recursos de forma segura a través de canales protegidos.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
