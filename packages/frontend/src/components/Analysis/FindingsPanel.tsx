import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, AlertCircle, AlertOctagon, Info, ShieldAlert, FileCode, CheckCircle2, ChevronRight, Terminal, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api.service';
import type { Hallazgo } from '../../types/api';

interface FindingsPanelProps {
  analysisId: string;
}

interface SeverityConfig {
  icon: LucideIcon;
  color: string;
  borderColor: string;
  bgColor: string;
  label: string;
}

const SEVERITY_CONFIG: Record<string, SeverityConfig> = {
  'CRITICAL': {
    icon: AlertOctagon,
    color: 'text-[#EF4444]',
    borderColor: 'border-[#EF4444]/30',
    bgColor: 'bg-[#EF4444]/5',
    label: 'Crítico',
  },
  'HIGH': {
    icon: ShieldAlert,
    color: 'text-[#FB923C]',
    borderColor: 'border-[#FB923C]/30',
    bgColor: 'bg-[#FB923C]/5',
    label: 'Alto riesgo',
  },
  'MEDIUM': {
    icon: AlertCircle,
    color: 'text-[#EAB308]',
    borderColor: 'border-[#EAB308]/30',
    bgColor: 'bg-[#EAB308]/5',
    label: 'Medio',
  },
  'LOW': {
    icon: Info,
    color: 'text-[#22C55E]',
    borderColor: 'border-[#22C55E]/30',
    bgColor: 'bg-[#22C55E]/5',
    label: 'Bajo',
  },
};

// Mapa de normalización para soportar español e inglés viniendo de la API
const normalizeSeverity = (s: string): string => {
  const norm = (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('CRITIC')) return 'CRITICAL';
  if (norm.includes('HIGH') || norm.includes('ALTO')) return 'HIGH';
  if (norm.includes('MEDIUM') || norm.includes('MEDIO')) return 'MEDIUM';
  if (norm.includes('LOW') || norm.includes('BAJO')) return 'LOW';
  return 'MEDIUM';
};

