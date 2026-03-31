import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Download, AlertOctagon, Activity, Shield, Terminal, FileSearch, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import FindingsPanel from './FindingsPanel';
import RiskScoreGauge from './RiskScoreGauge';
import { useSocketEvents } from '../../hooks/useSocketEvents';

interface AnalysisReportProps {
  analysisId: string;
}

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'];

export default function AnalysisReport({ analysisId }: AnalysisReportProps) {
  const queryClient = useQueryClient();

  const { data: analysis, isLoading, error: queryError } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => apiService.obtenerAnalisis(analysisId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 3000;
      return TERMINAL_STATUSES.includes(status) ? false : 5_000;
    },
  });

  const { data: report } = useQuery({
    queryKey: ['report', analysisId],
    queryFn: () => apiService.obtenerReporte(analysisId),
    enabled: analysis?.status === 'COMPLETED',
  });

  useSocketEvents({
    onAnalysisStatusChanged: (data) => {
      if (data.analysisId === analysisId) {
        queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
      }
    },
    onAnalysisCompleted: (data) => {
      if (data.analysisId === analysisId) {
        queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
        queryClient.invalidateQueries({ queryKey: ['report', analysisId] });
      }
    },
    onAnalysisError: (data) => {
      if (data.analysisId === analysisId) {
        queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] });
      }
    },
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Error loading analysis') : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">Sincronizando Reporte...</span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-12 text-center flex flex-col items-center space-y-4">
        <AlertOctagon className="w-10 h-10 text-[#EF4444]" />
        <h3 className="text-white text-xl font-semibold">Falla de Protocolo</h3>
        <p className="text-[#64748B] text-sm max-w-sm mx-auto font-medium">
          {error || 'No se ha podido establecer comunicación con el núcleo de análisis.'}
        </p>
      </div>
    );
  }

  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-[#64748B]', bg: 'bg-[#242424]', label: 'En Espera' },
    RUNNING: { icon: Activity, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', label: 'Procesando' },
    INSPECTOR_RUNNING: { icon: FileSearch, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', label: 'Inspector Activo' },
    DETECTIVE_RUNNING: { icon: Shield, color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10', label: 'Detective Forense' },
    FISCAL_RUNNING: { icon: Terminal, color: 'text-[#F97316]', bg: 'bg-[#F97316]/10', label: 'Compilación Fiscal' },
    COMPLETED: { icon: CheckCircle2, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10', label: 'Finalizado' },
    ERROR: { icon: AlertOctagon, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: 'Error' },
    FAILED: { icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10', label: 'Fallo' },
    CANCELLED: { icon: AlertCircle, color: 'text-[#EAB308]', bg: 'bg-[#EAB308]/10', label: 'Cancelado' },
  };

  const config = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Header Section */}
      <div className="rounded-xl bg-[#1E1E20] border border-[#2D2D2D] p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-12 items-start justify-between">
          <div className="space-y-8 flex-1">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border border-[#2D2D2D] ${config.bg} ${config.color}`}>
                     <StatusIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#64748B]">Protocolo de Diagnóstico</span>
               </div>

               <div className="space-y-2">
                 <h2 className="text-3xl font-semibold text-white">
                   {config.label}
                 </h2>
                 <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#475569] font-mono font-bold uppercase tracking-widest">
                   {analysis.startedAt && <span>Iniciado {new Date(analysis.startedAt).toLocaleTimeString()}</span>}
                   {analysis.completedAt && <span> • Terminado {new Date(analysis.completedAt).toLocaleTimeString()}</span>}
                 </div>
               </div>
            </div>

            {/* Terminal Progress Monitor */}
            {analysis.status !== 'COMPLETED' && (
              <div className="space-y-4 max-w-md bg-[#1C1C1E] p-6 rounded-xl border border-[#2D2D2D]">
                <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest">
                  <span className="text-[#F97316]">Carga de Agentes</span>
                  <span className="text-white">{analysis.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#242424] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.progress}%` }}
                    className="h-full bg-[#F97316]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Risk Score Spotlight */}
          {analysis.status === 'COMPLETED' && report && (
            <div className="relative group">
               <RiskScoreGauge score={report.riskScore} size={220} strokeWidth={14} />
            </div>
          )}
        </div>
      </div>

      {/* Analysis Content */}
      <div className="space-y-10">
        {analysis.status === 'COMPLETED' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-10">
            {/* Executive Synthesis */}
            {report && (
              <div className="rounded-xl bg-[#1E1E20] border border-[#2D2D2D] p-8 lg:p-10 space-y-6">
                <div className="flex items-center gap-3 text-[#F97316]">
                  <Terminal className="w-4 h-4" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-white">Síntesis Ejecutiva de CODA</h3>
                </div>
                <p className="text-[#94A3B8] text-sm leading-relaxed font-medium whitespace-pre-line border-l-2 border-[#2D2D2D] pl-6 py-2">
                  {report.executiveSummary}
                </p>
              </div>
            )}

            {/* Tools Area */}
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-semibold text-white">Hallazgos Detectados</h3>
               <Button className="bg-[#1E1E20] border border-[#2D2D2D] text-white hover:border-white transition-all text-[10px] font-semibold uppercase tracking-widest px-6 py-2 rounded-xl" disabled={true}>
                 <Download className="w-3 h-3 mr-2" />
                 Extraer Reporte
               </Button>
            </div>

            <FindingsPanel analysisId={analysisId} />
          </motion.div>
        ) : (analysis.status === 'FAILED' || analysis.status === 'ERROR') ? (
          <div className="rounded-xl bg-[#1E1E20] border border-[#EF4444]/30 p-16 text-center space-y-6">
            <AlertOctagon className="w-16 h-16 text-[#EF4444]/40 mx-auto" />
            <div className="space-y-2">
               <h3 className="text-2xl font-semibold text-white">Interrupción Crítica</h3>
               <p className="text-[#64748B] max-w-md mx-auto font-medium">
                 {(analysis as { errorMessage?: string }).errorMessage
                   ? `El motor de análisis ha encontrado una excepción no controlada: ${(analysis as { errorMessage?: string }).errorMessage}`
                   : 'El análisis ha fallado. Puedes reintentarlo para volver a procesarlo.'}
               </p>
            </div>
            <button
              onClick={() =>
                apiService.reintentarAnalisis(analysisId).then(() =>
                  queryClient.invalidateQueries({ queryKey: ['analysis', analysisId] })
                )
              }
              className="px-4 py-2 bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] rounded-xl text-sm font-semibold hover:bg-[#F97316]/20 transition-all"
            >
              Reintentar análisis
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-[#1E1E20] border border-[#2D2D2D] p-24 text-center space-y-10 relative overflow-hidden">
             <div className="relative flex flex-col items-center space-y-8">
                <div className="relative">
                   <div className="w-24 h-24 rounded-full border border-[#F97316]/30 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full border border-t-[#F97316] animate-spin" />
                   </div>
                   <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#F97316]" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-white">Fase de Observación Activa</h3>
                  <p className="text-[#64748B] max-w-sm mx-auto font-medium leading-relaxed">
                    Nuestros agentes están extrayendo y validando vectores de riesgo. Este proceso técnico requiere precisión profunda.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-[9px] font-semibold uppercase tracking-widest text-[#475569]">
                   <span className="flex items-center gap-2 animate-pulse"><div className="w-1 h-1 rounded-full bg-[#22C55E]" /> Inspector</span>
                   <span className="flex items-center gap-2 animate-pulse [animation-delay:200ms]"><div className="w-1 h-1 rounded-full bg-[#6366F1]" /> Detective</span>
                   <span className="flex items-center gap-2 animate-pulse [animation-delay:400ms]"><div className="w-1 h-1 rounded-full bg-[#F97316]" /> Fiscal</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
