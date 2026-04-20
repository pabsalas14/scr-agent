/**
 * ScansTab Component
 * Scan activity, active scans, queue, recent analyses, repository activity
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api.service';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Proyecto, Analisis } from '../../types/api';
import { motion } from 'framer-motion';

const ACTIVE_STATUSES = ['PENDING', 'RUNNING', 'INSPECTOR_RUNNING', 'DETECTIVE_RUNNING', 'FISCAL_RUNNING'];

export default function ScansTab() {
  // Fetch projects for scan activity
  const { data: proyectosData, isLoading } = useQuery({
    queryKey: ['projects-scans'],
    queryFn: () => apiService.obtenerProyectos(),
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const proyectos: Proyecto[] = proyectosData?.data || [];

  // Categorize scans
  const allAnalyses = proyectos
    .flatMap((p) => (p.analyses || []).map((a) => ({ ...a, projectName: p.name, projectId: p.id })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeScans = allAnalyses.filter((a: any) => ACTIVE_STATUSES.includes(a.status));
  const completedScans = allAnalyses.filter((a: any) => a.status === 'COMPLETED');
  const failedScans = allAnalyses.filter((a: any) => a.status === 'FAILED' || a.status === 'ERROR');

  // Calculate statistics
  const totalScans = allAnalyses.length;
  const successRate = totalScans > 0 ? Math.round((completedScans.length / totalScans) * 100) : 0;
  const avgDuration = completedScans.length > 0
    ? Math.round(
        completedScans.reduce((sum: number, a: any) => {
          if (a.completedAt && a.createdAt) {
            return sum + (new Date(a.completedAt).getTime() - new Date(a.createdAt).getTime());
          }
          return sum;
        }, 0) / completedScans.length / (1000 * 60)
      )
    : 0;

  // Repository activity
  const repoActivity = proyectos.map((p) => ({
    name: p.name,
    totalAnalyses: p.analyses?.length || 0,
    lastAnalysis: p.analyses?.length > 0 ? p.analyses[0].createdAt : null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">Escaneos & Análisis</h2>
        <p className="text-sm text-[#6B7280] mt-1">Actividad de análisis y estado de escaneos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Scans */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Escaneos Activos</p>
              <p className="text-3xl font-bold text-white">{activeScans.length}</p>
            </div>
            <Activity className="w-5 h-5 text-orange-400 animate-pulse" />
          </div>
          <p className="text-xs text-[#666]">En progreso ahora</p>
        </div>

        {/* Completed Scans */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Completados</p>
              <p className="text-3xl font-bold text-green-400">{completedScans.length}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-xs text-[#666]">Escaneos exitosos</p>
        </div>

        {/* Success Rate */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-blue-400">{successRate}%</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-xs text-[#666]">De todos los escaneos</p>
        </div>

        {/* Avg Duration */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Duración Promedio</p>
              <p className="text-3xl font-bold text-white">{avgDuration}m</p>
            </div>
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-xs text-[#666]">Minutos por escaneo</p>
        </div>
      </div>

      {/* Active Scans List */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Escaneos en Progreso</h3>

        {activeScans.length === 0 ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
            <Activity className="w-7 h-7 text-[#2D2D2D]" />
            <p className="text-sm text-[#4B5563]">Sin escaneos activos en este momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeScans.slice(0, 5).map((scan: any) => (
              <div
                key={scan.id}
                className="bg-[#111] border border-[#2D2D2D] rounded-lg p-4 flex items-center justify-between group hover:border-[#404040] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{scan.projectName}</p>
                    <p className="text-xs text-[#6B7280]">{scan.status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1 min-w-[100px]">
                    <span className="text-xs text-white">{scan.progress ?? 0}%</span>
                    <div className="w-full h-1 bg-[#2D2D2D] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scan.progress ?? 0}%` }}
                        className="h-full bg-[#F97316] rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Analyses */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Completed Analyses */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Análisis Recientes</h3>

          {completedScans.length === 0 ? (
            <p className="text-[#666] text-center py-6">Sin análisis completados</p>
          ) : (
            <div className="space-y-3">
              {completedScans.slice(0, 5).map((scan: any) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-[#111] border border-[#2D2D2D] rounded-lg hover:border-[#4B5563] transition-colors">
                  <div>
                    <p className="text-sm text-white font-medium">{scan.projectName}</p>
                    <p className="text-xs text-[#6B7280]">
                      {new Date(scan.completedAt || scan.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-green-400 flex items-center gap-1">
                      <CheckCircle size={14} /> Completado
                    </p>
                    {scan.report && (
                      <p className="text-xs text-[#666]">Score: {scan.report.riskScore}/100</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repository Activity */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Actividad por Repositorio</h3>

          {repoActivity.length === 0 ? (
            <p className="text-[#666] text-center py-6">Sin repositorios</p>
          ) : (
            <div className="space-y-3">
              {repoActivity
                .sort((a, b) => (b.lastAnalysis ? new Date(b.lastAnalysis).getTime() : 0) - (a.lastAnalysis ? new Date(a.lastAnalysis).getTime() : 0))
                .slice(0, 5)
                .map((repo) => (
                  <div key={repo.name} className="flex items-center justify-between p-3 bg-[#111] border border-[#2D2D2D] rounded-lg">
                    <div>
                      <p className="text-sm text-white font-medium">{repo.name}</p>
                      <p className="text-xs text-[#6B7280]">{repo.totalAnalyses} análisis</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#666]">
                        {repo.lastAnalysis
                          ? new Date(repo.lastAnalysis).toLocaleDateString('es-ES')
                          : 'Sin análisis'}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Failed Scans Alert */}
      {failedScans.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-sm text-red-300">
            <strong>⚠️ {failedScans.length} escaneo(s) fallido(s):</strong> Revisa los logs para más detalles
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Nota:</strong> Los escaneos se ejecutan en tiempo real utilizando los agentes de IA configurados. El progreso se actualiza automáticamente.
        </p>
      </div>
    </div>
  );
}
