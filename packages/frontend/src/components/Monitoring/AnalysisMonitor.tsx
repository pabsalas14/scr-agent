/**
 * Monitor de Análisis - Premium Redesign
 * Muestra análisis en progreso, completados y fallidos con estética de alta fidelidad
 */

import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Clock, Zap, FileText, ArrowRight, Activity, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  PENDING: { label: 'PENDIENTE', icon: Clock, color: '#64748B', bg: 'bg-[#64748B]/10' },
  RUNNING: { label: 'EN PROGRESO', icon: Zap, color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10' },
  INSPECTOR_RUNNING: { label: 'INSPECTOR...', icon: Zap, color: '#F59E0B', bg: 'bg-[#F59E0B]/10' },
  DETECTIVE_RUNNING: { label: 'DETECTIVE...', icon: Zap, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' },
  FISCAL_RUNNING: { label: 'FISCAL...', icon: Zap, color: '#6366F1', bg: 'bg-[#6366F1]/10' },
  COMPLETADO: { label: 'COMPLETADO', icon: CheckCircle, color: '#10B981', bg: 'bg-[#10B981]/10' },
  ERROR: { label: 'FALLIDO', icon: AlertCircle, color: '#DC2626', bg: 'bg-[#DC2626]/10' },
};

export default function AnalysisMonitor() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 5000,
  });

  const proyectos = projectsData?.data || [];

  const allAnalyses = proyectos.flatMap((proyecto: any) =>
    (proyecto.analyses || []).map((analysis: any) => ({
      ...analysis,
      projectName: proyecto.name,
      projectId: proyecto.id,
    }))
  ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const enProgreso = allAnalyses.filter(
    (a: any) => a.status === 'RUNNING' || a.status.includes('RUNNING')
  );
  const completados = allAnalyses.filter((a: any) => a.status === 'COMPLETADO').slice(0, 10);
  const fallidos = allAnalyses.filter((a: any) => a.status === 'ERROR');

  if (isLoading) {
     return <div className="h-64 flex items-center justify-center"><Activity className="animate-spin text-[#00D1FF]" /></div>;
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Refined Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_8px_#00FF94]" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00FF94]">Sistema de Observabilidad</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">REPORTES</h1>
          <p className="text-[#64748B] text-xs font-medium max-w-lg leading-relaxed">
             Auditoría centralizada de escaneos de seguridad. Seguimiento de estados en tiempo real desde la inspección inicial hasta el veredicto final.
          </p>
        </div>
      </div>

      {/* Balanced Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Escaneos Activos', value: enProgreso.length, icon: Zap, color: '#0EA5E9', bg: 'bg-[#0EA5E9]/5' },
          { label: 'Exitosos (Recientes)', value: completados.length, icon: CheckCircle, color: '#10B981', bg: 'bg-[#10B981]/5' },
          { label: 'Anomalías / Fallos', value: fallidos.length, icon: ShieldAlert, color: '#FF3B3B', bg: 'bg-[#FF3B3B]/5' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-6 rounded-3xl bg-[#0A0B10]/40 border border-white/[0.03] backdrop-blur-md overflow-hidden group hover:border-white/10 transition-all duration-500`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[50px] opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-20`} style={{ backgroundColor: stat.color }} />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center translate-y-1">
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Main Operational Area (Success & Progress) */}
        <div className="lg:col-span-8 space-y-10">
          {/* Active Executions */}
          {enProgreso.length > 0 && (
            <section className="space-y-5">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1 h-3 bg-[#00D1FF] rounded-full shadow-[0_0_8px_#00D1FF]" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Ejecuciones en Proceso</h2>
              </div>
              <div className="grid gap-4">
                {enProgreso.map((analysis: any) => {
                  const cfg = STATUS_CONFIG[analysis.status] || STATUS_CONFIG['RUNNING']!;
                  return (
                    <motion.div key={analysis.id} layout>
                      <div className="p-6 rounded-3xl bg-[#0A0B10]/40 border border-white/[0.03] backdrop-blur-md transition-all group">
                        <div className="flex flex-col gap-5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${cfg.bg} border border-white/5`}>
                                 <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                               </div>
                               <div>
                                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60" style={{ color: cfg.color }}>{cfg.label}</p>
                                 <h4 className="text-md font-black text-white tracking-tight">{analysis.projectName}</h4>
                               </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-black text-white">{analysis.progress || 0}%</span>
                            </div>
                          </div>
                          
                          <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${analysis.progress || 10}%` }}
                              style={{ backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}30` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Success History */}
          <section className="space-y-5">
              <div className="flex items-center gap-3 ml-1">
                <div className="w-1 h-3 bg-[#10B981] rounded-full shadow-[0_0_8px_#10B981]" />
                <h2 className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.25em]">Historial de Éxitos</h2>
              </div>
              <div className="grid gap-3">
                {completados.length > 0 ? completados.map((analysis: any, idx) => (
                   <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-2xl bg-[#0A0B10]/20 border border-white/[0.02] hover:bg-white/[0.03] hover:border-white/10 transition-all flex items-center justify-between group cursor-pointer"
                   >
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center text-[#10B981] group-hover:text-white transition-colors">
                             <FileText className="w-4.5 h-4.5" />
                           </div>
                           <div>
                              <h5 className="font-black text-white text-sm tracking-tight">{analysis.projectName}</h5>
                              <p className="text-[9px] font-bold text-[#475569] uppercase tracking-widest mt-1">
                                {new Date(analysis.createdAt).toLocaleDateString()} · {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#2D3748] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                   </motion.div>
                )) : (
                  <div className="text-center py-16 bg-[#0A0B10]/10 border border-dashed border-white/[0.03] rounded-[2rem]">
                    <p className="text-[10px] uppercase font-black tracking-[0.25em] text-[#3D4A5C]">Sin registros completados</p>
                  </div>
                )}
              </div>
          </section>
        </div>

        {/* Sidebar Intelligence Panel */}
        <div className="lg:col-span-4 space-y-8">
           {/* Failed Stack */}
           <div className="p-8 rounded-[2rem] bg-[#FF3B3B]/5 border border-[#FF3B3B]/10 space-y-6">
              <div className="flex items-center justify-between border-b border-[#FF3B3B]/10 pb-4">
                 <h3 className="text-[10px] font-black text-[#FF3B3B] uppercase tracking-[0.2em] flex items-center gap-2">
                   <AlertCircle className="w-3.5 h-3.5" /> Anomalías
                 </h3>
                 <span className="text-[10px] font-black text-white">{fallidos.length}</span>
              </div>
              
              <div className="space-y-4">
                {fallidos.length > 0 ? fallidos.map((analysis: any) => (
                  <div key={analysis.id} className="p-4 rounded-2xl bg-black/40 border border-white/[0.03] space-y-2 group transition-colors hover:border-[#FF3B3B]/30">
                    <p className="text-white font-black text-xs">{analysis.projectName}</p>
                    <p className="text-[9px] text-[#FF3B3B]/70 font-mono leading-relaxed line-clamp-2 uppercase">
                       {analysis.error || 'ERROR_UNDEFINED: Motor de análisis offline'}
                    </p>
                  </div>
                )) : (
                  <div className="text-center py-8 space-y-4">
                     <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center mx-auto border border-[#10B981]/20">
                        <CheckCircle className="w-5 h-5 text-[#10B981]" />
                     </div>
                     <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#10B981] opacity-60">Canales Limpios</p>
                  </div>
                )}
              </div>
           </div>

           {/* Professional Knowledge Card */}
           <div className="p-8 rounded-[2rem] bg-[#00D1FF]/5 border border-[#00D1FF]/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Activity className="w-20 h-20" />
              </div>
              <h3 className="text-[10px] font-black text-[#00D1FF] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <ShieldAlert className="w-3.5 h-3.5" /> Protocolo
              </h3>
              <p className="text-[11px] text-[#64748B] leading-[1.8] font-medium selection:bg-[#00D1FF]/30">
                Los reportes son generados automáticamente tras completar las tres fases de auditoría técnica: **Inspección de Origen**, **Detección de Vectores** y **Dictamen Final**. Un estado fallido generalmente indica una brecha de sincronización con el repositorio.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
