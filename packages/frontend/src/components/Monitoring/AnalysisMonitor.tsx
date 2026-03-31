import type React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Clock, Zap, FileText, ArrowRight, Activity, ShieldAlert } from 'lucide-react';
import { apiService } from '../../services/api.service';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PENDING:           { label: 'Pendiente',    icon: Clock,        color: '#6B7280' },
  RUNNING:           { label: 'En progreso',  icon: Zap,          color: '#F97316' },
  INSPECTOR_RUNNING: { label: 'Inspector...',  icon: Zap,          color: '#EAB308' },
  DETECTIVE_RUNNING: { label: 'Detective...',  icon: Zap,          color: '#6366F1' },
  FISCAL_RUNNING:    { label: 'Fiscal...',     icon: Zap,          color: '#F97316' },
  COMPLETED:         { label: 'Completado',   icon: CheckCircle,  color: '#22C55E' },
  ERROR:             { label: 'Fallido',      icon: AlertCircle,  color: '#EF4444' },
  FAILED:            { label: 'Fallido',      icon: AlertCircle,  color: '#EF4444' },
  CANCELLED:         { label: 'Cancelado',    icon: AlertCircle,  color: '#6B7280' },
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

  const enProgreso = allAnalyses.filter((a: any) => a.status === 'RUNNING' || a.status.includes('RUNNING'));
  const completados = allAnalyses.filter((a: any) => a.status === 'COMPLETED').slice(0, 10);
  const fallidos = allAnalyses.filter((a: any) => a.status === 'ERROR');

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Activity className="animate-spin text-[#F97316] w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
          <span className="text-xs text-[#6B7280]">Sistema de Observabilidad</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Reportes</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Seguimiento de estados en tiempo real desde la inspección inicial hasta el veredicto final.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Escaneos Activos',    value: enProgreso.length, icon: Zap,        color: '#F97316' },
          { label: 'Exitosos (Recientes)', value: completados.length, icon: CheckCircle, color: '#22C55E' },
          { label: 'Anomalías / Fallos',  value: fallidos.length,   icon: ShieldAlert, color: '#EF4444' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">{stat.label}</p>
              <p className="text-xl font-semibold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active */}
          {enProgreso.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-[#A0A0A0] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F97316]" /> Ejecuciones en proceso
              </h2>
              {enProgreso.map((analysis: any) => {
                const cfg = STATUS_CONFIG[analysis.status] || STATUS_CONFIG['RUNNING']!;
                return (
                  <div key={analysis.id} className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                        <div>
                          <p className="text-xs text-[#6B7280]">{cfg.label}</p>
                          <p className="text-sm font-medium text-white">{analysis.projectName}</p>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-white">{analysis.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#2D2D2D] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.progress || 10}%` }}
                        style={{ backgroundColor: cfg.color }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* History */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-[#A0A0A0] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" /> Historial de éxitos
            </h2>
            {completados.length > 0 ? completados.map((analysis: any, idx: number) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-3.5 flex items-center justify-between hover:border-[#404040] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{analysis.projectName}</p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(analysis.createdAt).toLocaleDateString()} · {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#4B5563] group-hover:text-[#A0A0A0] transition-colors" />
              </motion.div>
            )) : (
              <div className="text-center py-12 border border-dashed border-[#2D2D2D] rounded-xl">
                <p className="text-sm text-[#4B5563]">Sin registros completados</p>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Failures */}
          <div className="bg-[#1E1E20] border border-[#EF4444]/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3">
              <h3 className="text-sm font-medium text-[#EF4444] flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> Anomalías
              </h3>
              <span className="text-sm font-semibold text-white">{fallidos.length}</span>
            </div>
            {fallidos.length > 0 ? fallidos.map((analysis: any) => (
              <div key={analysis.id} className="p-3 rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/10 space-y-1">
                <p className="text-sm font-medium text-white">{analysis.projectName}</p>
                <p className="text-xs text-[#EF4444]/70 font-mono line-clamp-2">
                  {analysis.error || 'ERROR: Motor de análisis offline'}
                </p>
              </div>
            )) : (
              <div className="text-center py-6">
                <CheckCircle className="w-5 h-5 text-[#22C55E] mx-auto mb-2" />
                <p className="text-xs text-[#22C55E]">Canales limpios</p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-[#1E1E20] border border-[#F97316]/15 rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#F97316] mb-2 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Protocolo
            </h3>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Los reportes se generan automáticamente tras completar las tres fases: Inspección, Detección de Vectores y Dictamen Final.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
