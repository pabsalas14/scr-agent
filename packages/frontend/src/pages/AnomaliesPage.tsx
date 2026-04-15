import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api.service';
import { AnomalyDashboard } from '../components/Anomalies/AnomalyDashboard';
import type { DetectedAnomaly } from '../services/anomaly-detection.service';

/**
 * AnomaliesPage - Detección de anomalías en patrones de código y métricas
 *
 * Este módulo detecta comportamientos anormales en:
 * - Patrones de commits
 * - Distribución de hallazgos
 * - Tendencias de riesgo
 */
export default function AnomaliesPage() {
  // Fetch analytics data to detect anomalies
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: async () => {
      const response = await apiService.get<any>('/analytics/summary');
      return response.data?.data || response.data;
    },
  });

  const { data: timeline = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ['analytics', 'timeline', 30],
    queryFn: async () => {
      const response = await apiService.get<any>('/analytics/timeline?days=30');
      return response.data?.data || response.data || [];
    },
  });

  // Detect anomalies from timeline data (simplified detection)
  const detectedAnomalies: DetectedAnomaly[] = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    const anomalies: DetectedAnomaly[] = [];
    const criticalValues = timeline.map((d: any) => d.critical || 0);

    // Simple anomaly detection: values > mean + 2*stddev
    if (criticalValues.length > 1) {
      const mean = criticalValues.reduce((a: number, b: number) => a + b, 0) / criticalValues.length;
      const variance = criticalValues.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / criticalValues.length;
      const stdDev = Math.sqrt(variance);
      const threshold = mean + 2 * stdDev;

      timeline.forEach((point: any, idx: number) => {
        if (point.critical > threshold) {
          anomalies.push({
            id: `anomaly-critical-${idx}`,
            metric: 'critical_findings',
            value: point.critical,
            expectedRange: [Math.max(0, mean - 2 * stdDev), threshold],
            severity: point.critical > mean + 3 * stdDev ? 'critical' : 'high',
            confidence: 0.85,
            timestamp: new Date(point.date),
            description: `Aumento anómalo en hallazgos críticos. Valor: ${point.critical}, Esperado: ${mean.toFixed(1)} ± ${stdDev.toFixed(1)}`,
          });
        }
      });
    }

    return anomalies;
  }, [timeline]);

  const isLoading = loadingSummary || loadingTimeline;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Zap className="w-8 h-8 text-[#F97316] animate-pulse" />
        <p className="text-sm text-[#6B7280]">Analizando patrones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
          <span className="text-xs text-[#6B7280]">Detección automática de patrones anormales</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Anomalías</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Detección automática de comportamientos fuera del patrón normal en hallazgos y métricas
        </p>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4">
            <p className="text-xs text-[#A0A0A0] mb-2">Total Hallazgos</p>
            <p className="text-2xl font-bold text-white">{summary.totalFindings}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4">
            <p className="text-xs text-[#A0A0A0] mb-2">Críticos</p>
            <p className="text-2xl font-bold text-red-400">{summary.criticalFindings}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4">
            <p className="text-xs text-[#A0A0A0] mb-2">Anomalías Detectadas</p>
            <p className="text-2xl font-bold text-orange-400">{detectedAnomalies.length}</p>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4">
            <p className="text-xs text-[#A0A0A0] mb-2">Tasa Remediación</p>
            <p className="text-2xl font-bold text-green-400">{Math.round(summary.remediationRate * 100)}%</p>
          </div>
        </div>
      )}

      {/* Anomaly Dashboard */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <AnomalyDashboard
          anomalies={detectedAnomalies}
          isLoading={isLoading}
          className="w-full"
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-1">Sobre Detección de Anomalías</h3>
            <p className="text-sm text-blue-200">
              Este módulo utiliza análisis estadístico para identificar comportamientos fuera de lo normal.
              Las anomalías detectadas podrían indicar cambios en patrones de seguridad o distribuciones inusuales de hallazgos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
