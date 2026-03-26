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

  const bgColor = puntuacion >= 80
    ? 'bg-red-50 dark:bg-red-900/20'
    : puntuacion >= 60
    ? 'bg-orange-50 dark:bg-orange-900/20'
    : puntuacion >= 40
    ? 'bg-yellow-50 dark:bg-yellow-900/20'
    : 'bg-green-50 dark:bg-green-900/20';

  return (
    <div className="flex flex-col items-center">
      <div className={`w-40 h-40 rounded-full border-8 flex items-center justify-center ${bgColor} border-gray-200 dark:border-gray-700`}
        style={{ borderColor: color }}>
        <div className="text-center">
          <p className="text-4xl font-bold" style={{ color }}>
            {puntuacion}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">/ 100</p>
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold" style={{ color }}>
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
      <div className="flex justify-between items-start sm:items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={onVolver}>
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Reporte de Análisis
          </h1>
        </div>
        <Button variant="primary" onClick={descargarPDF}>
          <Download className="w-4 h-4" />
          Descargar PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl mb-2">🚨</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reporte.findingsCount}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Hallazgos</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reporte.riskScore}/100</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Puntuación</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reporte.compromisedFunctions.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Funciones</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl mb-2">👤</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reporte.affectedAuthors.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Autores</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-1 overflow-x-auto">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              onClick={() => setSeccionActiva(s.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                seccionActiva === s.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {s.label}
            </button>
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
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Resumen Ejecutivo</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{reporte.executiveSummary}</p>
              </Card>
              <Card>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Desglose por Severidad</h3>
                <div className="space-y-2">
                  {Object.entries(reporte.severityBreakdown).map(([sev, count]) => (
                    <div key={sev} className="flex items-center gap-3">
                      <BadgeRiesgo nivel={sev as any} size="sm" />
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / reporte.findingsCount) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-6 text-right">
                        {count as number}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
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
              <Card key={hallazgo.id}>
                <div className="flex justify-between items-start mb-2">
                  <BadgeRiesgo nivel={hallazgo.severity as any} size="sm" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Confianza: {Math.round(hallazgo.confidence * 100)}%
                  </span>
                </div>
                <p className="font-mono text-sm text-gray-900 dark:text-gray-100 mb-1">
                  {hallazgo.file}
                  {hallazgo.function && ` :: ${hallazgo.function}`}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{hallazgo.whySuspicious}</p>
                <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs">
                  <strong className="text-gray-700 dark:text-gray-300">Remediación:</strong>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    {hallazgo.remediationSteps.map((step, i) => (
                      <li key={i} className="text-gray-600 dark:text-gray-400">
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
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
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recomendación General</h3>
              <p className="text-gray-700 dark:text-gray-300">{reporte.generalRecommendation}</p>
            </Card>
            <div className="space-y-3">
              {(reporte.remediationSteps as any[]).map((step, i) => (
                <Card key={i}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {step.order || i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{step.action || step.accion}</p>
                      {(step.justification || step.justificacion) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {step.justification || step.justificacion}
                        </p>
                      )}
                    </div>
                    {(step.urgency || step.urgencia) && (
                      <BadgeRiesgo nivel={(step.urgency || step.urgencia) as any} size="sm" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
