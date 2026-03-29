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
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#1F2937]/30 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00FF94]">
            <Activity className="w-3 h-3" />
            <span>Monitor de Observabilidad en Tiempo Real</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">REPORTES</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl">
             Auditoría central de escaneos de seguridad. Seguimiento de estados desde la inspección hasta el veredicto fiscal.
          </p>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Escaneos Activos', value: enProgreso.length, icon: Zap, color: '#0EA5E9', bg: 'from-blue-600/20 to-transparent' },
          { label: 'Exitosos (Recientes)', value: completados.length, icon: CheckCircle, color: '#10B981', bg: 'from-emerald-600/20 to-transparent' },
          { label: 'Anomalías / Fallos', value: fallidos.length, icon: ShieldAlert, color: '#FF3B3B', bg: 'from-red-600/20 to-transparent' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border-white/[0.03]`}>
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{stat.label}</p>
                  <p className="text-4xl font-black text-white">{stat.value}</p>
                </div>
                <stat.icon className="w-12 h-12 opacity-20" style={{ color: stat.color }} />
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main List Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Analyses */}
          {enProgreso.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xs font-black text-white uppercase tracking-[0.25em] flex items-center gap-3 ml-2">
                <div className="w-2 h-2 rounded-full bg-[#00D1FF] animate-pulse" />
                Ejecuciones en Proceso
              </h2>
              <div className="space-y-3">
                {enProgreso.map((analysis: any) => {
                  const cfg = STATUS_CONFIG[analysis.status] || STATUS_CONFIG['RUNNING']!;
                  return (
                    <motion.div key={analysis.id} layout>
                      <Card className="hover:border-white/10 transition-all group pointer-events-none">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cfg.bg} border border-white/5`}>
                                 <cfg.icon className="w-6 h-6" style={{ color: cfg.color }} />
                               </div>
                               <div>
                                 <p className="text-[10px] font-black uppercase tracking-widest opacity-60" style={{ color: cfg.color }}>{cfg.label}</p>
                                 <h4 className="text-lg font-black text-white tracking-tight">{analysis.projectName}</h4>
                               </div>
                            </div>
                            <div className="text-right">
                              <span className="text-2xl font-black text-white">{analysis.progress || 0}%</span>
                            </div>
                          </div>
                          
                          <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${analysis.progress || 10}%` }}
                              style={{ backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}40` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Success List */}
          <section className="space-y-4">
             <h2 className="text-xs font-black text-[#64748B] uppercase tracking-[0.25em] flex items-center gap-3 ml-2">
                <CheckCircle className="w-3.5 h-3.5" />
                Historial de Éxitos
              </h2>
              <div className="grid gap-3">
                {completados.length > 0 ? completados.map((analysis: any, idx) => (
                   <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                   >
                     <Card className="hover:bg-white/[0.02] border-white/[0.03] hover:border-white/10 transition-all flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center text-[#10B981] group-hover:bg-[#10B981]/20 transition-colors">
                             <FileText className="w-5 h-5" />
                           </div>
                           <div>
                              <h5 className="font-black text-white text-sm tracking-tight">{analysis.projectName}</h5>
                              <p className="text-[9px] font-bold text-[#475569] uppercase tracking-widest mt-1">
                                Sincronizado: {new Date(analysis.createdAt).toLocaleDateString()} · {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                           </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#2D3748] group-hover:text-[#10B981] group-hover:translate-x-1 transition-all" />
                     </Card>
                   </motion.div>
                )) : (
                  <p className="text-center py-10 text-[10px] uppercase font-black tracking-widest text-[#2D3748]">Sin registros completados</p>
                )}
              </div>
          </section>
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-4 space-y-6">
           {/* Failed Stack */}
           <Card className="bg-[#FF3B3B]/5 border-[#FF3B3B]/10">
              <h3 className="text-[10px] font-black text-[#FF3B3B] uppercase tracking-widest mb-6 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Fallos de Conexión / Análisis
              </h3>
              <div className="space-y-4">
                {fallidos.length > 0 ? fallidos.map((analysis: any) => (
                  <div key={analysis.id} className="p-4 rounded-2xl bg-black/40 border border-[#FF3B3B]/5 space-y-2">
                    <p className="text-white font-black text-xs">{analysis.projectName}</p>
                    <p className="text-[9px] text-[#FF3B3B]/70 font-mono leading-relaxed line-clamp-2 uppercase">
                       {analysis.error || 'ERROR_UNDEFINED: Motor de análisis offline'}
                    </p>
                  </div>
                )) : (
                  <div className="text-center py-6 opacity-20">
                     <CheckCircle className="w-10 h-10 mx-auto mb-2 text-[#10B981]" />
                     <p className="text-[9px] font-black uppercase tracking-widest">Canales Limpios</p>
                  </div>
                )}
              </div>
           </Card>

           {/* Quick Tips */}
           <Card className="bg-[#00D1FF]/5 border-[#00D1FF]/10">
              <h3 className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest mb-4">Protocolo de Reporte</h3>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Los reportes son generados automáticamente tras completar las tres fases de auditoría (Inspección, Detección y Dictamen). Un reporte fallido puede indicar problemas de conexión con el repositorio de origen.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
