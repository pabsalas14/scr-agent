import { useState } from 'react';
import { AlertCircle, AlertOctagon, Info, ShieldAlert, Code2, CheckCircle2, ChevronDown, AlertTriangle, Lightbulb, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Hallazgo } from '../../types/api';
import FindingStatePanel from './FindingStatePanel';

interface RemediationPanelProps {
  findings: Hallazgo[];
  isLoading?: boolean;
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

const normalizeSeverity = (s: string): string => {
  const norm = (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (norm.includes('CRITIC')) return 'CRITICAL';
  if (norm.includes('HIGH') || norm.includes('ALTO')) return 'HIGH';
  if (norm.includes('MEDIUM') || norm.includes('MEDIO')) return 'MEDIUM';
  if (norm.includes('LOW') || norm.includes('BAJO')) return 'LOW';
  return 'MEDIUM';
};

export default function RemediationPanel({ findings, isLoading }: RemediationPanelProps) {
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set());
  const [selectedFinding, setSelectedFinding] = useState<Hallazgo | null>(null);
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);

  const toggleExpanded = (findingId: string) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(findingId)) {
      newExpanded.delete(findingId);
    } else {
      newExpanded.add(findingId);
    }
    setExpandedFindings(newExpanded);
  };

  // Group findings by severity
  const groupedByStatus = findings.reduce(
    (acc, f) => {
      const status = f.status || 'OPEN';
      if (!acc[status]) acc[status] = [];
      acc[status].push(f);
      return acc;
    },
    {} as Record<string, Hallazgo[]>
  );

  const statusOrder = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const sortedStatuses = statusOrder.filter((s) => groupedByStatus[s]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6B7280]">Cargando hallazgos para remediación...</p>
        </div>
      </div>
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-[#1E1E20] rounded-xl border border-[#2D2D2D]">
        <CheckCircle2 className="w-12 h-12 text-[#22C55E]" />
        <div className="text-center">
          <p className="text-base font-semibold text-white">No hay hallazgos para remediación</p>
          <p className="text-sm text-[#6B7280] mt-1">Todos los problemas han sido resueltos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedStatuses.map((status) => {
        const statusFindings = groupedByStatus[status] || [];
        const statusLabels: Record<string, string> = {
          OPEN: '🔴 Abiertos',
          IN_PROGRESS: '⏳ En Curso',
          RESOLVED: '✅ Resueltos',
          CLOSED: '🔒 Cerrados',
        };

        return (
          <motion.section
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="space-y-3">
              {/* Status Header */}
              <div className="flex items-center gap-2 px-2">
                <h3 className="text-sm font-semibold text-white">{statusLabels[status]}</h3>
                <span className="px-2 py-1 rounded-full bg-[#1E1E20] text-xs text-[#6B7280]">
                  {statusFindings.length}
                </span>
              </div>

              {/* Findings grouped by severity within this status */}
              {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => {
                const severityFindings = statusFindings.filter((f) => normalizeSeverity(f.severity) === severity);
                if (severityFindings.length === 0) return null;

                const config = (SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG['MEDIUM']) as SeverityConfig;
                const Icon = config.icon;

                return (
                  <div key={severity} className="space-y-2">
                    {severityFindings.map((finding) => {
                      const isExpanded = expandedFindings.has(finding.id);

                      return (
                        <motion.div
                          key={finding.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`border rounded-lg transition-all ${config.borderColor} ${config.bgColor}`}
                        >
                          <button
                            onClick={() => toggleExpanded(finding.id)}
                            className="w-full px-4 py-3 flex items-start justify-between hover:opacity-80 transition-opacity text-left"
                          >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`mt-0.5 ${config.color} flex-shrink-0`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-white truncate">{finding.riskType}</h4>
                                <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                                  {finding.file}:{finding.lineRange}
                                </p>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-current/10 px-4 py-3 space-y-3 overflow-hidden"
                              >
                                {/* Why Suspicious */}
                                <div>
                                  <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Diagnóstico</p>
                                  <p className="text-sm text-[#94A3B8]">{finding.whySuspicious}</p>
                                </div>

                                {/* Vulnerable Code */}
                                {finding.vulnerableCode && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#EF4444] uppercase mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Código Vulnerable
                                    </p>
                                    <pre className="bg-[#111111] p-2 rounded text-xs text-[#94A3B8] overflow-x-auto border border-[#2D2D2D]">
                                      <code>{finding.vulnerableCode}</code>
                                    </pre>
                                  </div>
                                )}

                                {/* Solution Code */}
                                {finding.solutionCode && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#22C55E] uppercase mb-1 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Código Solución
                                    </p>
                                    <pre className="bg-[#111111] p-2 rounded text-xs text-[#94A3B8] overflow-x-auto border border-[#2D2D2D]">
                                      <code>{finding.solutionCode}</code>
                                    </pre>
                                  </div>
                                )}

                                {/* Recommendation */}
                                {finding.recommendation && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#F97316] uppercase mb-1 flex items-center gap-1">
                                      <Lightbulb className="w-3 h-3" />
                                      Recomendación
                                    </p>
                                    <p className="text-sm text-[#94A3B8]">{finding.recommendation}</p>
                                  </div>
                                )}

                                {/* Remediation Steps */}
                                {finding.remediationSteps && finding.remediationSteps.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Pasos de Remediación</p>
                                    <ol className="space-y-1 text-sm">
                                      {finding.remediationSteps.map((step, idx) => (
                                        <li key={idx} className="text-[#94A3B8] flex gap-2">
                                          <span className="text-[#F97316] font-semibold flex-shrink-0">{idx + 1}.</span>
                                          <span>{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                )}

                                {/* Status Button */}
                                <button
                                  onClick={() => {
                                    setSelectedFinding(finding);
                                    setIsStateModalOpen(true);
                                  }}
                                  className="w-full py-2 px-3 bg-[#F97316]/10 hover:bg-[#F97316]/20 border border-[#F97316]/30 rounded text-xs font-semibold text-[#F97316] transition-colors"
                                >
                                  Marcar Estado
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.section>
        );
      })}

      {/* State Modal */}
      {selectedFinding && isStateModalOpen && (
        <FindingStatePanel
          hallazgoId={selectedFinding.id}
          currentState={(selectedFinding.status as any) || 'OPEN'}
          riskType={selectedFinding.riskType}
          onClose={() => {
            setIsStateModalOpen(false);
            setTimeout(() => setSelectedFinding(null), 300);
          }}
        />
      )}
    </div>
  );
}
