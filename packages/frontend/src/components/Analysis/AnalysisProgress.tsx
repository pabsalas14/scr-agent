import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';
import { useConfirm } from '../../hooks/useConfirm';

interface AnalysisProgressProps {
  analysisId: string;
  projectName?: string;
  isActive?: boolean;
  progress?: number;
  status?: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startTime?: Date;
  estimatedTime?: number;
  onCancel?: (analysisId: string) => Promise<void>;
}

export default function AnalysisProgress({
  analysisId,
  projectName = 'Análisis',
  isActive = false,
  progress = 0,
  status = 'RUNNING',
  startTime,
  estimatedTime,
  onCancel,
}: AnalysisProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    if (!startTime || !isActive) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isActive]);

  const estimatedRemaining = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : null;

  const handleCancel = async () => {
    await confirm.confirm({
      title: 'Cancelar Análisis',
      message: '¿Estás seguro de que deseas cancelar este análisis en progreso?',
      confirmText: 'Cancelar Análisis',
      cancelText: 'Mantener',
      isDangerous: true,
      onConfirm: async () => {
        setIsCancelling(true);
        try {
          await onCancel?.(analysisId);
        } finally {
          setIsCancelling(false);
        }
      },
    });
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const statusConfig = {
    RUNNING: {
      icon: Zap,
      color: 'text-[#F97316]',
      bgColor: 'bg-[#F97316]/10',
      label: 'Analizando',
      dotColor: 'bg-[#F97316]',
    },
    COMPLETED: {
      icon: CheckCircle2,
      color: 'text-[#22C55E]',
      bgColor: 'bg-[#22C55E]/10',
      label: 'Completado',
      dotColor: 'bg-[#22C55E]',
    },
    FAILED: {
      icon: AlertCircle,
      color: 'text-[#EF4444]',
      bgColor: 'bg-[#EF4444]/10',
      label: 'Fallido',
      dotColor: 'bg-[#EF4444]',
    },
    CANCELLED: {
      icon: X,
      color: 'text-[#6B7280]',
      bgColor: 'bg-[#6B7280]/10',
      label: 'Cancelado',
      dotColor: 'bg-[#6B7280]',
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border ${
        isActive
          ? 'border-[#F97316]/30 bg-[#F97316]/5'
          : 'border-[#2D2D2D] bg-[#1E1E20]'
      } p-6 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{projectName}</h3>
            <p className={`text-sm ${config.color} font-medium flex items-center gap-1 mt-0.5`}>
              <span className={`w-2 h-2 rounded-full ${config.dotColor} ${isActive ? 'animate-pulse' : ''}`} />
              {config.label}
            </p>
          </div>
        </div>
        {isActive && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="p-2 rounded-lg hover:bg-[#242424] text-[#6B7280] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Cancelar análisis"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6B7280]">Progreso</span>
              <span className="font-semibold text-white">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-[#242424] rounded-full overflow-hidden border border-[#2D2D2D]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-[#F97316] to-[#EA6B1B] rounded-full"
              />
            </div>
          </div>

          {/* Time Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[#6B7280] uppercase font-semibold tracking-wider">Tiempo Transcurrido</p>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F97316]" />
                <p className="text-sm font-semibold text-white">{formatTime(elapsedTime)}</p>
              </div>
            </div>

            {estimatedRemaining !== null && (
              <div className="space-y-1">
                <p className="text-xs text-[#6B7280] uppercase font-semibold tracking-wider">Tiempo Restante</p>
                <p className="text-sm font-semibold text-white">{formatTime(estimatedRemaining)}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs text-[#6B7280] uppercase font-semibold tracking-wider">Velocidad</p>
              <p className="text-sm font-semibold text-white">
                {elapsedTime > 0 ? `${(progress / (elapsedTime / 60)).toFixed(1)}%/min` : '—'}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Completion Message */}
      {!isActive && status === 'COMPLETED' && (
        <div className="p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30">
          <p className="text-sm text-[#22C55E] font-medium">
            ✓ Análisis completado en {formatTime(elapsedTime)}
          </p>
        </div>
      )}

      {!isActive && status === 'FAILED' && (
        <div className="p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30">
          <p className="text-sm text-[#EF4444] font-medium">
            ⚠ Error durante el análisis después de {formatTime(elapsedTime)}
          </p>
        </div>
      )}

      {!isActive && status === 'CANCELLED' && (
        <div className="p-3 rounded-lg bg-[#6B7280]/10 border border-[#6B7280]/30">
          <p className="text-sm text-[#6B7280] font-medium">
            — Análisis cancelado después de {formatTime(elapsedTime)}
          </p>
        </div>
      )}
    </motion.div>
  );
}
