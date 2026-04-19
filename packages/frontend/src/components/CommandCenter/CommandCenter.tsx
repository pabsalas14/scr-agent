/**
 * CommandCenter Module
 * Unified metrics and operations dashboard
 * Consolidates: Sistema, Costos, Estadísticas, Métricas
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Clock,
  TrendingUp,
  Zap,
  BarChart3,
  Filter,
  Download,
} from 'lucide-react';
import MetricsCard from '../ui/MetricsCard';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function CommandCenter() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [burndownDays, setBurndownDays] = useState(30);
  const [activeChart, setActiveChart] = useState<string | null>(null);

  // Fetch metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics', period],
    queryFn: async () => {
      const [tokenUsage, repoActivity, mttd, health] = await Promise.all([
        apiService.get(`/analytics/metrics/token-usage?period=${period}`),
        apiService.get('/analytics/metrics/repository-activity'),
        apiService.get('/analytics/metrics/mttd'),
        apiService.get('/monitoring/health'),
      ]);

      return {
        tokenUsage: tokenUsage.data?.data || [],
        repoActivity: repoActivity.data?.data || [],
        mttd: mttd.data?.data || [],
        health: health.data?.data,
      };
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const totalSpend = metrics?.tokenUsage?.reduce((sum: number, u: any) => sum + (u.costUsd || 0), 0) || 2450;
  const avgMTTD = metrics?.mttd?.[0]?.averageMttdHours || 2.3;
  const totalFindings = 1243;
  const systemHealth = metrics?.health;

  const handleExport = async () => {
    // Implement CSV export
    console.log('Exporting metrics...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Centro de Control</h1>
          <p className="text-[#888] mt-1">Dashboard operacional unificado</p>
        </div>
        <div className="flex gap-3">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="px-3 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded text-white text-sm"
          >
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          <Button size="sm" variant="secondary" onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards - Bento Grid */}
      <div className="grid grid-cols-4 gap-4">
        <MetricsCard
          title="Spend"
          value={`$${totalSpend.toFixed(0)}`}
          unit="this period"
          icon={DollarSign}
          trend={{ direction: 'up', percent: 12, label: 'vs last period' }}
          status="warning"
          accentColor="text-green-400"
          onClick={() => setActiveChart('spend')}
        />

        <MetricsCard
          title="MTTD"
          value={avgMTTD}
          unit="hours"
          icon={Clock}
          trend={{ direction: 'down', percent: 5, label: 'improving' }}
          status="success"
          accentColor="text-blue-400"
          onClick={() => setActiveChart('mttd')}
        />

        <MetricsCard
          title="Activity"
          value={totalFindings}
          unit="findings"
          icon={TrendingUp}
          trend={{ direction: 'up', percent: 34, label: 'vs last period' }}
          status="neutral"
          accentColor="text-orange-400"
          onClick={() => setActiveChart('activity')}
        />

        <MetricsCard
          title="System Health"
          value={systemHealth?.health?.healthy ? '🟢' : '🟡'}
          unit={systemHealth?.health?.healthy ? 'Operational' : 'Degraded'}
          icon={Zap}
          status={systemHealth?.health?.healthy ? 'success' : 'warning'}
          accentColor="text-red-400"
          onClick={() => setActiveChart('health')}
        />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-2 gap-4">
        {/* Interactive Charts */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <BarChart3 size={18} />
            Spend by Agent
          </h3>
          <div className="h-48 flex items-center justify-center bg-[#111] rounded border border-[#2D2D2D]">
            <p className="text-[#666]">Donut Chart Visualization</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                Detective
              </span>
              <span className="text-[#888]">45%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                Fiscal
              </span>
              <span className="text-[#888]">35%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                Inspector
              </span>
              <span className="text-[#888]">20%</span>
            </div>
          </div>
        </div>

        {/* Agent Fleet Status */}
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-white">Agent Fleet Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-[#2D2D2D]">
              <div>
                <p className="text-white font-semibold text-sm">Inspector</p>
                <p className="text-[#888] text-xs">✓ Running</p>
              </div>
              <p className="text-[#888] text-sm">18m/s</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-[#2D2D2D]">
              <div>
                <p className="text-white font-semibold text-sm">Detective</p>
                <p className="text-[#888] text-xs">✓ Running</p>
              </div>
              <p className="text-[#888] text-sm">23m/s</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#111] rounded border border-[#2D2D2D]">
              <div>
                <p className="text-white font-semibold text-sm">Fiscal</p>
                <p className="text-yellow-300 text-xs">⚠️ Slow</p>
              </div>
              <p className="text-[#888] text-sm">8m/s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Burndown Chart */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp size={18} />
            Burndown Chart
          </h3>
          <select
            value={burndownDays}
            onChange={e => setBurndownDays(Number(e.target.value))}
            className="px-3 py-1 bg-[#111] border border-[#2D2D2D] rounded text-white text-xs"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        <div className="h-48 flex items-center justify-center bg-[#111] rounded border border-[#2D2D2D]">
          <p className="text-[#666]">Area Chart Visualization</p>
        </div>
      </div>

      {/* Repository Health Table */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-white">Repository Health</h3>
        <table className="w-full text-sm">
          <thead className="border-b border-[#2D2D2D]">
            <tr>
              <th className="text-left py-2 text-[#888]">Repository</th>
              <th className="text-left py-2 text-[#888]">Findings</th>
              <th className="text-left py-2 text-[#888]">Critical</th>
              <th className="text-left py-2 text-[#888]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D2D2D]">
            {[
              { repo: 'Repo A', findings: 34, critical: 3, status: 'Warning' },
              { repo: 'Repo B', findings: 12, critical: 0, status: 'Good' },
              { repo: 'Repo C', findings: 8, critical: 1, status: 'Caution' },
            ].map(row => (
              <tr key={row.repo} className="hover:bg-[#222] transition-colors">
                <td className="py-3 text-white">{row.repo}</td>
                <td className="py-3 text-[#888]">{row.findings}</td>
                <td className="py-3 text-[#888]">{row.critical}</td>
                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      row.status === 'Good'
                        ? 'bg-green-500/20 text-green-300'
                        : row.status === 'Warning'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-orange-500/20 text-orange-300'
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
