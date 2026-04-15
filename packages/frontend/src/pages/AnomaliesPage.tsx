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

  // Detect anomalies from timeline data (improved detection)
  const detectedAnomalies: DetectedAnomaly[] = useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    const anomalies: DetectedAnomaly[] = [];
    const criticalValues = timeline.map((d: any) => d.critical || 0);
    const totalValues = timeline.map((d: any) => (d.critical || 0) + (d.high || 0));

    if (criticalValues.length > 1) {
      // Calculate statistics for critical findings
      const mean = criticalValues.reduce((a: number, b: number) => a + b, 0) / criticalValues.length;
      const variance = criticalValues.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / criticalValues.length;
      const stdDev = Math.sqrt(variance);

      // More sensitive detection: use mean + 1.5*stddev OR 50% increase from baseline
      const threshold1 = mean + 1.5 * stdDev;
      const threshold2 = mean * 1.5; // 50% increase
      const threshold = Math.min(threshold1, threshold2);

      // Also detect sudden spikes (day-to-day increase of 50%+)
      timeline.forEach((point: any, idx: number) => {
        let isAnomaly = false;
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
        let reason = '';

        // Check if exceeds threshold
        if (point.critical > threshold && threshold > 0) {
          isAnomaly = true;
          severity = point.critical > mean + 2 * stdDev ? 'critical' : point.critical > mean + 1 * stdDev ? 'high' : 'medium';
          reason = `Aumento estadístico en hallazgos críticos. Valor: ${point.critical}, Esperado: ${mean.toFixed(1)}`;
        }

        // Check for day-to-day spike (sudden increase)
        if (idx > 0) {
          const prevCritical = timeline[idx - 1].critical || 0;
          const increase = prevCritical > 0 ? ((point.critical - prevCritical) / prevCritical) : 0;

          if (increase >= 0.5 && point.critical > 0) {
            isAnomaly = true;
            severity = increase > 1 ? 'critical' : 'high';
            reason = `Spike súbito en hallazgos críticos. Aumentó de ${prevCritical} a ${point.critical} (+${(increase * 100).toFixed(0)}%)`;
          }
        }

        // Check for sustained high values
        const isHighValue = point.critical > mean + 0.5 * stdDev;
        const allHighValuesAhead = timeline.slice(idx, Math.min(idx + 3, timeline.length)).every((p: any) => (p.critical || 0) > mean);

        if (isHighValue && allHighValuesAhead && criticalValues.filter(v => v > mean).length > 0) {
          isAnomaly = true;
          severity = 'medium';
          if (!reason) reason = `Valores consistentemente altos en hallazgos críticos`;
        }

        if (isAnomaly) {
          anomalies.push({
            id: `anomaly-critical-${idx}`,
            metric: 'critical_findings',
            value: point.critical,
            expectedRange: [Math.max(0, mean - stdDev), threshold],
            severity,
            confidence: 0.75,
            timestamp: new Date(point.date),
            description: reason || `Anomalía detectada en hallazgos críticos`,
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
