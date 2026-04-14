import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertOctagon, Info, ShieldAlert, FileCode, CheckCircle2, ChevronRight, ChevronLeft, Terminal, ChevronDown, AlertTriangle, Lightbulb, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';
import type { Hallazgo } from '../../types/api';
import SkeletonLoader from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import ExplainerChat from './ExplainerChat';
import { MessageSquare } from 'lucide-react';

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

const PAGE_SIZE = 20;

export default function FindingsPanel({ analysisId }: FindingsPanelProps) {
  const [page, setPage] = useState(1);
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [selectedFindingForState, setSelectedFindingForState] = useState<string | null>(null);
  const [activeChatFinding, setActiveChatFinding] = useState<{ id: string; riskType: string } | null>(null);
  const toast = useToast();

  const { data: findings, isLoading, error } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
    staleTime: 60 * 1000,
  });

  const toggleExpanded = (findingId: string) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(findingId)) {
      newExpanded.delete(findingId);
    } else {
      newExpanded.add(findingId);
    }
    setExpandedFindings(newExpanded);
  };

  if (isLoading) {
    return <SkeletonLoader type="card" count={3} className="mb-6" />;
  }

  if (error) {
    return (
      <EmptyState
        type="error"
        title="Error al cargar hallazgos"
        description="No se pudo cargar la información de los hallazgos. Por favor, intenta nuevamente."
        action={{
          label: 'Reintentar',
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <EmptyState
        type="no-data"
        title="Perímetro asegurado"
        description="No se han detectado vectores de ataque conocidos en este análisis."
        icon={<CheckCircle2 className="w-16 h-16 text-[#22C55E]" />}
      />
    );
  }

  const totalPages = Math.max(1, Math.ceil(findings.length / PAGE_SIZE));
  const paginated = findings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const findingsBySeverity = {
    'CRITICAL': paginated.filter((f) => normalizeSeverity(f.severity) === 'CRITICAL'),
    'HIGH': paginated.filter((f) => normalizeSeverity(f.severity) === 'HIGH'),
    'MEDIUM': paginated.filter((f) => normalizeSeverity(f.severity) === 'MEDIUM'),
    'LOW': paginated.filter((f) => normalizeSeverity(f.severity) === 'LOW'),
  };

  // Find the selected finding for state panel
  const selectedFinding = selectedFindingForState
    ? findings?.find(f => f.id === selectedFindingForState)
    : null;

  return (
    <div className="space-y-12">
      {/* Finding State Panel Modal */}
      <AnimatePresence>
        {selectedFinding && selectedFindingForState && (
          <FindingStatePanel
            hallazgoId={selectedFindingForState}
            riskType={selectedFinding.riskType}
            onClose={() => setSelectedFindingForState(null)}
          />
        )}
      </AnimatePresence>

      {/* AI Explainer Chat Sidebar */}
      <AnimatePresence>
        {activeChatFinding && (
          <ExplainerChat
            findingId={activeChatFinding.id}
            findingType={activeChatFinding.riskType}
            onClose={() => setActiveChatFinding(null)}
          />
        )}
      </AnimatePresence>

      {/* Summary Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(findingsBySeverity).map(([severity, items]) => {
          const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]!;
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
                    <span className={`w-2 h-2 rounded-full ${SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]!.color.replace('text-', 'bg-')}`} />
                    {SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]!.label}
                  </h3>
                  <div className="h-px bg-[#2D2D2D] flex-1" />
                </div>

                <div className="grid gap-6">
                  {items.map((finding: Hallazgo) => {
                    const config = SEVERITY_CONFIG[finding.severity as keyof typeof SEVERITY_CONFIG]!;
                    const Icon = config.icon;
                    const isExpanded = expandedFindings.has(finding.id);
                    const hasVulnerableCode = finding.vulnerableCode && finding.vulnerableCode.trim().length > 0;
                    const hasSolutionCode = finding.solutionCode && finding.solutionCode.trim().length > 0;
                    const hasRecommendation = finding.recommendation && finding.recommendation.trim().length > 0;

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
                         <div className="flex flex-col space-y-6">
                            {/* Header */}
                            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                               <div className="flex-1 space-y-6 min-w-0">
                                  {/* Title & Location */}
                                  <div className="space-y-2">
                                     <div className="flex items-center gap-3 flex-wrap">
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

                                  {/* Remediation Steps */}
                                  <div className="bg-[#242424] rounded-lg p-4 border border-[#2D2D2D] space-y-3">
                                     <p className="text-xs font-medium text-[#22C55E] flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Pasos de remediación
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

                            {/* Expandable Sections */}
                            <div className="space-y-3 pt-4 border-t border-[#2D2D2D]">
                               {/* Vulnerable Code */}
                               {hasVulnerableCode && (
                                  <div className="space-y-2">
                                     <button
                                        onClick={() => toggleExpanded(`vuln-${finding.id}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#EF4444]/40 hover:bg-[#2D2D2D] transition-all group/btn"
                                     >
                                        <span className="flex items-center gap-2 text-sm font-semibold text-[#EF4444]">
                                           <AlertTriangle className="w-4 h-4" />
                                           Código vulnerable
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedFindings.has(`vuln-${finding.id}`) ? 'rotate-180' : ''}`} />
                                     </button>
                                     <AnimatePresence>
                                        {expandedFindings.has(`vuln-${finding.id}`) && (
                                           <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="overflow-hidden"
                                           >
                                              <pre className="bg-[#1C1C1E] p-4 rounded-lg border border-[#2D2D2D] overflow-x-auto font-mono text-[11px] leading-relaxed text-[#94A3B8]">
                                                 <code>{finding.vulnerableCode}</code>
                                              </pre>
                                           </motion.div>
                                        )}
                                     </AnimatePresence>
                                  </div>
                               )}

                               {/* Solution Code */}
                               {hasSolutionCode && (
                                  <div className="space-y-2">
                                     <button
                                        onClick={() => toggleExpanded(`sol-${finding.id}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#22C55E]/40 hover:bg-[#2D2D2D] transition-all group/btn"
                                     >
                                        <span className="flex items-center gap-2 text-sm font-semibold text-[#22C55E]">
                                           <CheckCircle2 className="w-4 h-4" />
                                           Código corregido
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedFindings.has(`sol-${finding.id}`) ? 'rotate-180' : ''}`} />
                                     </button>
                                     <AnimatePresence>
                                        {expandedFindings.has(`sol-${finding.id}`) && (
                                           <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="overflow-hidden"
                                           >
                                              <pre className="bg-[#1C1C1E] p-4 rounded-lg border border-[#2D2D2D] overflow-x-auto font-mono text-[11px] leading-relaxed text-[#94A3B8]">
                                                 <code>{finding.solutionCode}</code>
                                              </pre>
                                           </motion.div>
                                        )}
                                     </AnimatePresence>
                                  </div>
                               )}

                               {/* Recommendation */}
                               {hasRecommendation && (
                                  <div className="space-y-2">
                                     <button
                                        onClick={() => toggleExpanded(`rec-${finding.id}`)}
                                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#F97316]/40 hover:bg-[#2D2D2D] transition-all group/btn"
                                     >
                                        <span className="flex items-center gap-2 text-sm font-semibold text-[#F97316]">
                                           <Lightbulb className="w-4 h-4" />
                                           Recomendaciones
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedFindings.has(`rec-${finding.id}`) ? 'rotate-180' : ''}`} />
                                     </button>
                                     <AnimatePresence>
                                        {expandedFindings.has(`rec-${finding.id}`) && (
                                           <motion.div
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: 'auto' }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="overflow-hidden"
                                           >
                                              <div className="bg-[#242424] p-4 rounded-lg border border-[#2D2D2D] text-sm text-[#94A3B8] leading-relaxed space-y-3">
                                                 {(finding.recommendation || '').split('\n').map((line, idx) => (
                                                    <p key={idx}>{line}</p>
                                                 ))}
                                              </div>
                                           </motion.div>
                                        )}
                                     </AnimatePresence>
                                  </div>
                               )}

                               {/* State Button */}
                               <div className="flex flex-col md:flex-row gap-3">
                                  <button
                                     onClick={() => setSelectedFindingForState(finding.id)}
                                     className="flex-1 px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] text-sm font-semibold text-[#6B7280] hover:text-white hover:bg-[#2D2D2D] transition-all flex items-center justify-center gap-2"
                                  >
                                     <AlertCircle className="w-4 h-4" />
                                     Cambiar estado
                                  </button>
                                  <button
                                     onClick={() => setActiveChatFinding({ id: finding.id, riskType: finding.riskType })}
                                     className="flex-1 px-4 py-3 rounded-lg bg-[#F97316]/10 border border-[#F97316]/30 text-sm font-semibold text-[#F97316] hover:bg-[#F97316]/20 hover:border-[#F97316]/50 transition-all flex items-center justify-center gap-2"
                                  >
                                     <MessageSquare className="w-4 h-4" />
                                     Explicar con IA
                                  </button>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            )
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#2D2D2D]">
          <span className="text-xs text-[#6B7280]">
            Página {page} de {totalPages} — {findings.length} hallazgos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-xs text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-xs text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
