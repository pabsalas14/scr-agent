import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Zap,
  BookOpen,
  Code2,
  Target,
  Activity,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import type { Reporte } from '../../types/api';

interface DiagnosisRemediationViewProps {
  reporte: Reporte;
}

export default function DiagnosisRemediationView({ reporte }: DiagnosisRemediationViewProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const getRiskColor = (score: number) => {
    if (score < 30) return { bg: 'bg-[#22C55E]', text: 'text-[#22C55E]', label: 'Bajo' };
    if (score < 60) return { bg: 'bg-[#F97316]', text: 'text-[#F97316]', label: 'Medio' };
    if (score < 85) return { bg: 'bg-[#EAB308]', text: 'text-[#EAB308]', label: 'Alto' };
    return { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', label: 'Crítico' };
  };

  const riskColor = getRiskColor(reporte.riskScore);

  return (
    <div className="space-y-8">
      {/* DIAGNÓSTICO */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Diagnóstico</h2>
            <p className="text-sm text-[#6B7280]">Estado de seguridad del proyecto</p>
          </div>
        </div>

        {/* Risk Score Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 p-8 relative overflow-hidden ${riskColor.bg}/10 border-[${riskColor.bg.match(/\[([^\]]+)\]/)?.[1]}]`}
        >
          {/* Background glow */}
          <div className={`absolute inset-0 ${riskColor.bg} opacity-5 blur-3xl`} />

          <div className="relative z-10 flex items-end justify-between gap-8">
            <div>
              <p className="text-sm font-semibold text-[#6B7280] uppercase mb-2">Score de amenaza</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white">{Math.round(reporte.riskScore)}</span>
                <span className="text-2xl text-[#6B7280]">/100</span>
              </div>
              <p className={`text-lg font-bold mt-2 ${riskColor.text}`}>{riskColor.label}</p>
            </div>

            {/* Progress indicator */}
            <div className="flex-1 max-w-xs">
              <div className="space-y-2">
                <div className="w-full h-3 bg-[#2D2D2D] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${reporte.riskScore}%` }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    className={`h-full ${riskColor.bg}`}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs text-[#6B7280]">
                  <span>Bajo</span>
                  <span>Medio</span>
                  <span>Alto</span>
                  <span className="text-right">Crítico</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Severity Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reporte.severityBreakdown &&
            Object.entries(reporte.severityBreakdown).map(([severity, count]) => {
              const severityColors: Record<string, { bg: string; text: string }> = {
                CRITICAL: { bg: 'bg-[#EF4444]/10', text: 'text-[#EF4444]' },
                HIGH: { bg: 'bg-[#F97316]/10', text: 'text-[#F97316]' },
                MEDIUM: { bg: 'bg-[#EAB308]/10', text: 'text-[#EAB308]' },
                LOW: { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]' },
              };

              const defaultColor = { bg: 'bg-[#22C55E]/10', text: 'text-[#22C55E]' };
              const colors = severityColors[severity] || defaultColor;

              return (
                <motion.div
                  key={severity}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl border border-[#2D2D2D] ${colors.bg}`}
                >
                  <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">{severity}</p>
                  <p className={`text-3xl font-bold ${colors.text}`}>{count}</p>
                  <p className="text-xs text-[#6B7280] mt-1">hallazgos</p>
                </motion.div>
              );
            })}
        </div>

        {/* Executive Summary */}
        <div className="rounded-xl bg-[#1E1E20] border border-[#2D2D2D] p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Resumen Ejecutivo
          </h3>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            {reporte.executiveSummary || 'No hay resumen disponible'}
          </p>
        </div>

        {/* Impact Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] space-y-3"
          >
            <div className="flex items-center gap-2 text-[#EF4444]">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Funciones afectadas</span>
            </div>
            <p className="text-3xl font-bold text-white">{reporte.compromisedFunctions?.length || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] space-y-3"
          >
            <div className="flex items-center gap-2 text-[#F97316]">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Total hallazgos</span>
            </div>
            <p className="text-3xl font-bold text-white">{reporte.findingsCount}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] space-y-3"
          >
            <div className="flex items-center gap-2 text-[#EAB308]">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase">Entidades afectadas</span>
            </div>
            <p className="text-3xl font-bold text-white">{reporte.affectedAuthors?.length || 0}</p>
          </motion.div>
        </div>
      </section>

      {/* REMEDIACIÓN */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Plan de Remediación</h2>
            <p className="text-sm text-[#6B7280]">Acciones recomendadas para remediar</p>
          </div>
        </div>

        {/* General Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-gradient-to-br from-[#22C55E]/10 to-[#16A34A]/5 border border-[#22C55E]/30 p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#22C55E] uppercase mb-2">Estrategia general</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">
                {reporte.generalRecommendation || 'No hay recomendación general disponible'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Remediation Steps */}
        {reporte.remediationSteps && Array.isArray(reporte.remediationSteps) && reporte.remediationSteps.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Pasos de remediación</h3>

            <div className="relative">
              {/* Vertical connector line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#22C55E] via-[#F97316] to-transparent" />

              <div className="space-y-4">
                {reporte.remediationSteps.slice(0, 10).map((step: any, idx: number) => {
                  const urgency = (step.urgency || step.urgencia || 'MEDIUM').toUpperCase();
                  const isUrgent = urgency.includes('CRITICAL') || urgency.includes('URGENTE');
                  const isHigh = urgency.includes('HIGH') || urgency.includes('ALTO');

                  const urgencyColor = isUrgent
                    ? { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/30', text: 'text-[#EF4444]' }
                    : isHigh
                    ? { bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/30', text: 'text-[#F97316]' }
                    : { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/30', text: 'text-[#22C55E]' };

                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                      className={`w-full pl-16 pr-4 py-4 rounded-xl border transition-all text-left ${
                        activeStep === idx
                          ? `${urgencyColor.border} ${urgencyColor.bg}`
                          : 'border-[#2D2D2D] hover:border-[#404040] bg-[#1E1E20]'
                      }`}
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-[#111111] ${urgencyColor.text.replace('text-', 'border-')} transition-all ${activeStep === idx ? 'scale-125' : ''}`} />

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-bold text-white">{idx + 1}.</span>
                            <h4 className="text-sm font-semibold text-white truncate">{step.action || step.accion || 'Sin título'}</h4>
                          </div>
                          {activeStep === idx && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="text-xs text-[#94A3B8] mb-2"
                            >
                              {step.justification || step.justificacion || step.description || 'Sin descripción'}
                            </motion.p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${urgencyColor.text} ${urgencyColor.bg} border border-current border-opacity-30`}>
                            {urgency.substring(0, 4)}
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform ${activeStep === idx ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/30 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm text-[#22C55E] font-semibold">No hay pasos adicionales de remediación</p>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-3 bg-[#22C55E] text-white font-semibold rounded-lg hover:bg-[#16A34A] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Iniciar remediación
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-3 bg-[#1E1E20] text-white font-semibold rounded-lg border border-[#2D2D2D] hover:border-[#404040] transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Ver detalles
          </motion.button>
        </div>
      </section>
    </div>
  );
}
