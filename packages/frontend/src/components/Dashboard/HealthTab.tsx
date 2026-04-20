/**
 * HealthTab Component
 * System health, agent status, last scan, response times, SLA
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Zap, Clock, CheckCircle } from 'lucide-react';
import { apiService } from '../../services/api.service';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function HealthTab() {
  // Fetch system health and metrics
  const { data: healthData, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const [health, agents] = await Promise.all([
        apiService.get('/monitoring/health'),
        apiService.get('/agents/status'),
      ]);
      return {
        health: health.data?.data,
        agents: agents.data?.data || [],
      };
    },
  });

  // Fetch recent analyses for last scan info
  const { data: analysesData } = useQuery({
    queryKey: ['recent-analyses'],
    queryFn: async () => {
      const res = await apiService.obtenerProyectos();
      return res?.data || [];
    },
  });

  if (isLoadingHealth) {
    return <LoadingSpinner />;
  }

  const health = healthData?.health;
  const agents = healthData?.agents || [];

  // Calculate last scan info from projects
  const allAnalyses = (analysesData || [])
    .flatMap((p: any) => (p.analyses || []))
    .sort((a: any, b: any) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  const lastAnalysis = allAnalyses[0];

  // Calculate average response time across agents
  const avgResponseTime = agents.length > 0
    ? Math.round(agents.reduce((sum: number, a: any) => sum + (a.avgResponseTime || 0), 0) / agents.length)
    : 0;

  // System health status
  const healthStatus = health?.healthy ? 'Operacional' : 'Degradado';
  const healthColor = health?.healthy ? 'text-green-400' : 'text-yellow-400';

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* System Health */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Estado del Sistema</p>
              <p className={`text-2xl font-bold ${healthColor}`}>
                {health?.healthy ? '🟢' : '🟡'}
              </p>
            </div>
            <Zap className={`w-5 h-5 ${healthColor}`} />
          </div>
          <p className="text-sm text-white font-medium">{healthStatus}</p>
          <p className="text-xs text-[#666] mt-2">
            {health?.healthy ? 'Todos los servicios operacionales' : 'Algunos servicios degradados'}
          </p>
        </div>

        {/* Agent Fleet Health */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Flota de Agentes</p>
              <p className="text-2xl font-bold text-white">{agents.length}</p>
            </div>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-sm text-white font-medium">
            {agents.filter((a: any) => a.status === 'running').length} activos
          </p>
          <p className="text-xs text-[#666] mt-2">
            {agents.length > 0 ? 'Agentes de análisis disponibles' : 'Sin agentes configurados'}
          </p>
        </div>

        {/* Last Scan */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Último Escaneo</p>
              <p className="text-sm font-bold text-white">
                {lastAnalysis
                  ? new Date(lastAnalysis.completedAt || lastAnalysis.createdAt).toLocaleDateString('es-ES')
                  : 'N/A'}
              </p>
            </div>
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-sm text-white font-medium">
            {lastAnalysis?.status === 'COMPLETED' ? 'Completado' : lastAnalysis?.status || 'Pendiente'}
          </p>
          <p className="text-xs text-[#666] mt-2">
            {lastAnalysis ? new Date(lastAnalysis.completedAt || lastAnalysis.createdAt).toLocaleTimeString('es-ES') : 'Sin escaneos'}
          </p>
        </div>

        {/* Average Response Time */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Tiempo Respuesta Promedio</p>
              <p className="text-2xl font-bold text-white">{avgResponseTime}ms</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-sm text-white font-medium">Global</p>
          <p className="text-xs text-[#666] mt-2">
            {avgResponseTime < 100 ? 'Excelente rendimiento' : avgResponseTime < 500 ? 'Bueno' : 'Revisar'}
          </p>
        </div>
      </div>

      {/* Agent Fleet Detailed Status */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Estado de Agentes</h3>

        {agents.length === 0 ? (
          <p className="text-[#666] text-center py-6">No hay agentes configurados</p>
        ) : (
          <div className="space-y-3">
            {agents.map((agent: any) => {
              const statusColor =
                agent.status === 'running'
                  ? 'text-green-400'
                  : agent.status === 'idle'
                    ? 'text-yellow-400'
                    : 'text-red-400';
              const statusIcon = agent.status === 'running' ? '✓' : agent.status === 'idle' ? '⏸️' : '✗';
              const statusText =
                agent.status === 'running' ? 'Ejecutándose' : agent.status === 'idle' ? 'Inactivo' : 'Error';

              return (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-4 bg-[#111] border border-[#2D2D2D] rounded-lg hover:border-[#4B5563] transition-colors"
                >
                  <div>
                    <p className="text-white font-semibold text-sm">{agent.name}</p>
                    <p className={`text-xs ${statusColor}`}>
                      {statusIcon} {statusText}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#888] text-sm">{agent.avgResponseTime || 0}ms</p>
                    <p className="text-[#666] text-xs">{agent.processingSpeed || 0}m/s</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
