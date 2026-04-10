/**
 * ExecutionHistory - Display past analysis executions
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, RotateCcw, Zap } from 'lucide-react';
import { analysesService, Analysis } from '../../services/analyses.service';
import { useToast } from '../../hooks/useToast';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';

interface ExecutionHistoryProps {
  projectId?: string;
  limit?: number;
  onRetry?: (analysisId: string) => void;
}

export default function ExecutionHistory({ projectId, limit = 10, onRetry }: ExecutionHistoryProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();
  const retryOperation = useAsyncOperation({
    loadingMessage: 'Reiniciando análisis...',
    successMessage: 'Análisis reiniciado',
    errorMessage: 'Error al reiniciar análisis',
  });

  useEffect(() => {
    loadHistory();
  }, [projectId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const result = await analysesService.getAnalysisHistory({
        projectId,
        limit,
        offset: 0,
      });
      setAnalyses(result.analyses);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Error al cargar historial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (analysisId: string) => {
    await retryOperation.execute(async () => {
      const result = await analysesService.retryAnalysis(analysisId);
      onRetry?.(result.analysis.id);
    });
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start?: Date | string, end?: Date | string): string => {
    if (!start || !end) return '—';
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    const seconds = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusConfig = (status: Analysis['status']) => {
    const configs = {
      COMPLETED: {
        icon: CheckCircle2,
        color: 'text-[#22C55E]',
        bgColor: 'bg-[#22C55E]/10',
        label: 'Completado',
      },
      FAILED: {
        icon: AlertCircle,
        color: 'text-[#EF4444]',
        bgColor: 'bg-[#EF4444]/10',
        label: 'Fallido',
      },
      CANCELLED: {
        icon: Clock,
        color: 'text-[#6B7280]',
        bgColor: 'bg-[#6B7280]/10',
        label: 'Cancelado',
      },
      RUNNING: {
        icon: Zap,
        color: 'text-[#F97316]',
        bgColor: 'bg-[#F97316]/10',
        label: 'En Progreso',
      },
      PENDING: {
        icon: Clock,
        color: 'text-[#A0A0A0]',
        bgColor: 'bg-[#A0A0A0]/10',
        label: 'Pendiente',
      },
    };
    return configs[status];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-5 h-5 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-dashed border-[#2D2D2D]">
        <Clock className="w-8 h-8 text-[#6B7280] mx-auto mb-2 opacity-50" />
        <p className="text-sm text-[#6B7280]">Sin historial de análisis</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#F97316]" />
        Historial de Ejecuciones
      </h3>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {analyses.map((analysis) => {
            const config = getStatusConfig(analysis.status);
            const Icon = config.icon;

            return (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-3 rounded-lg border transition-all ${
                  analysis.status === 'FAILED'
                    ? 'bg-[#EF4444]/5 border-[#EF4444]/20'
                    : 'bg-[#242424] border-[#2D2D2D] hover:border-[#3D3D3D]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 rounded ${config.bgColor} flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-white">{analysis.projectName || 'Análisis'}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${config.bgColor} ${config.color} font-medium`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7280]">
                        <span>{formatDate(analysis.createdAt)}</span>
                        {analysis.startTime && analysis.endTime && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(analysis.startTime, analysis.endTime)}</span>
                          </>
                        )}
                        {analysis.findingCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{analysis.findingCount} hallazgos</span>
                          </>
                        )}
                      </div>
                      {analysis.errorMessage && analysis.status === 'FAILED' && (
                        <p className="text-xs text-[#EF4444] mt-1 truncate">{analysis.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  {analysis.status === 'FAILED' && (
                    <button
                      onClick={() => handleRetry(analysis.id)}
                      disabled={retryOperation.isLoading}
                      className="p-1.5 rounded hover:bg-[#F97316]/20 text-[#F97316] transition-colors flex-shrink-0 disabled:opacity-50"
                      title="Reintentar análisis"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
