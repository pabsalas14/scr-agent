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
import { apiService } from '../../services/api.service';
import type { EventoTimeline } from '../../types/timeline';
import BadgeRiesgo from '../shared/BadgeRiesgo';
import TimelineViewer from '../Timeline/TimelineViewer';

interface ReportViewerProps {
  analysisId: string;
  onVolver: () => void;
}

/**
 * Gauge de puntuación de riesgo
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

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-32 h-32 rounded-full border-8 flex items-center justify-center"
        style={{ borderColor: color }}
      >
        <div className="text-center">
          <p className="text-3xl font-bold" style={{ color }}>
            {puntuacion}
          </p>
          <p className="text-xs text-gray-500">/ 100</p>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium" style={{ color }}>
        {puntuacion >= 80
          ? 'Riesgo CRÍTICO'
          : puntuacion >= 60
          ? 'Riesgo ALTO'
          : puntuacion >= 40
          ? 'Riesgo MEDIO'
          : 'Riesgo BAJO'}
      </p>
    </div>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="button-secondary py-1.5">
            ← Volver
          </button>
          <h2 className="text-xl font-bold text-gray-900">Reporte de Análisis</h2>
        </div>
        <button
          onClick={descargarPDF}
          className="button-primary flex items-center gap-2"
        >
          📄 Descargar PDF
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Hallazgos"
          valor={reporte.findingsCount}
          icono="🚨"
          color="red"
        />
        <StatCard
          label="Puntuación"
          valor={`${reporte.riskScore}/100`}
          icono="📊"
          color="orange"
        />
        <StatCard
          label="Funciones comprometidas"
          valor={reporte.compromisedFunctions.length}
          icono="⚠️"
          color="yellow"
        />
        <StatCard
          label="Autores afectados"
          valor={reporte.affectedAuthors.length}
          icono="👤"
          color="blue"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSeccionActiva(s.id)}
            className={`
              px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
              ${
                seccionActiva === s.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {s.label}
          </button>
        ))}
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
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="card bg-white p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Resumen Ejecutivo</h3>
                <p className="text-gray-700 leading-relaxed">{reporte.executiveSummary}</p>
              </div>
              <div className="card bg-white p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Desglose por Severidad</h3>
                <div className="space-y-2">
                  {Object.entries(reporte.severityBreakdown).map(([sev, count]) => (
                    <div key={sev} className="flex items-center gap-3">
                      <BadgeRiesgo nivel={sev as any} size="sm" />
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(count / reporte.findingsCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-6 text-right">
                        {count as number}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <GaugeRiesgo puntuacion={reporte.riskScore} />
            </div>
          </div>
        )}

        {/* HALLAZGOS */}
        {seccionActiva === 'hallazgos' && (
          <div className="space-y-3">
            {(hallazgos || []).map((hallazgo) => (
              <div key={hallazgo.id} className="card bg-white p-4">
                <div className="flex justify-between items-start mb-2">
                  <BadgeRiesgo nivel={hallazgo.severity as any} size="sm" />
                  <span className="text-xs text-gray-500">
                    Confianza: {Math.round(hallazgo.confidence * 100)}%
                  </span>
                </div>
                <p className="font-mono text-sm text-gray-800 mb-1">
                  {hallazgo.file}
                  {hallazgo.function && ` :: ${hallazgo.function}`}
                </p>
                <p className="text-sm text-gray-700 mb-2">{hallazgo.whySuspicious}</p>
                <div className="bg-gray-50 rounded p-2 text-xs">
                  <strong className="text-gray-600">Remediación:</strong>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {hallazgo.remediationSteps.map((step, i) => (
                      <li key={i} className="text-gray-600">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
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
          <div className="space-y-4">
            <div className="card bg-white p-5">
              <h3 className="font-semibold text-gray-800 mb-2">Recomendación General</h3>
              <p className="text-gray-700">{reporte.generalRecommendation}</p>
            </div>
            <div className="space-y-3">
              {(reporte.remediationSteps as any[]).map((step, i) => (
                <div key={i} className="card bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {step.order || i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{step.action || step.accion}</p>
                      {(step.justification || step.justificacion) && (
                        <p className="text-sm text-gray-600 mt-1">
                          {step.justification || step.justificacion}
                        </p>
                      )}
                    </div>
                    {(step.urgency || step.urgencia) && (
                      <BadgeRiesgo nivel={(step.urgency || step.urgencia) as any} size="sm" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  valor,
  icono,
}: {
  label: string;
  valor: string | number;
  icono: string;
  color: string;
}) {
  return (
    <div className="card bg-white p-4 text-center">
      <p className="text-2xl mb-1">{icono}</p>
      <p className="text-2xl font-bold text-gray-900">{valor}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
