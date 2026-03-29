import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Terminal, 
  ShieldAlert, 
  Activity, 
  Users, 
  FileSearch, 
  History, 
  Wrench,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { EventoTimeline } from '../../types/timeline';
import Button from '../ui/Button';
import ForensicTimeline from '../Timeline/ForensicTimeline';
import FindingsTracker from '../Dashboard/FindingsTracker';
import AnalysisReport from '../Analysis/AnalysisReport';
import FindingsPanel from '../Analysis/FindingsPanel';
import RiskScoreGauge from '../Analysis/RiskScoreGauge';
import { usePdfExport } from '../../hooks/usePdfExport';

export default function ReportViewer() {
  const { projectId, analysisId } = useParams<{ projectId: string; analysisId: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { exportToPdf, isExporting } = usePdfExport();

  if (!analysisId) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="bg-[#0A0B10] border border-[#FF3B3B]/30 p-8 rounded-[2rem] text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#FF3B3B] mx-auto opacity-50" />
          <h2 className="text-white text-xl font-black uppercase tracking-tighter">Fallo de Sesión</h2>
          <p className="text-[#64748B] text-sm">El identificador de análisis no es válido o ha expirado.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4 text-[10px] font-black uppercase tracking-widest bg-[#111218] border border-[#1F2937]">Regresar</Button>
        </div>
      </div>
    );
  }

  const [seccionActiva, setSeccionActiva] = useState<
    'resumen' | 'hallazgos' | 'timeline' | 'remediacion' | 'gestor'
  >('resumen');

  const { data: reporte, isLoading: cargandoReporte } = useQuery({
    queryKey: ['report', analysisId],
    queryFn: () => apiService.obtenerReporte(analysisId),
  });

  const { data: hallazgos } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
  });

  const { data: eventosForenses } = useQuery({
    queryKey: ['forensics', analysisId],
    queryFn: () => apiService.obtenerEventosForenses(analysisId),
  });

  const eventosTimeline: EventoTimeline[] = (eventosForenses || []).map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    commit: e.commitHash,
    autor: e.author,
    archivo: e.file,
    funcion: e.function,
    accion: e.action,
    mensaje_commit: e.commitMessage,
    resumen_cambios: e.changesSummary,
    nivel_riesgo: e.riskLevel as any,
    indicadores_sospecha: e.suspicionIndicators,
    hallazgo_id: e.findingId,
  }));

  const descargarPDF = () => {
    exportToPdf('report-content', {
      filename: `reporte-coda-${analysisId}.pdf`,
      padding: 12,
    });
  };

  if (!reporte) {
    return (
      <div className="max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="hover:text-[#00D1FF] transition-colors flex items-center gap-2"
              >
                Directorio
              </button>
              <ChevronRight className="w-3 h-3 pt-0.5" />
              <span className="text-white">Observación en curso</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">Estado de Misión</h1>
            <p className="text-[#64748B] text-sm font-medium">Sincronización de agentes de seguridad en tiempo real.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} className="rounded-xl px-6 border-[#1F2937] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <ArrowLeft className="w-3 h-3" />
            Recuperar Perímetro
          </Button>
        </div>
        <AnalysisReport analysisId={analysisId} />
      </div>
    );
  }

  const KPI_STATS = [
    { label: 'Hallazgos', value: reporte.findingsCount, icon: ShieldAlert, color: 'text-[#FF3B3B]' },
    { label: 'Amenaza Score', value: reporte.riskScore, icon: Activity, color: 'text-[#00D1FF]' },
    { label: 'Funciones', value: reporte.compromisedFunctions.length, icon: Zap, color: 'text-[#7000FF]' },
    { label: 'Entidades', value: reporte.affectedAuthors.length, icon: Users, color: 'text-[#00FF94]' },
  ];

  const SECCIONES = [
    { id: 'resumen', label: 'Diagnóstico', icon: Terminal, color: '#00D1FF' },
    { id: 'hallazgos', label: `Amenazas (${reporte.findingsCount})`, icon: ShieldAlert, color: '#FF3B3B' },
    { id: 'gestor', label: 'Visor IR', icon: FileSearch, color: '#FFD600' },
    { id: 'timeline', label: 'Forense', icon: History, color: '#7000FF' },
    { id: 'remediacion', label: 'Remediación', icon: Wrench, color: '#00FF94' },
  ] as const;

  return (
    <div id="report-content" ref={reportRef} className="max-w-7xl mx-auto px-6 space-y-12 pb-24 animate-in fade-in duration-1000">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-8">
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#00D1FF] transition-colors">CENTRAL</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">INTELIGENCIA DE AMENAZAS</span>
          </div>
          <div className="space-y-2">
             <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter">CODA REPORT</h1>
             <p className="text-[#475569] font-mono text-xs uppercase tracking-[0.3em] pl-1">ID: {analysisId.split('-')[0]}</p>
          </div>
        </div>
        <div className="flex gap-4">
            <Button
              className="bg-[#111218] border border-[#1F2937] text-white rounded-2xl px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:border-[#00D1FF] transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={descargarPDF}
              disabled={isExporting}
            >
              {isExporting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              {isExporting ? 'Generando...' : 'Extraer Protocolo (PDF)'}
            </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI_STATS.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0A0B10] border border-[#1F2937] rounded-[2rem] p-8 space-y-4 hover:border-[#374151] transition-all group"
          >
            <div className="flex justify-between items-center">
              <stat.icon className={`${stat.color} w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity`} />
              <div className="h-4 w-4 rounded bg-[#1F2937]/30" />
            </div>
            <div className="space-y-1">
               <p className="text-4xl font-black text-white tracking-tighter">{stat.value}</p>
               <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em]">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modern Tabs Navigation */}
      <div className="sticky top-6 z-40 bg-[#0A0B10]/80 backdrop-blur-2xl border border-[#1F2937] rounded-3xl p-1.5 flex gap-1 overflow-x-auto no-scrollbar shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccionActiva(s.id)}
            className={`flex-1 min-w-[120px] filter px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${
              seccionActiva === s.id
                ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                : 'text-[#475569] hover:text-white hover:bg-white/5'
            }`}
          >
            <s.icon className={`w-3.5 h-3.5 ${seccionActiva === s.id ? 'text-black' : 'opacity-40'}`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content Engine */}
      <AnimatePresence mode="wait">
        <motion.div
          key={seccionActiva}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="min-h-[400px]"
        >
          {/* DIAGNÓSTICO / RESUMEN */}
          {seccionActiva === 'resumen' && (
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-10">
                <section className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-10 lg:p-14 space-y-8 relative overflow-hidden">
                   {/* Background Decal */}
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Terminal className="w-32 h-32" />
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00D1FF]" />
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Síntesis Ejecutiva</h3>
                   </div>
                   
                   <p className="text-lg lg:text-xl text-[#94A3B8] leading-[1.7] font-medium border-l-2 border-[#1F2937] pl-10 py-2 italic selection:bg-[#00D1FF] selection:text-black">
                     {reporte.executiveSummary}
                   </p>
                </section>

                <section className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-10 space-y-8">
                   <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Vector de Riesgo Detallado</h3>
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#00FF94]" />
                        <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Compilación Certificada</span>
                     </div>
                   </div>
                   
                   <div className="grid gap-6">
                     {Object.entries(reporte.severityBreakdown).map(([sev, count]) => {
                       const colors: Record<string, string> = {
                         'CRITICAL': 'bg-[#FF3B3B]', 
                         'CRÍTICO': 'bg-[#FF3B3B]',
                         'HIGH': 'bg-[#FF8A00]', 
                         'ALTO': 'bg-[#FF8A00]',
                         'MEDIUM': 'bg-[#FFD600]', 
                         'MEDIO': 'bg-[#FFD600]',
                         'LOW': 'bg-[#00FF94]', 
                         'BAJO': 'bg-[#00FF94]'
                       };
                       const color = colors[sev.toUpperCase()] || 'bg-[#64748B]';
                       const percentage = (count / reporte.findingsCount) * 100;

                       return (
                         <div key={sev} className="space-y-2">
                           <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                             <span className="text-white">{sev}</span>
                             <span className="text-[#64748B]">{count} Hallazgos ({Math.round(percentage)}%)</span>
                           </div>
                           <div className="h-1 bg-[#111218] rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${percentage}%` }}
                               transition={{ duration: 1, delay: 0.3 }}
                               className={`h-full ${color}`}
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </section>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-start py-12 sticky top-32">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-[#00D1FF]/5 blur-3xl rounded-full scale-150 animate-pulse pointer-events-none" />
                    <RiskScoreGauge score={reporte.riskScore} size={280} strokeWidth={16} />
                 </div>
                 <div className="mt-12 text-center max-w-[240px] space-y-3">
                    <h4 className="text-2xl font-black text-white tracking-tighter">Indice de Amenaza</h4>
                    <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                      Este score integra vectores de código, historial Git y patrones de ejecución sospechosos.
                    </p>
                 </div>
              </div>
            </div>
          )}

          {/* AMENAZAS / HALLAZGOS */}
          {seccionActiva === 'hallazgos' && (
             <div className="space-y-6">
                <FindingsPanel analysisId={analysisId} />
             </div>
          )}

          {/* GESTOR DE HALLAZGOS */}
          {seccionActiva === 'gestor' && (
             <div className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-10 overflow-hidden min-h-[600px]">
               <FindingsTracker analysisId={analysisId} />
             </div>
          )}

          {/* TIMELINE FORENSE — React Flow */}
          {seccionActiva === 'timeline' && (
            <div className="rounded-[2.5rem] bg-[#050608] border border-[#1F2937] overflow-hidden min-h-[600px] relative">
              {eventosTimeline.length > 0 ? (
                <ForensicTimeline eventos={eventosTimeline} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                  <Activity className="w-12 h-12 text-[#1F2937]" />
                  <p className="text-[#64748B] text-xs font-black uppercase tracking-widest">No se detectaron eventos forenses relevantes</p>
                </div>
              )}
            </div>
          )}

          {/* REMEDIACIÓN */}
          {seccionActiva === 'remediacion' && (
            <div className="grid lg:grid-cols-12 gap-10">
               <div className="lg:col-span-12 space-y-10">
                 <section className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-10 lg:p-14 space-y-8">
                   <div className="flex items-center gap-3 text-[#00FF94]">
                      <Wrench className="w-5 h-5" />
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Plan de Mitigación Estratégico</h3>
                   </div>
                   <p className="text-xl text-[#94A3B8] leading-relaxed font-semibold">
                      {reporte.generalRecommendation}
                   </p>
                 </section>

                 <div className="grid md:grid-cols-2 gap-8">
                   {(reporte.remediationSteps as any[]).map((step, i) => (
                     <motion.div
                       key={i}
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                       className="bg-[#0A0B10] border border-[#1F2937] p-8 rounded-3xl space-y-6 hover:border-[#374151] transition-all"
                     >
                       <div className="flex justify-between items-start">
                         <div className="w-12 h-12 rounded-2xl bg-[#111218] border border-[#1F2937] flex items-center justify-center text-[#00FF94] font-black text-xl">
                           {step.order || i + 1}
                         </div>
                         {(step.urgency || step.urgencia) && (
                            <span className="text-[9px] font-black text-white uppercase tracking-widest px-3 py-1 rounded bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 shadow-[0_0_10px_rgba(255,59,59,0.1)]">
                               {step.urgency || step.urgencia}
                            </span>
                         )}
                       </div>
                       
                       <div className="space-y-4">
                         <h4 className="text-xl font-black text-white tracking-tight">{step.action || step.accion}</h4>
                         <p className="text-sm text-[#64748B] leading-relaxed font-medium">
                           {step.justification || step.justificacion}
                         </p>
                       </div>
                     </motion.div>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
