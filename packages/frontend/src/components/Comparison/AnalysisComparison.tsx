import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Analysis {
  id: string;
  date: Date;
  findingsCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  riskScore: number;
  remediationRate: number;
}

interface AnalysisComparisonProps {
  analysis1?: Analysis;
  analysis2?: Analysis;
  onSelectAnalysis?: (position: 1 | 2, analysis: Analysis) => void;
  isLoading?: boolean;
}

const getTrendIcon = (change: number) => {
  if (change > 0) return <TrendingUp className="w-4 h-4 text-[#22C55E]" />;
  if (change < 0) return <TrendingDown className="w-4 h-4 text-[#EF4444]" />;
  return <Minus className="w-4 h-4 text-[#6B7280]" />;
};

const getTrendColor = (change: number) => {
  if (change > 0) return 'text-[#22C55E]';
  if (change < 0) return 'text-[#EF4444]';
  return 'text-[#6B7280]';
};

export default function AnalysisComparison({
  analysis1,
  analysis2,
  onSelectAnalysis,
  isLoading,
}: AnalysisComparisonProps) {
  const [comparing, setComparing] = useState(true);

  if (!comparing || !analysis1 || !analysis2) {
    return (
      <div className="p-8 text-center rounded-lg border border-dashed border-[#2D2D2D]">
        <p className="text-sm text-[#6B7280]">Selecciona dos análisis para comparar</p>
      </div>
    );
  }

  const compareMetrics = [
    {
      label: 'Total de Hallazgos',
      value1: analysis1.findingsCount,
      value2: analysis2.findingsCount,
    },
    {
      label: 'Hallazgos Críticos',
      value1: analysis1.criticalCount,
      value2: analysis2.criticalCount,
    },
    {
      label: 'Hallazgos Altos',
      value1: analysis1.highCount,
      value2: analysis2.highCount,
    },
    {
      label: 'Score de Riesgo',
      value1: analysis1.riskScore,
      value2: analysis2.riskScore,
      format: (v: number) => `${Math.round(v * 100)}%`,
    },
    {
      label: 'Tasa de Remediación',
      value1: analysis1.remediationRate,
      value2: analysis2.remediationRate,
      format: (v: number) => `${Math.round(v * 100)}%`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Análisis 1</p>
          <p className="text-sm font-semibold text-white">{analysis1.date.toLocaleDateString()}</p>
        </div>
        <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] flex items-center justify-center">
          <p className="text-sm font-semibold text-[#6B7280]">vs</p>
        </div>
        <div className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Análisis 2</p>
          <p className="text-sm font-semibold text-white">{analysis2.date.toLocaleDateString()}</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="space-y-2">
        {compareMetrics.map((metric) => {
          const change = metric.value2 - metric.value1;
          const formatValue = metric.format || ((v) => v);
          const changePercent = metric.value1 !== 0 ? ((change / metric.value1) * 100).toFixed(1) : '—';

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] grid grid-cols-4 gap-4 items-center"
            >
              <div>
                <p className="text-sm font-semibold text-white">{metric.label}</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatValue(metric.value1)}</p>
                <p className="text-xs text-[#6B7280]">Análisis 1</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                {getTrendIcon(change)}
                <p className={`text-sm font-semibold ${getTrendColor(change)}`}>
                  {change > 0 ? '+' : ''}{changePercent}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatValue(metric.value2)}</p>
                <p className="text-xs text-[#6B7280]">Análisis 2</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interpretation */}
      <div className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] space-y-2">
        <p className="text-sm font-semibold text-white">📊 Interpretación</p>
        {analysis2.findingsCount < analysis1.findingsCount ? (
          <p className="text-sm text-[#22C55E]">
            ✓ Mejora: Se redujeron los hallazgos en comparación al análisis anterior.
          </p>
        ) : analysis2.findingsCount > analysis1.findingsCount ? (
          <p className="text-sm text-[#EF4444]">
            ⚠ Regresión: Aumentó el número de hallazgos.
          </p>
        ) : (
          <p className="text-sm text-[#6B7280]">
            = Sin cambios significativos en el número de hallazgos.
          </p>
        )}
      </div>
    </motion.div>
  );
}
