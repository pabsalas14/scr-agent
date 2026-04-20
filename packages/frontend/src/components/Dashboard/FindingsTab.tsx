/**
 * FindingsTab Component
 * Security findings metrics, MTTC, remediation rate, severity breakdown
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertOctagon, TrendingDown, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api.service';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function FindingsTab() {
  // Fetch findings and security metrics
  const { data: findingsData, isLoading } = useQuery({
    queryKey: ['findings-metrics'],
    queryFn: async () => {
      try {
        const [stats, byRepository] = await Promise.all([
          apiService.get('/findings/stats'),
          apiService.get('/findings/by-repository'),
        ]);

        return {
          stats: stats.data?.data || {},
          repositories: byRepository.data?.data || [],
        };
      } catch (error) {
        console.error('Error fetching findings:', error);
        return {
          stats: {},
          repositories: [],
        };
      }
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const stats = findingsData?.stats || {};
  const repositories = findingsData?.repositories || [];

  const totalFindings = stats.total || 0;
  const criticalFindings = stats.critical || 0;
  const highFindings = stats.high || 0;
  const remediationRate = stats.remediationRate ? Math.round(stats.remediationRate * 100) : 0;
  const falsePositiveRate = stats.falsePositiveRate ? Math.round(stats.falsePositiveRate * 100) : 0;

  // Calculate severity breakdown percentages
  const severityBreakdown = [
    { label: 'Crítico', value: criticalFindings, percentage: totalFindings > 0 ? (criticalFindings / totalFindings) * 100 : 0, color: 'bg-red-500' },
    { label: 'Alto', value: highFindings, percentage: totalFindings > 0 ? (highFindings / totalFindings) * 100 : 0, color: 'bg-orange-500' },
    { label: 'Medio', value: stats.medium || 0, percentage: totalFindings > 0 ? ((stats.medium || 0) / totalFindings) * 100 : 0, color: 'bg-yellow-500' },
    { label: 'Bajo', value: stats.low || 0, percentage: totalFindings > 0 ? ((stats.low || 0) / totalFindings) * 100 : 0, color: 'bg-blue-500' },
  ];

  // Status breakdown
  const statusBreakdown = [
    { label: 'Detectados', value: stats.detected || 0, color: 'bg-blue-500' },
    { label: 'En Revisión', value: stats.inReview || 0, color: 'bg-purple-500' },
    { label: 'En Corrección', value: stats.inCorrection || 0, color: 'bg-yellow-500' },
    { label: 'Corregidos', value: stats.corrected || 0, color: 'bg-green-500' },
    { label: 'Verificados', value: stats.verified || 0, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Hallazgos & Seguridad</h2>
        <p className="text-sm text-[#6B7280] mt-1">Postura de seguridad y métricas de hallazgos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Findings */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Hallazgos Totales</p>
              <p className="text-3xl font-bold text-white">{totalFindings}</p>
            </div>
            <AlertOctagon className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-xs text-[#666]">Todas las severidades</p>
        </div>

        {/* Critical Findings */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Hallazgos Críticos</p>
              <p className="text-3xl font-bold text-red-400">{criticalFindings}</p>
            </div>
            <AlertOctagon className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-xs text-[#666]">Requieren atención inmediata</p>
        </div>

        {/* Remediation Rate */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Tasa de Remediación</p>
              <p className="text-3xl font-bold text-green-400">{remediationRate}%</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-xs text-[#666]">Hallazgos corregidos/resueltos</p>
        </div>
      </div>

      {/* Severity and Status Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Severity Breakdown */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Desglose por Severidad</h3>

          {totalFindings === 0 ? (
            <p className="text-[#666] text-center py-6">Sin hallazgos</p>
          ) : (
            <div className="space-y-4">
              {severityBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-white font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">{item.value}</span>
                  </div>
                  <div className="w-full bg-[#111] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#666] mt-1">{item.percentage.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Desglose por Estado</h3>

          {totalFindings === 0 ? (
            <p className="text-[#666] text-center py-6">Sin hallazgos</p>
          ) : (
            <div className="space-y-3">
              {statusBreakdown.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-[#111] border border-[#2D2D2D] rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-white">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Repository Health */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Salud de Repositorios</h3>

        {repositories.length === 0 ? (
          <p className="text-[#666] text-center py-6">Sin datos de repositorios</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2D2D2D]">
                <tr>
                  <th className="text-left py-2 text-[#888]">Repositorio</th>
                  <th className="text-left py-2 text-[#888]">Hallazgos</th>
                  <th className="text-left py-2 text-[#888]">Críticos</th>
                  <th className="text-left py-2 text-[#888]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D2D2D]">
                {repositories.map((repo: any) => {
                  const criticalCount = repo.findingsBySeverity?.CRITICAL || 0;
                  const totalFindings = repo.totalFindings || 0;

                  let status = 'Bueno';
                  let statusColor = 'bg-green-500/20 text-green-300';

                  if (criticalCount > 0) {
                    status = 'Advertencia';
                    statusColor = 'bg-yellow-500/20 text-yellow-300';
                  }
                  if (criticalCount >= 3) {
                    status = 'Crítico';
                    statusColor = 'bg-red-500/20 text-red-300';
                  }

                  return (
                    <tr key={repo.name} className="hover:bg-[#111] transition-colors">
                      <td className="py-3 text-white">{repo.name}</td>
                      <td className="py-3 text-[#888]">{totalFindings}</td>
                      <td className="py-3 text-[#888]">{criticalCount}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            <strong>Falsos Positivos:</strong> {falsePositiveRate}% de hallazgos marcados como falsos positivos
          </p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-sm text-green-300">
            <strong>MTTC:</strong> Tiempo medio de corrección disponible en detalles de hallazgos
          </p>
        </div>
      </div>
    </div>
  );
}
