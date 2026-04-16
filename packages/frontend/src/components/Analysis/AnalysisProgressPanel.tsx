import { useState, useEffect } from 'react';
import { Zap, Pause, X, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../../hooks/useToast';

interface AnalysisProgress {
  projectId: string;
  id: string;
  projectName: string;
  progress: number;
  status: 'PENDING' | 'INSPECTOR_RUNNING' | 'DETECTIVE_RUNNING' | 'FISCAL_RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  coverageSummary?: { totalFiles?: number; analyzedFiles?: number };
  findingCount: number;
  errorMessage?: string;
}

interface AnalysisProgressPanelProps {
  analysis: AnalysisProgress;
  onCancel?: (analysisId: string) => void;
  onClose?: (analysisId: string) => void;
}

export default function AnalysisProgressPanel({
  analysis,
  onCancel,
  onClose,
}: AnalysisProgressPanelProps) {
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const toast = useToast();

  // Update elapsed time
  useEffect(() => {
    if (analysis.status !== 'scanning' || isPaused) return;

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(analysis.startedAt);
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [analysis.startedAt, analysis.status, isPaused]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const calculateETA = () => {
    if (analysis.progress === 0) return null;

    const timePerPercent = elapsedTime / analysis.progress;
    const remainingSeconds = timePerPercent * (100 - analysis.progress);
    return formatTime(Math.ceil(remainingSeconds));
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar este análisis?')) {
      onCancel?.(analysis.id);
      toast.warning('Análisis cancelado');
    }
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    toast.info(isPaused ? 'Análisis reanudado' : 'Análisis pausado');
  };

  const statusConfig = {
    scanning: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-300',
      icon: Zap,
    },
    completed: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      text: 'text-green-300',
      icon: CheckCircle,
    },
    failed: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: 'text-red-300',
      icon: AlertCircle,
    },
    paused: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-300',
      icon: Pause,
    },
  };

  const config = statusConfig[analysis.status];
  const StatusIcon = config.icon;
  const eta = calculateETA();

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <StatusIcon className={`${config.text} flex-shrink-0 mt-1`} size={20} />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${config.text}`}>{analysis.projectName}</h3>
            <p className="text-xs text-[#A0A0A0] mt-1">
              {analysis.status === 'scanning' && `Tiempo transcurrido: ${formatTime(elapsedTime)}`}
              {analysis.status === 'completed' && 'Análisis completado'}
              {analysis.status === 'failed' && 'Análisis fallido'}
              {analysis.status === 'paused' && 'Análisis pausado'}
              {eta && ` • ETA: ${eta}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => onClose?.(analysis.id)}
          className="p-1 hover:bg-[#2D2D2D] rounded transition-colors flex-shrink-0"
        >
          <X size={18} className="text-[#A0A0A0]" />
        </button>
      </div>

      {/* Progress Bar */}
      {analysis.status === 'scanning' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#A0A0A0]">Progreso</span>
            <span className={`text-sm font-semibold ${config.text}`}>{analysis.progress}%</span>
          </div>
          <div className="w-full bg-[#111111] rounded-full h-2 overflow-hidden border border-[#2D2D2D]">
            <div
              className="h-full bg-gradient-to-r from-[#F97316] to-[#FF6B6B] rounded-full transition-all duration-300"
              style={{ width: `${analysis.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#111111] rounded p-3 border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] mb-1">Archivos</p>
          <p className="text-sm font-semibold text-white">
            {analysis.coverageSummary?.analyzedFiles || 0} / {analysis.coverageSummary?.totalFiles || 0}
          </p>
        </div>
        <div className="bg-[#111111] rounded p-3 border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] mb-1">Hallazgos Detectados</p>
          <p className="text-sm font-semibold text-white">{analysis.findingCount}</p>
        </div>
      </div>

      {/* Error Messages */}
      {analysis.errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
          <p className="text-xs font-semibold text-red-300 mb-2">Error:</p>
          <p className="text-xs text-red-200">
            {analysis.errorMessage}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {analysis.status === 'scanning' && (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTogglePause}
            className="flex-1"
          >
            <Pause size={14} className="mr-1" />
            {isPaused ? 'Reanudar' : 'Pausar'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            className="flex-1"
          >
            <X size={14} className="mr-1" />
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}
