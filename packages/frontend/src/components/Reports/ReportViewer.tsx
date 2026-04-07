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
  Loader2,
  type LucideIcon,
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
import { useToast } from '../../hooks/useToast';

const ACTION_MAP: Record<string, 'AGREGADO' | 'MODIFICADO' | 'ELIMINADO'> = {
  ADDED: 'AGREGADO', MODIFIED: 'MODIFICADO', DELETED: 'ELIMINADO',
};
const RISK_MAP: Record<string, 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO'> = {
  LOW: 'BAJO', MEDIUM: 'MEDIO', HIGH: 'ALTO', CRITICAL: 'CRÍTICO',
};

const SEV_COLORS: Record<string, string> = {
  CRITICAL: '#EF4444', CRÍTICO: '#EF4444',
  HIGH:     '#FB923C', ALTO:    '#FB923C',
  MEDIUM:   '#EAB308', MEDIO:   '#EAB308',
  LOW:      '#22C55E', BAJO:    '#22C55E',
};

interface SeccionConfig {
  id: 'resumen' | 'hallazgos' | 'gestor' | 'timeline' | 'remediacion';
  label: string;
  icon: LucideIcon;
}

const SECCIONES: SeccionConfig[] = [
  { id: 'resumen',     label: 'Diagnóstico', icon: Terminal   },
  { id: 'hallazgos',   label: 'Amenazas',    icon: ShieldAlert },
  { id: 'gestor',      label: 'Visor IR',    icon: FileSearch  },
  { id: 'timeline',    label: 'Forense',     icon: History     },
  { id: 'remediacion', label: 'Remediación', icon: Wrench      },
];

