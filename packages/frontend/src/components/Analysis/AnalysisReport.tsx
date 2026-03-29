import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, Download, Info, AlertOctagon, Activity, Shield, Terminal, ChevronRight, FileSearch } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import FindingsPanel from './FindingsPanel';
import RiskScoreGauge from './RiskScoreGauge';

interface AnalysisReportProps {
  analysisId: string;
}

export default function AnalysisReport({ analysisId }: AnalysisReportProps) {
  const { data: analysis, isLoading, error: queryError } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => apiService.obtenerAnalisis(analysisId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 3000;
      const terminal = ['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'];
      return terminal.includes(status) ? false : 30_000;
    },
  });

  const { data: report } = useQuery({
    queryKey: ['report', analysisId],
    queryFn: () => apiService.obtenerReporte(analysisId),
    enabled: analysis?.status === 'COMPLETED',
  });
  
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Error loading analysis') : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-2 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Sincronizando Reporte...</span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="rounded-[2rem] border border-[#FF3B3B]/30 bg-[#FF3B3B]/5 p-12 text-center flex flex-col items-center space-y-4">
        <AlertOctagon className="w-10 h-10 text-[#FF3B3B]" />
        <h3 className="text-white text-xl font-black tracking-tighter">Falla de Protocolo</h3>
        <p className="text-[#64748B] text-sm max-w-sm mx-auto font-medium">
          {error || 'No se ha podido establecer comunicación con el núcleo de análisis.'}
        </p>
      </div>
    );
  }

  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-[#64748B]', bg: 'bg-[#111218]', label: 'En Espera' },
    RUNNING: { icon: Activity, color: 'text-[#00D1FF]', bg: 'bg-[#00D1FF]/10', label: 'Procesando' },
    INSPECTOR_RUNNING: { icon: FileSearch, color: 'text-[#00D1FF]', bg: 'bg-[#00D1FF]/10', label: 'Inspector Activo' },
    DETECTIVE_RUNNING: { icon: Shield, color: 'text-[#7000FF]', bg: 'bg-[#7000FF]/10', label: 'Detective Forense' },
    FISCAL_RUNNING: { icon: Terminal, color: 'text-[#00D1FF]', bg: 'bg-[#00D1FF]/10', label: 'Compilación Fiscal' },
    COMPLETED: { icon: CheckCircle2, color: 'text-[#00FF94]', bg: 'bg-[#00FF94]/10', label: 'Análisis Finalizado' },
    ERROR: { icon: AlertOctagon, color: 'text-[#FF3B3B]', bg: 'bg-[#FF3B3B]/10', label: 'Error Crítico' },
    FAILED: { icon: AlertTriangle, color: 'text-[#FF3B3B]', bg: 'bg-[#FF3B3B]/10', label: 'Fallo Operativo' },
    CANCELLED: { icon: AlertCircle, color: 'text-[#FFD600]', bg: 'bg-[#FFD600]/10', label: 'Abortado' },
  };

  const config = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Premium Header Section */}
      <div className="relative rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-2xl border border-white/[0.03] p-8 lg:p-12 overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] group">
        {/* Ambient Glow */}
        <div className={`absolute top-0 right-0 w-[600px] h-[600px] blur-[150px] opacity-[0.07] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 transition-colors duration-1000 ${config.bg.replace('/10', '')}`} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-start justify-between">
          <div className="space-y-8 flex-1">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border border-[#1F2937] ${config.bg} ${config.color}`}>
                     <StatusIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Protocolo de Diagnóstico</span>
               </div>
               
               <div className="space-y-2">
                 <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
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
              <div className="space-y-4 max-w-md bg-[#050505] p-6 rounded-2xl border border-[#1F2937]">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-[#00D1FF]">Carga de Agentes</span>
                  <span className="text-white">{analysis.progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#111218] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.progress}%` }}
                    className="h-full bg-gradient-to-r from-[#00D1FF] to-[#7000FF] shadow-[0_0_10px_#00D1FF66]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Risk Score Spotlight */}
          {analysis.status === 'COMPLETED' && report && (
            <div className="relative group">
               <div className="absolute inset-0 bg-[#00FF94]/5 blur-3xl rounded-full animate-pulse pointer-events-none" />
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
              <div className="rounded-3xl bg-[#0A0B10] border border-[#1F2937] p-8 lg:p-10 space-y-6">
                <div className="flex items-center gap-3 text-[#00D1FF]">
                  <Terminal className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Síntesis Ejecutiva de CODA</h3>
                </div>
                <p className="text-[#94A3B8] text-sm leading-relaxed font-medium whitespace-pre-line border-l-2 border-[#1F2937] pl-6 py-2">
                  {report.executiveSummary}
                </p>
              </div>
            )}

            {/* Tools Area */}
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black text-white tracking-tighter">Hallazgos Detectados</h3>
               <Button className="bg-[#111218] border border-[#1F2937] text-white hover:border-white transition-all text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl" disabled={true}>
                 <Download className="w-3 h-3 mr-2" />
                 Extraer Reporte
               </Button>
            </div>

            <FindingsPanel analysisId={analysisId} />
          </motion.div>
        ) : (analysis as any).errorMessage ? (
          <div className="rounded-[2.5rem] bg-[#0A0B10] border border-[#FF3B3B]/30 p-16 text-center space-y-6">
            <AlertOctagon className="w-16 h-16 text-[#FF3B3B]/40 mx-auto" />
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-white tracking-tighter">Interrupción Crítica</h3>
               <p className="text-[#64748B] max-w-md mx-auto font-medium">
                 El motor de análisis ha encontrado una excepción no controlada: {(analysis as any).errorMessage}
               </p>
            </div>
          </div>
        ) : (
          <div className="rounded-[2.5rem] bg-[#0A0B10] border border-[#1F2937] p-24 text-center space-y-10 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00D1FF]/5 pointer-events-none" />
             
             <div className="relative flex flex-col items-center space-y-8">
                <div className="relative">
                   <div className="w-24 h-24 rounded-full border border-[#00D1FF]/30 flex items-center justify-center animate-spin-slow">
                      <div className="w-20 h-20 rounded-full border border-t-[#00D1FF] animate-spin" />
                   </div>
                   <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#00D1FF]" />
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-white tracking-tighter uppercase">Fase de Observación Activa</h3>
                  <p className="text-[#64748B] max-w-sm mx-auto font-medium leading-relaxed">
                    Nuestros agentes están extrayendo y validando vectores de riesgo. Este proceso técnico requiere precisión profunda.
                  </p>
                </div>

                <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-[#475569]">
                   <span className="flex items-center gap-2 animate-pulse"><div className="w-1 h-1 rounded-full bg-[#00FF94]" /> Inspector</span>
                   <span className="flex items-center gap-2 animate-pulse [animation-delay:200ms]"><div className="w-1 h-1 rounded-full bg-[#7000FF]" /> Detective</span>
                   <span className="flex items-center gap-2 animate-pulse [animation-delay:400ms]"><div className="w-1 h-1 rounded-full bg-[#00D1FF]" /> Fiscal</span>
                </div>
             </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
