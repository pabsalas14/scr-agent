/**
 * ============================================================================
 * REPORTE VIEWER
 * ============================================================================
 *
 * Vista del reporte completo de un análisis:
 * - Resumen ejecutivo con puntuación de riesgo
 * - Lista de hallazgos con filtros
 * - Timeline forense (D3.js)
 * - Prioridad de remediación
 * - Exportar PDF
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { EventoTimeline } from '../../types/timeline';
import Button from '../ui/Button';
import Card from '../ui/Card';
import BadgeRiesgo from '../shared/BadgeRiesgo';
import TimelineViewer from '../Timeline/TimelineViewer';

interface ReportViewerProps {
  analysisId: string;
  onVolver: () => void;
}

/**
 * Gauge de puntuación de riesgo - Rediseñado con colores vibrantes
 */
function GaugeRiesgo({ puntuacion }: { puntuacion: number }) {
  const color =
    puntuacion >= 80
      ? '#dc2626'
      : puntuacion >= 60
      ? '#ea580c'
      : puntuacion >= 40
      ? '#eab308'
      : '#22c55e';

  const bgGradient =
    puntuacion >= 80
      ? 'from-red-900/30 to-red-800/20'
      : puntuacion >= 60
      ? 'from-orange-900/30 to-orange-800/20'
      : puntuacion >= 40
      ? 'from-yellow-900/30 to-yellow-800/20'
      : 'from-green-900/30 to-green-800/20';

  const label =
    puntuacion >= 80
      ? 'CRÍTICO'
      : puntuacion >= 60
      ? 'ALTO'
      : puntuacion >= 40
      ? 'MEDIO'
      : 'BAJO';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center"
    >
      <div
        className={`w-48 h-48 rounded-full border-4 flex items-center justify-center bg-gradient-to-br ${bgGradient} shadow-2xl`}
        style={{ borderColor: color }}
      >
        <div className="text-center">
          <p className="text-5xl font-black" style={{ color }}>
            {puntuacion}
          </p>
          <p className="text-xs text-gray-400 mt-1">/ 100</p>
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-lg font-bold" style={{ color }}>
          Riesgo {label}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {puntuacion >= 80
            ? 'Requiere acción inmediata'
            : puntuacion >= 60
            ? 'Requiere atención pronta'
            : puntuacion >= 40
            ? 'Requiere revisión'
            : 'Bajo riesgo'}
        </p>
      </div>
    </motion.div>
  );
}