export default function ReportViewer() {
  const { projectId, analysisId } = useParams<{ projectId: string; analysisId: string }>();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const { exportToPdf, isExporting } = usePdfExport();
  const toast = useToast();
  const [seccionActiva, setSeccionActiva] = useState<SeccionConfig['id']>('resumen');

  if (!analysisId) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center p-6">
        <div className="bg-[#1E1E20] border border-[#EF4444]/30 p-8 rounded-xl text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-[#EF4444] mx-auto opacity-60" />
          <h2 className="text-white text-lg font-semibold">ID de análisis inválido</h2>
          <p className="text-[#6B7280] text-sm">El identificador de análisis no es válido o ha expirado.</p>
          <Button onClick={() => navigate('/dashboard')} variant="secondary" className="mt-2">Regresar</Button>
        </div>
      </div>
    );
  }

  const { data: reporte } = useQuery({
    queryKey: ['report', analysisId],
    queryFn: () => apiService.obtenerReporte(analysisId),
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
  });

  const { data: proyecto } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiService.obtenerProyecto(projectId!),
    enabled: !!projectId,
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
  });

  const { data: hallazgos } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
  });

  const { data: eventosForenses } = useQuery({
    queryKey: ['forensics', analysisId],
    queryFn: () => apiService.obtenerEventosForenses(analysisId),
    staleTime: 0,
    refetchOnMount: 'stale',
    refetchOnWindowFocus: true,
  });

  const eventosTimeline: EventoTimeline[] = (eventosForenses || []).map((e) => ({
    id: e.id,
    timestamp: e.timestamp,
    commit: e.commitHash,
    autor: e.author,
    archivo: e.file,
    funcion: e.function,
    accion: ACTION_MAP[e.action] ?? 'MODIFICADO',
    mensaje_commit: e.commitMessage,
    resumen_cambios: e.changesSummary,
    nivel_riesgo: RISK_MAP[e.riskLevel] ?? 'BAJO',
    indicadores_sospecha: e.suspicionIndicators,
    hallazgo_id: e.findingId,
  }));

  const descargarPDF = () => {
    if (!proyecto || !reporte || !hallazgos || !analysisId) {
      toast.warning('Datos incompletos para exportar');
      return;
    }
    exportToPdf({ proyecto, reporte, hallazgos, analisisId: analysisId });
  };

  const [exportingCSV, setExportingCSV] = useState(false);
  const descargarCSV = async () => {
    if (!analysisId) return;
    setExportingCSV(true);
    try {
      await apiService.exportarHallazgosCSV(analysisId);
    } catch {
      toast.error('Error al exportar CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  if (!reporte) {
    return (
      <div className="max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-[#6B7280]">
              <button
                onClick={() => navigate('/dashboard')}
                className="hover:text-[#F97316] transition-colors flex items-center gap-1"
              >
                Dashboard
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Análisis en curso</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Estado del análisis</h1>
            <p className="text-sm text-[#6B7280]">Sincronización de agentes de seguridad en tiempo real.</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Regresar
          </Button>
        </div>
        <AnalysisReport analysisId={analysisId} />
      </div>
    );
  }

  const KPI_STATS: Array<{ label: string; value: string | number; icon: LucideIcon; color: string }> = [
    { label: 'Hallazgos',      value: reporte.findingsCount,              icon: ShieldAlert, color: '#EF4444' },
    { label: 'Risk Score',     value: reporte.riskScore,                  icon: Activity,    color: '#F97316' },
    { label: 'Funciones',      value: reporte.compromisedFunctions.length, icon: Zap,         color: '#6366F1' },
    { label: 'Entidades',      value: reporte.affectedAuthors.length,     icon: Users,       color: '#22C55E' },
  ];

  return (
    <div id="report-content" ref={reportRef} className="max-w-7xl mx-auto px-4 space-y-6 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            <button onClick={() => navigate('/dashboard')} className="hover:text-[#F97316] transition-colors">
              Dashboard
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white">Reporte de seguridad</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {proyecto?.name ?? 'Reporte'}
          </h1>
          <p className="text-xs text-[#4B5563] font-mono">{analysisId}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={descargarCSV}
            disabled={exportingCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:border-[#22C55E]/40 hover:text-[#22C55E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportingCSV ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {exportingCSV ? 'Exportando...' : 'CSV'}
          </button>
          <button
            onClick={descargarPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-[#F97316] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isExporting ? 'Generando...' : 'PDF'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPI_STATS.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 hover:border-[#404040] transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
              >
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">{stat.value}</p>
                <p className="text-xs text-[#6B7280]">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-4 z-40 bg-[#111111]/95 backdrop-blur-md border border-[#2D2D2D] rounded-xl p-1 flex gap-1 overflow-x-auto">
        {SECCIONES.map((s) => {
          const isActive = seccionActiva === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSeccionActiva(s.id)}
              className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/25'
                  : 'text-[#6B7280] hover:bg-[#1C1C1E] border border-transparent'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={seccionActiva}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="min-h-[400px]"
        >
          {/* DIAGNÓSTICO */}
          {seccionActiva === 'resumen' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-6">
                <section className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                    <h3 className="text-sm font-semibold text-white">Síntesis ejecutiva</h3>
                  </div>
                  <p className="text-base text-[#A0A0A0] leading-relaxed border-l-2 border-[#2D2D2D] pl-6 py-1">
                    {reporte.executiveSummary}
                  </p>
                </section>

                <section className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Vector de riesgo</h3>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                      <span className="text-xs text-[#6B7280]">Compilación certificada</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(reporte.severityBreakdown).map(([sev, count]) => {
                      const color = SEV_COLORS[sev.toUpperCase()] ?? '#6B7280';
                      const percentage = reporte.findingsCount > 0
                        ? (count / reporte.findingsCount) * 100
                        : 0;
                      return (
                        <div key={sev} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="text-white font-medium">{sev}</span>
                            <span className="text-[#6B7280]">{count} hallazgos ({Math.round(percentage)}%)</span>
                          </div>
                          <div className="h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ background: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center pt-4">
                <RiskScoreGauge score={reporte.riskScore} size={240} strokeWidth={14} />
                <div className="mt-6 text-center space-y-1">
                  <h4 className="text-base font-semibold text-white">Índice de amenaza</h4>
                  <p className="text-xs text-[#6B7280] leading-relaxed max-w-[200px]">
                    Integra vectores de código, historial Git y patrones sospechosos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* HALLAZGOS */}
          {seccionActiva === 'hallazgos' && (
            <FindingsPanel analysisId={analysisId} />
          )}

          {/* GESTOR */}
          {seccionActiva === 'gestor' && (
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 min-h-[600px]">
              <FindingsTracker analysisId={analysisId} />
            </div>
          )}

          {/* TIMELINE */}
          {seccionActiva === 'timeline' && (
            <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl overflow-hidden min-h-[600px] relative">
              {eventosTimeline.length > 0 ? (
                <ForensicTimeline eventos={eventosTimeline} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                  <Activity className="w-10 h-10 text-[#2D2D2D]" />
                  <p className="text-sm text-[#6B7280]">No se detectaron eventos forenses</p>
                </div>
              )}
            </div>
          )}

          {/* REMEDIACIÓN */}
          {seccionActiva === 'remediacion' && (
            <div className="space-y-6">
              <section className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-8 space-y-4">
                <div className="flex items-center gap-2 text-[#22C55E]">
                  <Wrench className="w-4 h-4" />
                  <h3 className="text-sm font-semibold text-white">Plan de mitigación</h3>
                </div>
                <p className="text-base text-[#A0A0A0] leading-relaxed">
                  {reporte.generalRecommendation}
                </p>
              </section>

              <div className="grid md:grid-cols-2 gap-4">
                {(reporte.remediationSteps || []).length > 0 ? (
                  reporte.remediationSteps.map((step, i) => {
                    const s = step as unknown as Record<string, string | number | undefined>;
                    const action = (s['action'] || s['accion'] || s['title'] || s['paso']) as string;
                    const justification = (s['justification'] || s['justificacion'] || s['description'] || s['descripcion']) as string;
                    const urgency = (s['urgency'] || s['urgencia'] || s['prioridad'] || 'Normal') as string;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-4 hover:border-[#404040] transition-all"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E] font-semibold text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-md border flex-shrink-0 ${
                            urgency?.toUpperCase().includes('URGENTE') || urgency?.toUpperCase().includes('CRITICAL')
                              ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
                              : urgency?.toUpperCase().includes('ALTO') || urgency?.toUpperCase().includes('HIGH')
                              ? 'bg-[#F97316]/10 border-[#F97316]/20 text-[#F97316]'
                              : 'bg-[#6B7280]/10 border-[#6B7280]/20 text-[#A0A0A0]'
                          }`}>
                            {urgency || 'Normal'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {action && (
                            <h4 className="text-base font-semibold text-white leading-snug break-words">
                              {action}
                            </h4>
                          )}
                          {justification && (
                            <p className="text-sm text-[#6B7280] leading-relaxed break-words">
                              {justification}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-[#6B7280]">No hay pasos de remediación disponibles</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
