import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AnomalyProfile } from '../../services/anomaly-detection.service';

interface BaselineVisualizationProps {
  profile: AnomalyProfile;
  historicalData: { timestamp: string; value: number }[];
  anomalies?: { timestamp: string; value: number }[];
  className?: string;
}

export function BaselineVisualization({
  profile,
  historicalData,
  anomalies = [],
  className = '',
}: BaselineVisualizationProps) {
  // Prepare data for chart
  const chartData = historicalData.map((point) => ({
    ...point,
    upper: profile.mean + 2 * profile.stdDev,
    lower: profile.mean - 2 * profile.stdDev,
    mean: profile.mean,
    isAnomaly: anomalies.some((a) => a.timestamp === point.timestamp),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded p-3 shadow-lg">
          <p className="text-xs text-[#6B7280] mb-1">{data.timestamp}</p>
          <p className="text-sm font-semibold text-white">Valor: {data.value.toFixed(2)}</p>
          <p className="text-xs text-[#A0A0A0] mt-1">Media: {data.mean.toFixed(2)}</p>
          <p className="text-xs text-[#6B7280]">
            Rango: {data.lower.toFixed(2)} - {data.upper.toFixed(2)}
          </p>
          {data.isAnomaly && <p className="text-xs text-[#EF4444] mt-1">⚠️ Anomalía detectada</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Profile Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Media</p>
          <p className="text-lg font-bold text-white">{profile.mean.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Desv. Estándar</p>
          <p className="text-lg font-bold text-[#F97316]">{profile.stdDev.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Min</p>
          <p className="text-lg font-bold text-[#22C55E]">{profile.min.toFixed(2)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Max</p>
          <p className="text-lg font-bold text-[#EF4444]">{profile.max.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D]">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
            <XAxis
              dataKey="timestamp"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#6B7280' }}
              label={{ value: 'Valor', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Baseline Band */}
            <ReferenceLine
              y={profile.mean}
              stroke="#F97316"
              strokeDasharray="5 5"
              label={{ value: 'Media', position: 'right', fill: '#F97316', fontSize: 12 }}
            />

            {/* Upper and Lower Bounds */}
            <ReferenceLine
              y={profile.mean + 2 * profile.stdDev}
              stroke="#EF4444"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{ value: '+2σ', position: 'right', fill: '#EF4444', fontSize: 10 }}
            />
            <ReferenceLine
              y={profile.mean - 2 * profile.stdDev}
              stroke="#22C55E"
              strokeDasharray="3 3"
              opacity={0.5}
              label={{ value: '-2σ', position: 'right', fill: '#22C55E', fontSize: 10 }}
            />

            {/* Historical Data */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366F1"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const fill = payload?.isAnomaly ? '#EF4444' : '#6366F1';
                const radius = payload?.isAnomaly ? 6 : 3;
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={fill}
                  />
                );
              }}
              activeDot={{ r: 7 }}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] space-y-2">
        <p className="text-sm font-semibold text-white">📊 Análisis del Perfil</p>
        <ul className="space-y-1 text-xs text-[#A0A0A0]">
          <li>
            • Métrica: <span className="text-white font-semibold">{profile.metric}</span>
          </li>
          <li>
            • Puntos de datos: <span className="text-white font-semibold">{profile.dataPoints}</span>
          </li>
          <li>
            • Rango normal: {profile.mean - 2 * profile.stdDev >= 0 ? (
              <span className="text-white font-semibold">
                {(profile.mean - 2 * profile.stdDev).toFixed(2)} - {(profile.mean + 2 * profile.stdDev).toFixed(2)}
              </span>
            ) : (
              <span className="text-white font-semibold">
                0 - {(profile.mean + 2 * profile.stdDev).toFixed(2)}
              </span>
            )}
          </li>
          <li>
            • Coeficiente de variación:{' '}
            <span className="text-white font-semibold">
              {((profile.stdDev / profile.mean) * 100).toFixed(1)}%
            </span>
          </li>
          <li className="pt-2">
            • Valores anómalos detectados: <span className="text-[#EF4444] font-semibold">{anomalies.length}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
