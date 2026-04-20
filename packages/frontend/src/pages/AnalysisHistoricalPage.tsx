import { useQuery, useQueries } from '@tanstack/react-query';
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { apiService } from '../services/api.service';
import type { Analisis, Reporte } from '../types/api';

export default function AnalysisHistoricalPage() {
  const { data: analysesResponse, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['analyses-historical'],
    queryFn: () => apiService.obtenerAnalisisGlobales({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const analyses = analysesResponse?.data || [];
  // Mostrar todos los análisis (completados, fallidos, cancelados)
  const allAnalyses = analyses.filter((a: any) =>
    ['COMPLETED', 'FAILED', 'CANCELLED'].includes(a.status)
  );

  // Solo buscar hallazgos/reportes para análisis COMPLETADOS
  const completedAnalyses = allAnalyses.filter((a: any) => a.status === 'COMPLETED');

  // Fetch reports and findings only for completed analyses
  const reportsQueries = useQueries({
    queries: completedAnalyses.map((analysis: any) => ({
      queryKey: ['report', analysis.id],
      queryFn: () => apiService.obtenerReporte(analysis.id),
      enabled: !!analysis.id,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const findingsQueries = useQueries({
    queries: completedAnalyses.map((analysis: any) => ({
      queryKey: ['findings', analysis.id],
      queryFn: () => apiService.obtenerHallazgos(analysis.id),
      enabled: !!analysis.id,
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Combine all analyses with their reports and findings (when available)
  const analysesWithReports = allAnalyses.map((analysis: any) => {
    const completedIdx = completedAnalyses.findIndex((a: any) => a.id === analysis.id);
    const findings = completedIdx >= 0 ? findingsQueries[completedIdx]?.data || [] : [];
    const criticalCount = findings.filter((f: any) => f.severity === 'CRITICAL').length;

    return {
      ...analysis,
      report: completedIdx >= 0 ? reportsQueries[completedIdx]?.data : undefined,
      findings,
      criticalCount,
    };
  });

  const isLoading = isLoadingAnalyses || reportsQueries.some(q => q.isLoading) || findingsQueries.some(q => q.isLoading);

  const sortedAnalyses = analysesWithReports ? [...analysesWithReports].sort((a, b) => {
    const dateA = new Date(a.completedAt || a.createdAt).getTime();
    const dateB = new Date(b.completedAt || b.createdAt).getTime();
    return dateB - dateA;
  }) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Histórico de Análisis</h1>
        <p className="text-sm text-[#A0A0A0]">
          Visualiza la evolución temporal de tus análisis de seguridad
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : sortedAnalyses.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
          <p className="text-[#A0A0A0]">No hay análisis disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Timeline visualization */}
          <div className="relative space-y-4">
            {sortedAnalyses.map((analysis, idx) => (
              <div
                key={analysis.id}
                className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 hover:border-[#4B5563] transition-colors"
              >
                {/* Timeline connector */}
                {idx < sortedAnalyses.length - 1 && (
                  <div className="absolute left-8 top-full h-4 w-px bg-[#2D2D2D]" />
                )}

                <div className="flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-4 border-[#111111]" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">
                          {analysis.projectName || `Análisis ${analysis.id.slice(0, 8)}`}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-[#A0A0A0]">
                          <Calendar size={14} />
                          {new Date(analysis.completedAt || analysis.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        analysis.status === 'COMPLETED'
                          ? 'bg-green-500/20 text-green-400'
                          : analysis.status === 'FAILED'
                          ? 'bg-red-500/20 text-red-400'
                          : analysis.status === 'CANCELLED'
                          ? 'bg-orange-500/20 text-orange-400'
                          : analysis.status === 'IN_PROGRESS'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {analysis.status === 'COMPLETED' ? 'Completado' : analysis.status === 'FAILED' ? 'Fallido' : analysis.status === 'CANCELLED' ? 'Cancelado' : analysis.status === 'IN_PROGRESS' ? 'En progreso' : 'Pendiente'}
                      </span>
                    </div>

                    {/* Error message for failed analyses */}
                    {analysis.status === 'FAILED' && analysis.errorMessage && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300">
                        <p className="font-medium">Error:</p>
                        <p>{analysis.errorMessage}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#2D2D2D]">
                      <div>
                        <p className="text-xs text-[#A0A0A0] mb-1">Hallazgos Críticos</p>
                        <p className="text-lg font-semibold text-red-400">
                          {(analysis as any).criticalCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#A0A0A0] mb-1">Total Hallazgos</p>
                        <p className="text-lg font-semibold text-white">
                          {(analysis as any).findingCount || analysis.report?.findingsCount || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#A0A0A0] mb-1">Risk Score</p>
                        <p className="text-lg font-semibold text-blue-400">{analysis.report?.riskScore || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