export default function FindingsPanel({ analysisId }: FindingsPanelProps) {
  const { data: findings, isLoading, error } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280]">Cargando hallazgos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-8 text-center flex flex-col items-center space-y-3">
        <AlertOctagon className="w-8 h-8 text-[#EF4444]" />
        <p className="text-sm text-[#EF4444]">Error al cargar hallazgos</p>
      </div>
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-12 text-center flex flex-col items-center space-y-4">
        <div className="w-14 h-14 rounded-xl bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/20">
          <CheckCircle2 className="text-[#22C55E] w-7 h-7" />
        </div>
        <h3 className="text-white text-xl font-semibold">Perímetro asegurado</h3>
        <p className="text-[#6B7280] text-sm max-w-sm mx-auto">
          No se han detectado vectores de ataque conocidos.
        </p>
      </div>
    );
  }

  const findingsBySeverity = {
    'CRITICAL': findings.filter((f) => normalizeSeverity(f.severity) === 'CRITICAL'),
    'HIGH': findings.filter((f) => normalizeSeverity(f.severity) === 'HIGH'),
    'MEDIUM': findings.filter((f) => normalizeSeverity(f.severity) === 'MEDIUM'),
    'LOW': findings.filter((f) => normalizeSeverity(f.severity) === 'LOW'),
  };

  return (
    <div className="space-y-12">
      {/* Summary Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(findingsBySeverity).map(([severity, items]) => {
          const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
          return (
            <div
              key={severity}
              className={`group relative rounded-xl p-5 bg-[#1E1E20] border border-[#2D2D2D] transition-all hover:border-[#404040] overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 w-full h-[2px] opacity-20 group-hover:opacity-100 transition-opacity bg-current ${config.color}`} />
              
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                   <config.icon className={`${config.color} w-5 h-5 opacity-80`} />
                   <span className="text-[10px] font-semibold text-[#64748B] tracking-widest">{config.label}</span>
                </div>
                <p className="text-3xl font-semibold text-white">
                  {items.length}
                </p>
                <p className="text-[#6B7280] text-xs mt-1">Hallazgos</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Findings Inventory */}
      <div className="space-y-10">
        {Object.entries(findingsBySeverity).map(
          ([severity, items]) =>
            items.length > 0 && (
              <section key={severity} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].color.replace('text-', 'bg-')}`} />
                    {SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].label}
                  </h3>
                  <div className="h-px bg-[#2D2D2D] flex-1" />
                </div>

                <div className="grid gap-6">
                  {items.map((finding: Hallazgo) => {
                    const config = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG];
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={finding.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`rounded-xl border transition-all ${config.borderColor} ${config.bgColor} p-6 relative overflow-hidden group hover:border-opacity-60`}
                      >
                         {/* Side Accent */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-40 group-hover:opacity-100 transition-opacity ${config.color.replace('text-', 'bg-')}`} />
                         <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-6 min-w-0">
                               {/* Title & Location */}
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <div className={`p-1.5 rounded-lg bg-[#242424] border border-[#2D2D2D] ${config.color}`}>
                                        <Icon className="w-4 h-4" />
                                     </div>
                                     <h4 className="text-base font-semibold text-white">{finding.riskType}</h4>
                                     <div className="ml-auto flex items-center gap-2">
                                        <span className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest bg-[#111218] px-2 py-0.5 rounded border border-[#1F2937]">
                                           Confidencia {Math.round(finding.confidence * 100)}%
                                        </span>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-[#475569] font-mono">
                                     <FileCode className="w-3.5 h-3.5" />
                                     <span className="truncate">{finding.file}</span>
                                     {finding.lineRange && <span className="text-[#64748B]">@ L:{finding.lineRange}</span>}
                                  </div>
                               </div>

                               {/* Analysis */}
                               <div className="space-y-2">
                                  <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wide flex items-center gap-2">
                                     <Terminal className="w-3 h-3" /> Diagnóstico
                                  </p>
                                  <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                                     {finding.whySuspicious}
                                  </p>
                               </div>

                               {/* Remediation */}
                               <div className="bg-[#242424] rounded-lg p-4 border border-[#2D2D2D] space-y-3">
                                  <p className="text-xs font-medium text-[#22C55E] flex items-center gap-2">
                                     <CheckCircle2 className="w-3.5 h-3.5" /> Remediación
                                  </p>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {(Array.isArray(finding.remediationSteps) ? finding.remediationSteps : [finding.remediationSteps]).map((step, idx) => (
                                       <li key={idx} className="flex items-start gap-2 text-xs text-[#94A3B8] font-medium leading-relaxed">
                                          <ChevronRight className="w-3 h-3 text-[#22C55E] mt-0.5 flex-shrink-0" />
                                          {step}
                                       </li>
                                     ))}
                                  </ul>
                               </div>
                            </div>

                            {/* Code Snippet */}
                            {finding.codeSnippet && (
                               <div className="lg:w-[400px] flex-shrink-0 flex flex-col">
                                  <div className="bg-[#242424] rounded-t-xl border-x border-t border-[#2D2D2D] p-3 flex items-center gap-2">
                                     <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#EF4444]/40" />
                                        <div className="w-2 h-2 rounded-full bg-[#EAB308]/40" />
                                        <div className="w-2 h-2 rounded-full bg-[#22C55E]/40" />
                                     </div>
                                     <span className="text-[9px] font-bold text-[#475569] uppercase tracking-widest ml-2">Source Insight</span>
                                  </div>
                                  <pre className="flex-1 bg-[#1C1C1E] p-4 rounded-b-xl border border-[#2D2D2D] overflow-x-auto font-mono text-[11px] leading-relaxed group-hover:border-[#F97316]/20 transition-colors">
                                     <code className="text-[#94A3B8]">
                                       {finding.codeSnippet}
                                     </code>
                                  </pre>
                               </div>
                            )}
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )
        )}
      </div>
    </div>
  );
}