export default function ReportViewer({ analysisId, onVolver }: ReportViewerProps) {
  const [seccionActiva, setSeccionActiva] = useState<
    'resumen' | 'hallazgos' | 'timeline' | 'remediacion'
  >('resumen');

  /**
   * Cargar reporte
   */
  const { data: reporte, isLoading: cargandoReporte } = useQuery({
    queryKey: ['report', analysisId],
    queryFn: () => apiService.obtenerReporte(analysisId),
  });

  /**
   * Cargar hallazgos
   */
  const { data: hallazgos } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
  });

  /**
   * Cargar eventos forenses (para timeline)
   */
  const { data: eventosForenses } = useQuery({
    queryKey: ['forensics', analysisId],
    queryFn: () => apiService.obtenerEventosForenses(analysisId),
  });

  /**
   * Convertir eventos forenses al formato del timeline D3.js
   */
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

  /**
   * Descargar PDF
   */
  const descargarPDF = async () => {
    const blob = await apiService.descargarPDF(analysisId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-scr-${analysisId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (cargandoReporte) {
    return (
      <div className="flex justify-center py-20">
        <span className="text-gray-600">Cargando reporte...</span>
      </div>
    );
  }

  if (!reporte) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700">Reporte no disponible aún. El análisis puede estar en progreso.</p>
        <button onClick={onVolver} className="button-secondary mt-4">
          ← Volver
        </button>
      </div>
    );
  }

  const SECCIONES = [
    { id: 'resumen', label: '📋 Resumen' },
    { id: 'hallazgos', label: `🚨 Hallazgos (${reporte.findingsCount})` },
    { id: 'timeline', label: '⏱ Línea de tiempo' },
    { id: 'remediacion', label: '🔧 Remediación' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header con Breadcrumb */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button onClick={onVolver} className="hover:text-white transition-colors">
            Proyectos
          </button>
          <span>/</span>
          <span className="text-white">Análisis</span>
        </div>

        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-black text-white mb-1">Reporte de Seguridad</h1>
            <p className="text-gray-400">Análisis completo de vulnerabilidades y riesgos</p>
          </div>
          <Button variant="primary" onClick={descargarPDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards con colores vibrantes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Hallazgos</p>
                <p className="text-3xl font-black text-red-400 mt-1">{reporte.findingsCount}</p>
              </div>
              <div className="text-4xl opacity-30">🚨</div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Puntuación</p>
                <p className="text-3xl font-black text-blue-400 mt-1">{reporte.riskScore}</p>
                <p className="text-xs text-gray-500 mt-0.5">/ 100</p>
              </div>
              <div className="text-4xl opacity-30">📊</div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Funciones</p>
                <p className="text-3xl font-black text-purple-400 mt-1">{reporte.compromisedFunctions.length}</p>
              </div>
              <div className="text-4xl opacity-30">⚡</div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Autores</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{reporte.affectedAuthors.length}</p>
              </div>
              <div className="text-4xl opacity-30">👥</div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Tabs Mejorados con Colores Vibrantes */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700/50 p-1 shadow-lg">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'resumen', label: '📋 Resumen', color: '#0EA5E9' },
            { id: 'hallazgos', label: `🚨 Hallazgos (${reporte.findingsCount})`, color: '#EC4899' },
            { id: 'timeline', label: '⏱ Timeline', color: '#8B5CF6' },
            { id: 'remediacion', label: '🔧 Remediación', color: '#10B981' },
          ].map((s: any) => (
            <motion.button
              key={s.id}
              onClick={() => setSeccionActiva(s.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                seccionActiva === s.id
                  ? 'text-white border shadow-lg'
                  : 'text-gray-400 border border-transparent hover:text-gray-300'
              }`}
              style={{
                borderColor: seccionActiva === s.id ? s.color : 'transparent',
                backgroundColor: seccionActiva === s.id ? `${s.color}20` : 'transparent',
                color: seccionActiva === s.id ? s.color : undefined,
              }}
            >
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Contenido de cada sección */}
      <motion.div
        key={seccionActiva}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        {/* RESUMEN */}
        {seccionActiva === 'resumen' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="md:col-span-2 space-y-4">
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-2xl">📋</div>
                  <h3 className="font-bold text-white text-lg">Resumen Ejecutivo</h3>
                </div>
                <p className="text-gray-300 leading-relaxed text-base">{reporte.executiveSummary}</p>
              </Card>

              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-2xl">📊</div>
                  <h3 className="font-bold text-white text-lg">Desglose por Severidad</h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(reporte.severityBreakdown).map(([sev, count]) => (
                    <motion.div key={sev} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                      <BadgeRiesgo nivel={sev as any} size="sm" />
                      <div className="flex-1">
                        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(count / reporte.findingsCount) * 100}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-300 w-8 text-right">{count as number}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-center p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-gray-700/50">
              <GaugeRiesgo puntuacion={reporte.riskScore} />
            </div>
          </motion.div>
        )}

        {/* HALLAZGOS */}
        {seccionActiva === 'hallazgos' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {(hallazgos || []).map((hallazgo, idx) => (
              <motion.div
                key={hallazgo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="border-l-4" style={{ borderLeftColor:
                  hallazgo.severity === 'CRITICAL' ? '#dc2626' :
                  hallazgo.severity === 'HIGH' ? '#ea580c' :
                  hallazgo.severity === 'MEDIUM' ? '#eab308' : '#22c55e'
                }}>
                  <div className="flex justify-between items-start mb-3">
                    <BadgeRiesgo nivel={hallazgo.severity as any} size="sm" />
                    <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                      Confianza: {Math.round(hallazgo.confidence * 100)}%
                    </span>
                  </div>

                  <p className="font-mono text-sm text-cyan-400 mb-2 break-all">
                    {hallazgo.file}
                    {hallazgo.function && <span className="text-gray-400"> :: </span>}
                    {hallazgo.function && <span className="text-purple-400">{hallazgo.function}</span>}
                  </p>

                  <p className="text-sm text-gray-300 mb-3">{hallazgo.whySuspicious}</p>

                  <div className="bg-gray-800/50 rounded-lg p-3 text-xs border border-gray-700">
                    <p className="text-emerald-400 font-semibold mb-2">✅ Pasos de Remediación:</p>
                    <ul className="space-y-1">
                      {hallazgo.remediationSteps.map((step, i) => (
                        <li key={i} className="text-gray-300 flex gap-2">
                          <span className="text-gray-500 flex-shrink-0">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* TIMELINE */}
        {seccionActiva === 'timeline' && (
          <div>
            {eventosTimeline.length > 0 ? (
              <TimelineViewer
                eventos={eventosTimeline}
                onExportarPDF={descargarPDF}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                No hay eventos forenses disponibles
              </div>
            )}
          </div>
        )}

        {/* REMEDIACIÓN */}
        {seccionActiva === 'remediacion' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-white text-lg">Recomendación General</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">{reporte.generalRecommendation}</p>
            </Card>

            <div className="space-y-3">
              {(reporte.remediationSteps as any[]).map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-lg">
                        {step.order || i + 1}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-white text-base">{step.action || step.accion}</p>
                        {(step.justification || step.justificacion) && (
                          <p className="text-sm text-gray-400 mt-1">
                            {step.justification || step.justificacion}
                          </p>
                        )}
                      </div>
                      {(step.urgency || step.urgencia) && (
                        <div className="flex-shrink-0">
                          <BadgeRiesgo nivel={(step.urgency || step.urgencia) as any} size="sm" />
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
