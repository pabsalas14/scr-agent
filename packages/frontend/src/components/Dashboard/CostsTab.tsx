/**
 * CostsTab Component
 * Cost metrics, token usage, spend by agent, spend trends
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, TrendingUp, Zap } from 'lucide-react';
import { apiService } from '../../services/api.service';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function CostsTab() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');

  // Fetch cost and token usage metrics
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['cost-metrics', period],
    queryFn: async () => {
      try {
        const [tokenUsage, findings] = await Promise.all([
          apiService.get(`/analytics/metrics/token-usage?period=${period}`),
          apiService.get('/findings/stats'),
        ]);

        return {
          tokenUsage: tokenUsage.data?.data || [],
          findings: findings.data?.data || { total: 0 },
        };
      } catch (error) {
        console.error('Error fetching metrics:', error);
        return {
          tokenUsage: [],
          findings: { total: 0 },
        };
      }
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const tokenUsage = metricsData?.tokenUsage || [];
  const totalSpend = tokenUsage.reduce((sum: number, u: any) => sum + (u.costUsd || 0), 0);
  const totalFindings = metricsData?.findings?.total || 0;
  const costPerFinding = totalFindings > 0 ? (totalSpend / totalFindings).toFixed(2) : '0.00';

  // Calculate spend by agent
  const agentSpendMap = tokenUsage.reduce((acc: Record<string, number>, u: any) => {
    acc[u.agentName] = (acc[u.agentName] || 0) + (u.costUsd || 0);
    return acc;
  }, {});

  const agentSpendEntries = Object.entries(agentSpendMap)
    .map(([agent, cost]) => ({
      agent,
      cost: cost as number,
      percentage: totalSpend > 0 ? ((cost as number) / totalSpend) * 100 : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Color mapping for agents
  const agentColors: Record<string, string> = {
    inspector: 'bg-orange-500',
    detective: 'bg-blue-500',
    fiscal: 'bg-purple-500',
  };

  const getAgentColor = (agentName: string) => {
    const lower = agentName.toLowerCase();
    return agentColors[lower] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Costos & Recursos de IA</h2>
          <p className="text-sm text-[#6B7280] mt-1">Análisis de uso de tokens y costos</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          className="px-4 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="day">Último Día</option>
          <option value="week">Última Semana</option>
          <option value="month">Último Mes</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Spend */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Gasto Total</p>
              <p className="text-3xl font-bold text-white">${totalSpend.toFixed(0)}</p>
            </div>
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-xs text-[#666]">Este período</p>
        </div>

        {/* Cost Per Finding */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Costo por Hallazgo</p>
              <p className="text-3xl font-bold text-white">${costPerFinding}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-xs text-[#666]">Eficiencia de costos</p>
        </div>

        {/* Total Token Usage */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Tokens Usados</p>
              <p className="text-3xl font-bold text-white">
                {tokenUsage.reduce((sum: number, u: any) => sum + (u.tokens || 0), 0).toLocaleString()}
              </p>
            </div>
            <Zap className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-xs text-[#666]">En este período</p>
        </div>
      </div>

      {/* Spend by Agent */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Agent Breakdown */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Gasto por Agente</h3>

          {agentSpendEntries.length === 0 ? (
            <p className="text-[#666] text-center py-6">Sin datos de uso</p>
          ) : (
            <div className="space-y-4">
              {agentSpendEntries.map((entry) => (
                <div key={entry.agent}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getAgentColor(entry.agent)}`}></div>
                      <span className="text-sm text-white font-medium">{entry.agent}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">${entry.cost.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-[#111] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${getAgentColor(entry.agent)}`}
                      style={{ width: `${entry.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#666] mt-1">{entry.percentage.toFixed(1)}% del total</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Token Usage Details */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Detalles de Uso</h3>

          {tokenUsage.length === 0 ? (
            <p className="text-[#666] text-center py-6">Sin datos de uso</p>
          ) : (
            <div className="space-y-3">
              {tokenUsage.slice(0, 5).map((usage: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#111] border border-[#2D2D2D] rounded-lg">
                  <div>
                    <p className="text-sm text-white font-medium">{usage.agentName || 'Desconocido'}</p>
                    <p className="text-xs text-[#666]">{usage.tokens?.toLocaleString()} tokens</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-400">${usage.costUsd?.toFixed(2)}</p>
                    <p className="text-xs text-[#666]">
                      {new Date(usage.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Nota:</strong> Los costos se calculan en tiempo real basados en el uso de tokens de cada agente. Los hallazgos detectados incluyen todas las severidades.
        </p>
      </div>
    </div>
  );
}
