import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface RiskDataPoint {
  date: string;
  riskScore: number;
  findingsCount: number;
  remediationRate: number;
}

interface RiskEvolutionChartProps {
  data: RiskDataPoint[];
  isLoading?: boolean;
}

export default function RiskEvolutionChart({ data, isLoading }: RiskEvolutionChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 bg-[#242424] border border-[#2D2D2D] rounded-lg animate-pulse" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 bg-[#242424] border border-[#2D2D2D] rounded-lg flex items-center justify-center">
        <p className="text-sm text-[#6B7280]">Sin datos disponibles</p>
      </div>
    );
  }

  const latestScore = data[data.length - 1]?.riskScore || 0;
  const previousScore = data[data.length - 2]?.riskScore || latestScore;
  const trend = latestScore - previousScore;
  const trendPercent = previousScore !== 0 ? ((trend / previousScore) * 100).toFixed(1) : '0';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded p-3 shadow-lg">
          <p className="text-xs text-[#6B7280] mb-2">{data.date}</p>
          <p className="text-sm font-semibold text-white">
            Risk Score: {Math.round(data.riskScore * 100)}%
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            Hallazgos: {data.findingsCount}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Trend Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Evolución del Riesgo</p>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-2xl font-bold text-white">{Math.round(latestScore * 100)}%</p>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
              trend < 0 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'
            }`}>
              {trend < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span className="text-xs font-semibold">
                {trend < 0 ? '-' : '+'}{trendPercent}%
              </span>
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-[#6B7280]">
          <p className="mb-1">Últimos {data.length} análisis</p>
          <p>Período: {data[0]?.date} - {data[data.length - 1]?.date}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D]">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
              domain={[0, 100]}
              label={{ value: 'Risk Score (%)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="riskScore"
              stroke="#F97316"
              strokeWidth={2}
              dot={{ fill: '#F97316', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">
            Max Risk
          </p>
          <p className="text-lg font-bold text-[#EF4444]">
            {Math.round(Math.max(...data.map(d => d.riskScore)) * 100)}%
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">
            Min Risk
          </p>
          <p className="text-lg font-bold text-[#22C55E]">
            {Math.round(Math.min(...data.map(d => d.riskScore)) * 100)}%
          </p>
        </div>
      </div>

      {/* Analysis */}
      <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
        <p className="text-sm font-semibold text-white mb-2">📈 Análisis</p>
        {trend < 0 ? (
          <p className="text-xs text-[#22C55E]">
            ✓ Tendencia positiva: El riesgo está disminuyendo. Mantén el ritmo de remediación.
          </p>
        ) : trend > 0 ? (
          <p className="text-xs text-[#EF4444]">
            ⚠ Tendencia negativa: El riesgo está aumentando. Requiere atención inmediata.
          </p>
        ) : (
          <p className="text-xs text-[#6B7280]">
            = Sin cambios significativos en el riesgo.
          </p>
        )}
      </div>
    </motion.div>
  );
}
