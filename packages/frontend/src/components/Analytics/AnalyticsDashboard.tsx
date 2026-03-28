/**
 * ============================================================================
 * ANALYTICS DASHBOARD - Métricas y gráficos de seguridad
 * ============================================================================
 */

import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { exportDashboardToPDF } from '../../services/pdf.service';

interface AnalyticData {
  findings: Array<{
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    status: string;
    createdAt: string;
  }>;
  analyses: Array<{
    id: string;
    status: string;
    completedAt?: string;
  }>;
}

const SEVERITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

interface AnalyticsDashboardProps {
  data?: AnalyticData;
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  // Process data for charts
  const chartData = useMemo(() => {
    if (!data) return null;

    // Severity breakdown
    const severityCount = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    data.findings.forEach((f) => {
      severityCount[f.severity]++;
    });

    const severityData = Object.entries(severityCount).map(([key, value]) => ({
      name: key,
      value,
      color: SEVERITY_COLORS[key as keyof typeof SEVERITY_COLORS],
    }));

    // Status breakdown
    const statusCount: Record<string, number> = {};
    data.findings.forEach((f) => {
      statusCount[f.status] = (statusCount[f.status] || 0) + 1;
    });

    const statusData = Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
    }));

    // Timeline (last 7 days)
    const timelineData: Record<string, number> = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      timelineData[dateStr] = 0;
    }

    data.findings.forEach((f) => {
      const date = new Date(f.createdAt);
      const dateStr = date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      if (dateStr in timelineData) {
        timelineData[dateStr]!++;
      }
    });

    const timelineChartData = Object.entries(timelineData).map(([date, count]) => ({
      date,
      hallazgos: count,
    }));

    // Summary stats
    const totalFindings = data.findings.length;
    const resolvedFindings = data.findings.filter((f) => f.status === 'CLOSED' || f.status === 'VERIFIED').length;
    const avgTimeToResolve = 2.5; // Mock data
    const riskScore = Math.round((severityCount.CRITICAL * 30 + severityCount.HIGH * 20 + severityCount.MEDIUM * 10 + severityCount.LOW * 5) / (totalFindings || 1));

    return {
      severityData,
      statusData,
      timelineChartData,
      totalFindings,
      resolvedFindings,
      avgTimeToResolve,
      riskScore,
    };
  }, [data]);

  if (!chartData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">No hay datos disponibles para mostrar</p>
      </div>
    );
  }

  const handleExportPDF = async () => {
    try {
      await exportDashboardToPDF({
        severityData: chartData.severityData,
        statusData: chartData.statusData,
        timelineData: chartData.timelineChartData,
        stats: {
          totalFindings: chartData.totalFindings,
          resolvedFindings: chartData.resolvedFindings,
          avgTimeToResolve: chartData.avgTimeToResolve,
          riskScore: chartData.riskScore,
        },
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Dashboard de Análisis</h2>
          <p className="text-gray-400 mt-1">Métricas de seguridad y tendencias</p>
        </div>
        <Button
          onClick={handleExportPDF}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Score de Riesgo</p>
              <p className="text-3xl font-bold text-white mt-2">{chartData.riskScore}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Hallazgos</p>
              <p className="text-3xl font-bold text-white mt-2">{chartData.totalFindings}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Resueltos</p>
              <p className="text-3xl font-bold text-white mt-2">{chartData.resolvedFindings}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Tasa Resolución</p>
              <p className="text-3xl font-bold text-white mt-2">
                {chartData.totalFindings > 0 ? Math.round((chartData.resolvedFindings / chartData.totalFindings) * 100) : 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Distribución por Severidad</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} hallazgos`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-4">Estado de Hallazgos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#3b82f6" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Timeline */}
        <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Hallazgos (Últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.timelineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="hallazgos"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-4">Detalle por Severidad</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left py-2 px-4 text-gray-300">Severidad</th>
                <th className="text-left py-2 px-4 text-gray-300">Cantidad</th>
                <th className="text-left py-2 px-4 text-gray-300">Porcentaje</th>
                <th className="text-left py-2 px-4 text-gray-300">Estado</th>
              </tr>
            </thead>
            <tbody>
              {chartData.severityData.map((row) => (
                <tr key={row.name} className="border-b border-slate-700 hover:bg-slate-600/50">
                  <td className="py-2 px-4">
                    <span
                      className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ backgroundColor: `${row.color}20`, color: row.color }}
                    >
                      {row.name}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-300">{row.value}</td>
                  <td className="py-2 px-4 text-gray-300">
                    {chartData.totalFindings > 0 ? Math.round((row.value / chartData.totalFindings) * 100) : 0}%
                  </td>
                  <td className="py-2 px-4">
                    {row.value > 0 ? (
                      <span className="text-yellow-400">⚠️ Revisión pendiente</span>
                    ) : (
                      <span className="text-green-400">✓ Completado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
