import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export interface HeatMapDataPoint {
  file: string;
  findings: number;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RiskHeatMapProps {
  data: HeatMapDataPoint[];
  isLoading?: boolean;
  onFileSelect?: (file: string) => void;
  className?: string;
}

const getRiskColor = (riskScore: number): string => {
  if (riskScore >= 80) return 'bg-[#EF4444]'; // Critical - Red
  if (riskScore >= 60) return 'bg-[#FB923C]'; // High - Orange
  if (riskScore >= 40) return 'bg-[#EAB308]'; // Medium - Yellow
  if (riskScore >= 20) return 'bg-[#22C55E]'; // Low - Green
  return 'bg-[#6B7280]'; // None - Gray
};

const getRiskText = (riskScore: number): string => {
  if (riskScore >= 80) return 'Crítico';
  if (riskScore >= 60) return 'Alto';
  if (riskScore >= 40) return 'Medio';
  if (riskScore >= 20) return 'Bajo';
  return 'Mínimo';
};

export function RiskHeatMap({
  data,
  isLoading = false,
  onFileSelect,
  className = '',
}: RiskHeatMapProps) {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-[#242424] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`p-8 text-center rounded-lg border border-dashed border-[#2D2D2D] ${className}`}>
        <AlertCircle className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-50" />
        <p className="text-sm text-[#6B7280]">Sin datos de riesgo disponibles</p>
      </div>
    );
  }

  // Sort by risk score descending
  const sortedData = [...data].sort((a, b) => b.riskScore - a.riskScore);

  // Group by severity
  const byFile = sortedData.slice(0, 10); // Top 10

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#EF4444]" />
          <span className="text-[#6B7280]">Crítico (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#FB923C]" />
          <span className="text-[#6B7280]">Alto (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#EAB308]" />
          <span className="text-[#6B7280]">Medio (40-59)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#22C55E]" />
          <span className="text-[#6B7280]">Bajo (20-39)</span>
        </div>
      </div>

      {/* Heat Map */}
      <div className="space-y-3">
        {byFile.map((point, index) => {
          const percentage = (point.riskScore / 100) * 100;
          const color = getRiskColor(point.riskScore);
          const riskText = getRiskText(point.riskScore);

          return (
            <motion.div
              key={point.file}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onFileSelect?.(point.file)}
              className="cursor-pointer"
            >
              {/* File Name */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white truncate">{point.file}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[#6B7280]">{point.findings} hallazgos</span>
                  <span className={`font-semibold`} style={{ color: getRiskScoreColor(point.riskScore) }}>
                    {riskText}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-8 bg-[#1E1E20] rounded-lg border border-[#2D2D2D] overflow-hidden hover:border-[#F97316] transition-colors">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className={`h-full rounded-lg ${color} opacity-80 hover:opacity-100 transition-opacity flex items-center justify-end pr-3`}
                >
                  {percentage >= 15 && (
                    <span className="text-white font-semibold text-xs">{point.riskScore}</span>
                  )}
                </motion.div>

                {/* Score outside bar if too small */}
                {percentage < 15 && (
                  <div className="absolute inset-0 flex items-center justify-center text-white font-semibold text-xs">
                    {point.riskScore}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="mt-2 hidden group-hover:grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#242424] p-2 rounded border border-[#2D2D2D]">
                  <p className="text-[#6B7280]">Score</p>
                  <p className="font-semibold text-white">{point.riskScore}/100</p>
                </div>
                <div className="bg-[#242424] p-2 rounded border border-[#2D2D2D]">
                  <p className="text-[#6B7280]">Hallazgos</p>
                  <p className="font-semibold text-white">{point.findings}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="pt-4 border-t border-[#2D2D2D] grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Archivo Más Crítico</p>
          <p className="text-sm font-semibold text-white truncate">{byFile[0]?.file || 'N/A'}</p>
          <p className="text-xs text-[#EF4444]">{byFile[0]?.riskScore || 0}/100</p>
        </div>
        <div className="p-3 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Risk Promedio</p>
          <p className="text-sm font-semibold text-white">
            {(data.reduce((sum, p) => sum + p.riskScore, 0) / data.length).toFixed(1)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Archivos Críticos</p>
          <p className="text-sm font-semibold text-[#EF4444]">
            {data.filter((p) => p.riskScore >= 80).length}
          </p>
        </div>
      </div>
    </div>
  );
}

function getRiskScoreColor(score: number): string {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#FB923C';
  if (score >= 40) return '#EAB308';
  if (score >= 20) return '#22C55E';
  return '#6B7280';
}
