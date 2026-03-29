import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, AlertCircle, AlertOctagon, Info, ShieldAlert, FileCode, CheckCircle2, ChevronRight, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiService } from '../../services/api.service';
import type { Hallazgo } from '../../types/api';

interface FindingsPanelProps {
  analysisId: string;
}

const SEVERITY_CONFIG = {
  'CRÍTICO': {
    icon: AlertOctagon,
    color: 'text-[#FF3B3B]',
    borderColor: 'border-[#FF3B3B]/30',
    bgColor: 'bg-[#FF3B3B]/5',
    label: 'CRITICAL',
  },
  'ALTO': {
    icon: ShieldAlert,
    color: 'text-[#FF8A00]',
    borderColor: 'border-[#FF8A00]/30',
    bgColor: 'bg-[#FF8A00]/5',
    label: 'HIGH RISK',
  },
  'MEDIO': {
    icon: AlertCircle,
    color: 'text-[#FFD600]',
    borderColor: 'border-[#FFD600]/30',
    bgColor: 'bg-[#FFD600]/5',
    label: 'MEDIUM',
  },
  'BAJO': {
    icon: Info,
    color: 'text-[#00FF94]',
    borderColor: 'border-[#00FF94]/30',
    bgColor: 'bg-[#00FF94]/5',
    label: 'LOW',
  },
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
        <div className="w-10 h-10 border-2 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Analizando Amenazas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-[#FF3B3B]/30 bg-[#FF3B3B]/5 p-8 text-center flex flex-col items-center space-y-4">
        <AlertOctagon className="w-8 h-8 text-[#FF3B3B]" />
        <p className="text-[#FF3B3B] text-xs font-black uppercase tracking-widest">Error de Sincronización</p>
      </div>
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-[2rem] border border-[#00FF94]/30 bg-[#00FF94]/5 p-12 text-center flex flex-col items-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#00FF94]/10 flex items-center justify-center border border-[#00FF94]/20 mb-4">
           <CheckCircle2 className="text-[#00FF94] w-8 h-8" />
        </div>
        <h3 className="text-white text-2xl font-black tracking-tighter">Perímetro Asegurado</h3>
        <p className="text-[#64748B] text-sm max-w-sm mx-auto font-medium">
          No se han detectado vectores de ataque conocidos. El código cumple con los protocolos de seguridad de CODA.
        </p>
      </div>
    );
  }

  const findingsBySeverity = {
    'CRÍTICO': findings.filter((f) => f.severity === 'CRÍTICO'),
    'ALTO': findings.filter((f) => f.severity === 'ALTO'),
    'MEDIO': findings.filter((f) => f.severity === 'MEDIO'),
    'BAJO': findings.filter((f) => f.severity === 'BAJO'),
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
              className={`group relative rounded-2xl p-6 bg-[#0A0B10] border border-[#1F2937] transition-all hover:border-[#374151] overflow-hidden`}
            >
              <div className={`absolute top-0 left-0 w-full h-[2px] opacity-20 group-hover:opacity-100 transition-opacity bg-current ${config.color}`} />
              
              <div className="relative z-10 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                   <config.icon className={`${config.color} w-5 h-5 opacity-80`} />
                   <span className="text-[10px] font-black text-[#64748B] tracking-widest">{config.label}</span>
                </div>
                <p className="text-4xl font-black text-white tracking-tighter">
                  {items.length}
                </p>
                <p className="text-[#475569] text-[9px] font-bold uppercase tracking-widest mt-1">Hallazgos</p>
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
                  <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].color.replace('text-', 'bg-')}`} />
                    {SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG].label}
                  </h3>
                  <div className="h-px bg-[#1F2937] flex-1" />
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
                        className={`rounded-[2rem] border transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] ${config.borderColor} ${config.bgColor} backdrop-blur-md p-8 relative overflow-hidden group`}
                      >
                         {/* Side Accent */}
                         <div className={`absolute left-0 top-0 bottom-0 w-1 opacity-40 group-hover:opacity-100 transition-opacity ${config.color.replace('text-', 'bg-')}`} />
                         <div className="flex flex-col lg:flex-row gap-8">
                            <div className="flex-1 space-y-6 min-w-0">
                               {/* Title & Location */}
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <div className={`p-1.5 rounded-lg bg-[#111218] border border-[#1F2937] ${config.color}`}>
                                        <Icon className="w-4 h-4" />
                                     </div>
                                     <h4 className="text-xl font-black text-white tracking-tight">{finding.riskType}</h4>
                                     <div className="ml-auto flex items-center gap-2">
                                        <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest bg-[#111218] px-2 py-0.5 rounded border border-[#1F2937]">
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
                                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] flex items-center gap-2">
                                     <Terminal className="w-3 h-3" /> Diagnóstico
                                  </p>
                                  <p className="text-sm text-[#94A3B8] leading-relaxed font-medium">
                                     {finding.whySuspicious}
                                  </p>
                               </div>

                               {/* Remediation */}
                               <div className="bg-[#050505]/40 rounded-2xl p-6 border border-[#1F2937]/50 space-y-4">
                                  <p className="text-[10px] font-black text-[#00FF94] uppercase tracking-[0.15em] flex items-center gap-2">
                                     <CheckCircle2 className="w-3 h-3" /> Protocolo de Remediación
                                  </p>
                                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                     {(Array.isArray(finding.remediationSteps) ? finding.remediationSteps : [finding.remediationSteps]).map((step, idx) => (
                                       <li key={idx} className="flex items-start gap-2 text-xs text-[#94A3B8] font-medium leading-relaxed">
                                          <ChevronRight className="w-3 h-3 text-[#00FF94] mt-0.5 flex-shrink-0" />
                                          {step}
                                       </li>
                                     ))}
                                  </ul>
                               </div>
                            </div>

                            {/* Code Snippet */}
                            {finding.codeSnippet && (
                               <div className="lg:w-[400px] flex-shrink-0 flex flex-col">
                                  <div className="bg-[#111218] rounded-t-xl border-x border-t border-[#1F2937] p-3 flex items-center gap-2">
                                     <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#FF3B3B]/40" />
                                        <div className="w-2 h-2 rounded-full bg-[#FFD600]/40" />
                                        <div className="w-2 h-2 rounded-full bg-[#00FF94]/40" />
                                     </div>
                                     <span className="text-[9px] font-bold text-[#475569] uppercase tracking-widest ml-2">Source Insight</span>
                                  </div>
                                  <pre className="flex-1 bg-[#050505] p-4 rounded-b-xl border border-[#1F2937] overflow-x-auto font-mono text-[11px] leading-relaxed group-hover:border-[#00D1FF]/30 transition-colors">
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
