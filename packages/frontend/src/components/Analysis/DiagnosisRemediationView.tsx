import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Zap,
  BookOpen,
  Code2,
  Target,
  Activity,
  ArrowRight,
  ChevronRight,
  Shield,
  BarChart3,
  Eye,
} from 'lucide-react';
import type { Reporte } from '../../types/api';

interface DiagnosisRemediationViewProps {
  reporte: Reporte;
  onNavigateTo?: (tab: string) => void;
}

export default function DiagnosisRemediationView({ reporte, onNavigateTo }: DiagnosisRemediationViewProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  const getRiskColor = (score: number) => {
    if (score < 30) return { bg: 'bg-[#22C55E]', text: 'text-[#22C55E]', label: 'Bajo', bgLight: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/30' };
    if (score < 60) return { bg: 'bg-[#F97316]', text: 'text-[#F97316]', label: 'Medio', bgLight: 'bg-[#F97316]/10', border: 'border-[#F97316]/30' };
    if (score < 85) return { bg: 'bg-[#EAB308]', text: 'text-[#EAB308]', label: 'Alto', bgLight: 'bg-[#EAB308]/10', border: 'border-[#EAB308]/30' };
    return { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', label: 'Crítico', bgLight: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/30' };
  };

  const riskColor = getRiskColor(reporte.riskScore);

  const handleNavigate = (tab: string) => {
    if (onNavigateTo) {
      onNavigateTo(tab);
    }
  };

  return (
    <div className="space-y-12">
      {/* === DIAGNÓSTICO === */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#F97316]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Diagnóstico de Seguridad</h2>
            <p className="text-sm text-[#6B7280]">Evaluación completa del estado de seguridad</p>
          </div>
        </div>

        {/* Risk Score - HERO */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-2xl border-2 p-10 relative overflow-hidden ${riskColor.bgLight} ${riskColor.border}`}
        >
          <div className={`absolute inset-0 ${riskColor.bg} opacity-5 blur-3xl`} />

          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Score Circle */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" fill="none" stroke="#2D2D2D" strokeWidth="12" />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="88"
                      fill="none"
                      stroke={riskColor.bg.replace('bg-', '')}
                      strokeWidth="12"
                      strokeDasharray={2 * Math.PI * 88}
                      initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
                      animate={{ strokeDashoffset: (2 * Math.PI * 88 * (100 - reporte.riskScore)) / 100 }}
                      transition={{ duration: 2, ease: 'easeOut' }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white">{Math.round(reporte.riskScore)}</span>
                    <span className="text-sm text-[#6B7280]">/100</span>
                    <span className={`text-xs font-bold mt-2 px-3 py-1 rounded ${riskColor.bg}/20 ${riskColor.text} border border-current border-opacity-30`}>
                      {riskColor.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Desglose de Score</h3>

                <div className="space-y-3">
                  {[
                    { icon: AlertCircle, label: 'Hallazgos críticos', value: reporte.severityBreakdown?.['CRITICAL'] || 0, color: 'text-[#EF4444]' },
                    { icon: Zap, label: 'Hallazgos altos', value: reporte.severityBreakdown?.['HIGH'] || 0, color: 'text-[#F97316]' },
                    { icon: Activity, label: 'Funciones comprometidas', value: reporte.compromisedFunctions?.length || 0, color: 'text-[#EAB308]' },
                    { icon: Eye, label: 'Entidades afectadas', value: reporte.affectedAuthors?.length || 0, color: 'text-[#6B7280]' },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-[#1C1C1E] rounded-lg border border-[#2D2D2D]">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className="text-sm text-[#94A3B8]">{label}</span>
                      </div>
                      <span className={`text-lg font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Executive Summary - Structured */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl bg-gradient-to-br from-[#1E1E20] via-[#1C1C1E] to-[#1A1A1C] border-2 border-[#2D2D2D] p-8 lg:p-10 space-y-6 hover:border-[#F97316]/30 transition-colors"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#F97316]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Síntesis Ejecutiva</h3>
              <p className="text-xs text-[#6B7280] mt-1">Hallazgos clave y estado de seguridad</p>
            </div>
          </div>

          {/* Main Summary */}
          <div className="text-sm leading-relaxed text-[#94A3B8]">
            {reporte.executiveSummary ? (
              reporte.executiveSummary.split('\n\n').slice(0, 2).map((paragraph: string, idx: number) => (
                <p key={idx} className="mb-4">
                  {paragraph.trim()}
                </p>
              ))
            ) : (
              <p>No hay resumen disponible</p>
            )}
          </div>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-[#2D2D2D]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-3 rounded-lg bg-[#1C1C1E] border border-[#EF4444]/20"
            >
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Críticos</p>
              <p className="text-xl font-bold text-[#EF4444]">{reporte.severityBreakdown?.['CRITICAL'] || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="p-3 rounded-lg bg-[#1C1C1E] border border-[#F97316]/20"
            >
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Altos</p>
              <p className="text-xl font-bold text-[#F97316]">{reporte.severityBreakdown?.['HIGH'] || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 rounded-lg bg-[#1C1C1E] border border-[#EAB308]/20"
            >
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Medios</p>
              <p className="text-xl font-bold text-[#EAB308]">{reporte.severityBreakdown?.['MEDIUM'] || 0}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="p-3 rounded-lg bg-[#1C1C1E] border border-[#22C55E]/20"
            >
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Bajos</p>
              <p className="text-xl font-bold text-[#22C55E]">{reporte.severityBreakdown?.['LOW'] || 0}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* 3 Metric Cards - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => handleNavigate('hallazgos')}
            className="p-6 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] hover:border-[#EF4444]/40 hover:bg-[#EF4444]/5 transition-all group text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#EF4444] transition-colors" />
            </div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Total Hallazgos</p>
            <p className="text-3xl font-bold text-white">{reporte.findingsCount}</p>
            <p className="text-xs text-[#6B7280] mt-2">Haz clic para ver amenazas</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => handleNavigate('gestor')}
            className="p-6 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] hover:border-[#F97316]/40 hover:bg-[#F97316]/5 transition-all group text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Code2 className="w-5 h-5 text-[#F97316]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#F97316] transition-colors" />
            </div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Archivos Escaneados</p>
            <p className="text-3xl font-bold text-white">1</p>
            <p className="text-xs text-[#6B7280] mt-2">Haz clic para ver IR</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => handleNavigate('timeline')}
            className="p-6 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/5 transition-all group text-left"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#EAB308]/10 border border-[#EAB308]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5 text-[#EAB308]" />
              </div>
              <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#EAB308] transition-colors" />
            </div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Eventos Forenses</p>
            <p className="text-3xl font-bold text-white">0</p>
            <p className="text-xs text-[#6B7280] mt-2">Haz clic para ver timeline</p>
          </motion.button>
        </div>
      </section>

      {/* === REMEDIACIÓN === */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Plan de Remediación</h2>
            <p className="text-sm text-[#6B7280]">Estrategia estructurada para eliminar vulnerabilidades</p>
          </div>
        </div>

        {/* General Recommendation - Structured Layout */}
        {reporte.generalRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-gradient-to-br from-[#22C55E]/10 via-[#16A34A]/5 to-[#15803D]/5 border-2 border-[#22C55E]/30 p-8 lg:p-10 space-y-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#22C55E]/5 to-transparent opacity-50" />

            <div className="relative z-10">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-[#22C55E]/20 border border-[#22C55E]/40 flex items-center justify-center">
                    <Target className="w-6 h-6 text-[#22C55E]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Plan de Mitigación General</h3>
                  <p className="text-xs text-[#6B7280] mt-1">Estrategia integral de remediación</p>
                </div>
              </div>

              {/* Parse recommendation into actionable items */}
              <div className="space-y-3">
                {reporte.generalRecommendation
                  .split(/\n(?=\(?\d+\)?\.|\(?\d+\)|[-•])/)
                  .filter((line: string) => line.trim().length > 15)
                  .map((recommendation: string, idx: number) => {
                    const cleanText = recommendation
                      .replace(/^\s*\(?\d+\)?\.?\s*/, '')
                      .replace(/^[-•]\s*/, '')
                      .trim();

                    return (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-6 h-6 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[#111111]">{idx + 1}</span>
                          </div>
                        </div>
                        <p className="text-sm text-[#94A3B8] leading-relaxed flex-1">
                          {cleanText}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Remediation Steps - Organized by Priority */}
        {reporte.remediationSteps && Array.isArray(reporte.remediationSteps) && reporte.remediationSteps.length > 0 ? (
          <div className="space-y-6">
            {/* Steps Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-[#EF4444]/5 border border-[#EF4444]/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Críticas</p>
                <p className="text-2xl font-bold text-[#EF4444]">
                  {reporte.remediationSteps.filter((s: any) => {
                    const urgency = (s.urgency || s.urgencia || 'MEDIUM').toUpperCase();
                    return urgency.includes('CRITICAL') || urgency.includes('URGENTE');
                  }).length}
                </p>
              </div>
              <div className="rounded-xl bg-[#F97316]/5 border border-[#F97316]/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Altas</p>
                <p className="text-2xl font-bold text-[#F97316]">
                  {reporte.remediationSteps.filter((s: any) => {
                    const urgency = (s.urgency || s.urgencia || 'MEDIUM').toUpperCase();
                    return urgency.includes('HIGH') && !urgency.includes('CRITICAL');
                  }).length}
                </p>
              </div>
              <div className="rounded-xl bg-[#22C55E]/5 border border-[#22C55E]/20 p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2">Totales</p>
                <p className="text-2xl font-bold text-[#22C55E]">{reporte.remediationSteps.length}</p>
              </div>
            </div>

            {/* Steps List - Interactive */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Pasos de Acción Detallados
              </h3>

              <div className="space-y-3">
                {reporte.remediationSteps.slice(0, 10).map((step: any, idx: number) => {
                  const urgency = (step.urgency || step.urgencia || 'MEDIUM').toUpperCase();
                  const isUrgent = urgency.includes('CRITICAL') || urgency.includes('URGENTE');
                  const isHigh = urgency.includes('HIGH') || urgency.includes('ALTO');

                  const urgencyColor = isUrgent
                    ? { bg: 'bg-[#EF4444]/10', border: 'border-[#EF4444]/30', text: 'text-[#EF4444]', accent: 'bg-[#EF4444]', light: 'bg-[#EF4444]/5' }
                    : isHigh
                    ? { bg: 'bg-[#F97316]/10', border: 'border-[#F97316]/30', text: 'text-[#F97316]', accent: 'bg-[#F97316]', light: 'bg-[#F97316]/5' }
                    : { bg: 'bg-[#22C55E]/10', border: 'border-[#22C55E]/30', text: 'text-[#22C55E]', accent: 'bg-[#22C55E]', light: 'bg-[#22C55E]/5' };

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`rounded-xl border-2 overflow-hidden transition-all ${
                        activeStep === idx
                          ? `${urgencyColor.border} ${urgencyColor.bg} shadow-lg`
                          : `border-[#2D2D2D] hover:${urgencyColor.border} bg-[#1E1E20]`
                      }`}
                    >
                      <button
                        onClick={() => setActiveStep(activeStep === idx ? null : idx)}
                        className="w-full p-4 lg:p-5 text-left hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Step Number and Title */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`w-8 h-8 rounded-lg ${urgencyColor.accent} text-white font-bold flex items-center justify-center flex-shrink-0 ${activeStep === idx ? 'scale-110' : ''} transition-transform`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-white mb-1 break-words">{step.action || step.accion || 'Sin título'}</h4>
                              <p className="text-xs text-[#6B7280]">{step.type || 'Acción de remediación'}</p>
                            </div>
                          </div>

                          {/* Right: Priority Badge and Indicator */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${urgencyColor.text} ${urgencyColor.light} border border-current border-opacity-30 whitespace-nowrap`}>
                              {isUrgent ? '🔴 CRÍTICA' : isHigh ? '🟠 ALTA' : '🟢 MEDIA'}
                            </div>
                            <ChevronRight className={`w-4 h-4 text-[#6B7280] transition-transform ${activeStep === idx ? 'rotate-90' : ''}`} />
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {activeStep === idx && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3"
                            >
                              <div>
                                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Descripción</p>
                                <p className="text-sm text-[#94A3B8] leading-relaxed">
                                  {step.justification || step.justificacion || step.description || 'Sin descripción disponible'}
                                </p>
                              </div>

                              {step.expectedOutcome && (
                                <div>
                                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Resultado Esperado</p>
                                  <p className="text-sm text-[#94A3B8]">{step.expectedOutcome}</p>
                                </div>
                              )}

                              {(step.estimatedEffort || step.timeframe) && (
                                <div className="flex gap-4 pt-2">
                                  {step.estimatedEffort && (
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Esfuerzo</p>
                                      <p className="text-sm text-white">{step.estimatedEffort}</p>
                                    </div>
                                  )}
                                  {step.timeframe && (
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Plazo</p>
                                      <p className="text-sm text-white">{step.timeframe}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 rounded-xl bg-[#22C55E]/5 border-2 border-[#22C55E]/30 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#22C55E] mx-auto" />
            <p className="text-sm text-[#22C55E] font-semibold">No hay pasos de remediación requeridos</p>
            <p className="text-xs text-[#6B7280]">El análisis de seguridad no ha identificado vulnerabilidades críticas</p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white font-bold rounded-lg hover:from-[#16A34A] hover:to-[#15803D] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#22C55E]/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            Comenzar Remediación
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNavigate('hallazgos')}
            className="flex-1 px-6 py-3 bg-[#1E1E20] text-white font-bold rounded-lg border-2 border-[#2D2D2D] hover:border-[#F97316]/40 transition-all flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Ver Amenazas
          </motion.button>
        </div>
      </section>
    </div>
  );
}