/**
 * ============================================================================
 * ANALYSIS REPORT - Reporte completo de análisis
 * ============================================================================
 *
 * Componente que muestra el estado completo de un análisis,
 * progreso, y hallazgos encontrados.
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import FindingsPanel from './FindingsPanel';
import type { Analisis, EstadoAnalisis } from '../../types/api';

interface AnalysisReportProps {
  analysisId: string;
}

export default function AnalysisReport({ analysisId }: AnalysisReportProps) {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => apiService.obtenerAnalisis(analysisId),
    refetchInterval: isAutoRefreshing ? 3000 : false, // Auto-refresh cada 3s si está en progreso
    staleTime: 0,
  });

  // Detener auto-refresh cuando análisis se complete
  useEffect(() => {
    if (analysis && (analysis.status === 'COMPLETADO' || analysis.status === 'ERROR')) {
      setIsAutoRefreshing(false);
    }
  }, [analysis?.status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-4xl">⟳</div>
        <span className="ml-3 text-gray-400">Cargando análisis...</span>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-600/30 p-6">
        <p className="text-red-400">No se pudo cargar el análisis</p>
      </div>
    );
  }

  const statusConfig = {
    PENDIENTE: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-900/20', label: 'Pendiente' },
    RUNNING: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'En progreso' },
    MALICIA_RUNNING: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Inspector analizando...' },
    FORENSES_RUNNING: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Detective investigando...' },
    SINTESIS_RUNNING: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-900/20', label: 'Fiscal compilando reporte...' },
    COMPLETADO: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-900/20', label: 'Completado' },
    ERROR: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-900/20', label: 'Error' },
  };

  const config = statusConfig[analysis.status as keyof typeof statusConfig] || statusConfig.PENDIENTE;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Status Header */}
      <div className={`rounded-lg border p-6 ${config.bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 flex-1">
            <StatusIcon className={`${config.color} w-6 h-6 flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <h2 className={`${config.color} text-2xl font-bold`}>
                {config.label}
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                {analysis.startedAt && `Iniciado: ${new Date(analysis.startedAt).toLocaleString()}`}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex-shrink-0 text-right">
            <p className="text-3xl font-bold text-white">{analysis.progress}%</p>
            <p className="text-gray-400 text-sm">Progreso</p>
          </div>
        </div>

        {/* Progress Bar */}
        {analysis.status !== 'COMPLETADO' && analysis.status !== 'ERROR' && (
          <div className="mt-4 w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analysis.progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
            />
          </div>
        )}
      </div>

      {/* Error Message */}
      {analysis.status === 'ERROR' && (
        <div className="rounded-lg bg-red-900/20 border border-red-600/30 p-4">
          <p className="text-red-400 text-sm">
            <strong>Error:</strong> El análisis falló durante la ejecución.
          </p>
        </div>
      )}

      {/* Findings or Loading Message */}
      {analysis.status === 'COMPLETADO' ? (
        <>
          {/* Download Report Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              disabled={true}
            >
              <Download className="w-4 h-4" />
              Descargar PDF (próximamente)
            </Button>
          </div>

          {/* Findings Panel */}
          <FindingsPanel analysisId={analysisId} />
        </>
      ) : analysis.status === 'ERROR' ? (
        <div className="rounded-lg bg-gray-900/30 border border-gray-700/50 p-6 text-center">
          <p className="text-gray-400">
            El análisis no pudo completarse. Por favor, intenta de nuevo o verifica los logs.
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-900/30 border border-gray-700/50 p-6 text-center">
          <p className="text-gray-400 animate-pulse">
            Analizando código... Este proceso puede tomar algunos minutos.
          </p>
        </div>
      )}
    </motion.div>
  );
}
