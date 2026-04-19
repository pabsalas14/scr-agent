/**
 * MetricsCard / UnifiedKPICard Component
 * Consolidated KPI card replacing Dashboard/KPICard AND Analytics/KPICard
 * Provides single reusable component with consistent API
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percent?: number;
    label?: string;
  };
  onClick?: () => void;
  status?: 'success' | 'warning' | 'error' | 'neutral';
  accentColor?: string; // Tailwind color class like 'text-blue-400'
  format?: (value: number) => string; // Custom formatter for the value
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusColors = {
  success: 'bg-green-500/10 border-green-500/20 text-green-300',
  warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
  error: 'bg-red-500/10 border-red-500/20 text-red-300',
  neutral: 'bg-slate-500/10 border-slate-500/20 text-slate-300',
};

const trendColors = {
  up: 'text-green-400',
  down: 'text-red-400',
  neutral: 'text-slate-400',
};

const sizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const titleSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const valueSizes = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-4xl',
};

export default function MetricsCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  onClick,
  status = 'neutral',
  accentColor = 'text-blue-400',
  format,
  isLoading = false,
  size = 'md',
}: MetricsCardProps) {
  const formattedValue = typeof value === 'number' && format ? format(value) : value;

  const TrendIcon =
    trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        bg-[#1A1A1A] border rounded-lg transition-all
        ${statusColors[status]}
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${sizeClasses[size]}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Left: Content */}
        <div className="flex-1">
          <p className={`${titleSizes[size]} text-[#888] font-medium mb-2`}>{title}</p>

          <div className="flex items-baseline gap-2">
            {isLoading ? (
              <div className="w-20 h-8 bg-white/10 rounded animate-pulse" />
            ) : (
              <>
                <span className={`${valueSizes[size]} font-bold text-white`}>
                  {formattedValue}
                </span>
                {unit && <span className="text-sm text-[#666]">{unit}</span>}
              </>
            )}
          </div>

          {/* Trend */}
          {trend && !isLoading && (
            <div className={`flex items-center gap-1 mt-3 ${trendColors[trend.direction]}`}>
              <TrendIcon size={16} />
              <span className="text-sm font-medium">
                {trend.percent && (
                  <>
                    {trend.direction === 'down' ? '-' : '+'}
                    {trend.percent}%
                  </>
                )}
                {trend.label && <span className="ml-1">{trend.label}</span>}
              </span>
            </div>
          )}
        </div>

        {/* Right: Icon */}
        {Icon && (
          <div className={`ml-4 p-2 bg-white/5 rounded-lg ${accentColor}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
