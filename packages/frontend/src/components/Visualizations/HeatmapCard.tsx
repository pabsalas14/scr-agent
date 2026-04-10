/**
 * ============================================================================
 * HEATMAP CARD - Visualización de mapa de calor
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface HeatmapCell {
  x: string | number;
  y: string | number;
  value: number;
  severity: string;
  count: number;
}

interface HeatmapCardProps {
  title: string;
  data: HeatmapCell[];
  maxRisk: number;
  avgRisk: number;
  total: number;
  layout?: 'grid' | 'list';
}

export const HeatmapCard: React.FC<HeatmapCardProps> = ({
  title,
  data,
  maxRisk,
  avgRisk,
  total,
  layout = 'grid',
}) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const getSeverityColor = (value: number) => {
    if (value >= 80) return 'bg-red-600';
    if (value >= 60) return 'bg-orange-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 border-yellow-300';
      case 'LOW':
      default:
        return 'bg-green-100 border-green-300';
    }
  };

  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Risk: {avgRisk}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Max Risk: {maxRisk}</p>
          </div>
        </div>

        <div className="space-y-2">
          {data.map((cell, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onMouseEnter={() => setHoveredCell(`${idx}`)}
              onMouseLeave={() => setHoveredCell(null)}
              className={`p-3 rounded border cursor-pointer transition-all ${getSeverityBg(
                cell.severity
              )} ${hoveredCell === `${idx}` ? 'shadow-md scale-105' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {cell.x} - {cell.y}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {cell.count} events • Severity: {cell.severity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-6 rounded ${getSeverityColor(cell.value)}`}></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {cell.value}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
          <p className="text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <AlertCircle size={14} />
            Total: {total} events analyzed
          </p>
        </div>
      </motion.div>
    );
  }

  // Grid layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Max Risk</p>
            <p className="text-2xl font-bold text-red-600">{maxRisk}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Avg Risk</p>
            <p className="text-2xl font-bold text-orange-500">{avgRisk}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Total Events</p>
            <p className="text-2xl font-bold text-blue-600">{total}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-1 min-w-max" style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 12)}, 1fr)` }}>
          {data.slice(0, 48).map((cell, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.1 }}
              onMouseEnter={() => setHoveredCell(`${idx}`)}
              onMouseLeave={() => setHoveredCell(null)}
              className={`w-8 h-8 rounded cursor-pointer transition-all ${getSeverityColor(cell.value)} ${
                hoveredCell === `${idx}` ? 'ring-2 ring-offset-1 ring-blue-500' : ''
              }`}
              title={`${cell.x}-${cell.y}: ${cell.value} (${cell.count} events)`}
            />
          ))}
        </div>
      </div>

      {data.length > 48 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Showing 48 of {data.length} cells
        </p>
      )}
    </motion.div>
  );
};
