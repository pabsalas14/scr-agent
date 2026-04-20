/**
 * Analysis Progress Viewer
 * View real-time progress of any analysis (even if you left the page)
 *
 * Features:
 * - Real-time progress updates via WebSocket
 * - Shows current status, progress %, and findings count
 * - Shows cost accumulating in real-time
 * - Can be accessed from anywhere in the app
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  X,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import { socketClientService } from '../../services/socket.service';
import FailedChunksWidget from './FailedChunksWidget';

interface AnalysisProgressViewerProps {
  analysisId: string;
  projectId: string;
  onClose?: () => void;
}

interface PauseState {
  canPause: boolean;
  canResume: boolean;
  isPausing: boolean;
  isResuming: boolean;
}

interface AnalysisState {
  id: string;
  status: 'INSPECTOR_RUNNING' | 'DETECTIVE_RUNNING' | 'FISCAL_RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  startedAt: string;
  completedAt?: string;
  findings: Array<any>;
  errorMessage?: string;
}

interface CostData {
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    usd: number;
  };
  stageBreakdown: Array<any>;
}

export default function AnalysisProgressViewer({
  analysisId,
  projectId,
  onClose,
}: AnalysisProgressViewerProps) {
  const [localState, setLocalState] = useState<AnalysisState | null>(null);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [pauseState, setPauseState] = useState<PauseState>({
    canPause: false,
    canResume: false,
    isPausing: false,
    isResuming: false,
  });

  // Fetch initial analysis state
  const { data: initialAnalysis, isLoading } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      const response = await apiService.get(`/analyses/${analysisId}`);
      return response.data?.data;
    },
    refetchInterval: 5000, // Refetch every 5 seconds as fallback
  });

  // Fetch cost data
  const { data: costs } = useQuery({
    queryKey: ['analysisCost', analysisId],
    queryFn: async () => {
      const response = await apiService.get(`/analytics/cost-by-analysis/${analysisId}`);
      return response.data?.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Subscribe to real-time updates via WebSocket
  useEffect(() => {
    if (!initialAnalysis) return;

    // Set initial state
    setLocalState({
      id: initialAnalysis.id,
      status: initialAnalysis.status,
      progress: initialAnalysis.progress,
      startedAt: initialAnalysis.startedAt,
      completedAt: initialAnalysis.completedAt,
      findings: initialAnalysis.findings || [],
      errorMessage: initialAnalysis.errorMessage,
    });

    // Listen for real-time updates
    const handleStatusChange = (data: any) => {
      if (data.analysisId === analysisId) {
        setLocalState((prev) => ({
          ...prev!,
          status: data.status,
          progress: data.progress,
        }));
      }
    };

    socketClientService.on('analysisStatusChanged', handleStatusChange);

    return () => {
      socketClientService.off('analysisStatusChanged', handleStatusChange);
    };
  }, [initialAnalysis, analysisId]);

  // Update costs when fetched
  useEffect(() => {
    if (costs) {
      setCostData(costs);
    }
  }, [costs]);

  // Fetch pause capability
  useEffect(() => {
    if (!analysisId) return;

    const fetchPauseCapability = async () => {
      try {
        const response = await apiService.get(`/analyses/${analysisId}/can-pause`);
        const data = response.data?.data;
        if (data) {
          setPauseState((prev) => ({
            ...prev,
            canPause: data.canPause,
            canResume: data.canResume,
          }));
        }
      } catch (error) {
        console.warn('Failed to fetch pause capability:', error);
      }
    };

    fetchPauseCapability();
    // Refetch every 5 seconds to keep pause state current
    const interval = setInterval(fetchPauseCapability, 5000);

    return () => clearInterval(interval);
  }, [analysisId]);

  // Listen for real-time cost updates via WebSocket
  useEffect(() => {
    const handleCostUpdate = async (data: any) => {
      if (data.analysisId === analysisId) {
        // Re-fetch cost data when stage completes
        try {
          const response = await apiService.get(`/analytics/cost-by-analysis/${analysisId}`);
          if (response.data?.data) {
            setCostData(response.data.data);
          }
        } catch (error) {
          console.warn('Failed to fetch updated cost data:', error);
        }
      }
    };

    socketClientService.on('analysisCostUpdated', handleCostUpdate);

    return () => {
      socketClientService.off('analysisCostUpdated', handleCostUpdate);
    };
  }, [analysisId]);

  const handlePause = async () => {
    if (!analysisId || pauseState.isPausing) return;

    setPauseState((prev) => ({ ...prev, isPausing: true }));
    try {
      const response = await apiService.post(`/analyses/${analysisId}/pause`);
      if (response.data?.success) {
        setPauseState((prev) => ({
          ...prev,
          canPause: false,
          canResume: true,
          isPausing: false,
        }));
        // Emit socket event to update local state
        if (localState) {
          setLocalState((prev) =>
            prev ? { ...prev, status: 'PAUSED' as any } : null
          );
        }
      }
    } catch (error) {
      console.error('Error pausing analysis:', error);
      setPauseState((prev) => ({ ...prev, isPausing: false }));
    }
  };

  const handleResume = async () => {
    if (!analysisId || pauseState.isResuming) return;

    setPauseState((prev) => ({ ...prev, isResuming: true }));
    try {
      const response = await apiService.post(`/analyses/${analysisId}/resume`);
      if (response.data?.success) {
        setPauseState((prev) => ({
          ...prev,
          canPause: true,
          canResume: false,
          isResuming: false,
        }));
        // Emit socket event to update local state
        if (localState) {
          setLocalState((prev) =>
            prev ? { ...prev, status: 'INSPECTOR_RUNNING' as any } : null
          );
        }
      }
    } catch (error) {
      console.error('Error resuming analysis:', error);
      setPauseState((prev) => ({ ...prev, isResuming: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-[#1E1E1E] rounded-lg p-8 border border-[#2D2D2D]">
          <LoadingSpinner />
          <p className="text-white mt-4 text-center">Cargando análisis...</p>
        </div>
      </div>
    );
  }

  if (!localState) {
    return null;
  }

  const getStatusColor = (status: string) => {
    if (status.includes('RUNNING')) return 'text-blue-400';
    if (status === 'COMPLETED') return 'text-green-400';
    if (status === 'FAILED') return 'text-red-400';
    if (status === 'CANCELLED') return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('RUNNING')) return <Play className="w-5 h-5" />;
    if (status === 'COMPLETED') return <CheckCircle className="w-5 h-5" />;
    if (status === 'FAILED') return <AlertCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const getProgressBarColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500';
    if (status === 'FAILED') return 'bg-red-500';
    return 'bg-blue-500';
  };

  const elapsedTime = localState.startedAt
    ? Math.floor((Date.now() - new Date(localState.startedAt).getTime()) / 1000)
    : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2D2D2D]">
          <div>
            <h2 className="text-xl font-semibold text-white">Progreso del Análisis</h2>
            <p className="text-sm text-gray-400 mt-1">{projectId}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="p-6 space-y-6">
          {/* Status Line */}
          <div className="flex items-center gap-3">
            <div className={`${getStatusColor(localState.status)}`}>
              {getStatusIcon(localState.status)}
            </div>
            <div className="flex-1">
              <p className="text-white font-medium">Estado</p>
              <p className={`text-sm ${getStatusColor(localState.status)}`}>
                {localState.status.replace('_', ' ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{elapsedTime > 0 ? formatTime(elapsedTime) : '0s'}</p>
              <p className="text-xs text-gray-400">Tiempo transcurrido</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-medium">Progreso</p>
              <p className="text-sm text-gray-400">{localState.progress}%</p>
            </div>
            <div className="w-full bg-[#2D2D2D] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getProgressBarColor(localState.status)} transition-all duration-300`}
                style={{ width: `${localState.progress}%` }}
              />
            </div>
          </div>

          {/* Findings Count */}
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <div>
              <p className="text-white font-medium">Hallazgos Detectados</p>
              <p className="text-2xl font-bold text-orange-400">{localState.findings.length}</p>
            </div>
          </div>

          {/* Cost Display */}
          {costData && (
            <div className="bg-[#252525] rounded-lg p-4 border border-[#2D2D2D]">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <p className="text-white font-medium">Costo Acumulado</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Tokens Input</p>
                  <p className="text-lg font-semibold text-white">
                    {costData.tokens.input.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tokens Output</p>
                  <p className="text-lg font-semibold text-white">
                    {costData.tokens.output.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Costo Total</p>
                  <p className="text-2xl font-bold text-green-400">
                    ${costData.cost.usd.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed Chunks Widget */}
          {costData?.stageBreakdown && (
            <FailedChunksWidget
              failedChunks={costData.stageBreakdown.length > 0 ? [] : []}
              totalChunks={0}
            />
          )}

          {/* Error Message */}
          {localState.errorMessage && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-400 text-sm">
                <strong>Error:</strong> {localState.errorMessage}
              </p>
            </div>
          )}

          {/* Stage Breakdown */}
          {costData?.stageBreakdown && costData.stageBreakdown.length > 0 && (
            <div className="bg-[#252525] rounded-lg p-4 border border-[#2D2D2D]">
              <p className="text-white font-medium mb-3">Desglose por Etapa</p>
              <div className="space-y-2">
                {costData.stageBreakdown.map((stage, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="text-gray-300">
                        {stage.model} ({stage.provider})
                      </p>
                      <p className="text-xs text-gray-500">
                        {stage.inputTokens} in / {stage.outputTokens} out
                      </p>
                    </div>
                    <p className="text-gray-300">
                      ${stage.costUsd.toFixed(6)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pause/Resume Controls */}
          {(pauseState.canPause || pauseState.canResume) && (
            <div className="flex gap-3 border-t border-[#2D2D2D] pt-4">
              {pauseState.canPause && (
                <Button
                  onClick={handlePause}
                  disabled={pauseState.isPausing}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="secondary"
                >
                  <Pause className="w-4 h-4" />
                  {pauseState.isPausing ? 'Pausando...' : 'Pausar Análisis'}
                </Button>
              )}
              {pauseState.canResume && (
                <>
                  <Button
                    onClick={handleResume}
                    disabled={pauseState.isResuming}
                    className="flex-1 flex items-center justify-center gap-2"
                    variant="primary"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {pauseState.isResuming ? 'Reanudando...' : 'Reanudar Análisis'}
                  </Button>
                  <Button onClick={onClose} variant="secondary" className="flex-1">
                    Mantener Resultados
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => window.open(`/projects/${projectId}/analyses/${analysisId}`, '_blank')}
              className="flex-1"
              variant="primary"
            >
              Ver Detalles Completos
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="secondary" className="flex-1">
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
