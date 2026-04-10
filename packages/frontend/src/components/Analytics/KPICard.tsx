import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number; // Percentage change
  icon?: LucideIcon;
  color?: 'orange' | 'green' | 'red' | 'blue' | 'purple';
  format?: (value: any) => string;
  onClick?: () => void;
  isLoading?: boolean;
  className?: string;
}

const colorConfig = {
  orange: {
    bg: 'bg-[#F97316]/10',
    border: 'border-[#F97316]/20',
    icon: 'text-[#F97316]',
    accent: '#F97316',
  },
  green: {
    bg: 'bg-[#22C55E]/10',
    border: 'border-[#22C55E]/20',
    icon: 'text-[#22C55E]',
    accent: '#22C55E',
  },
  red: {
    bg: 'bg-[#EF4444]/10',
    border: 'border-[#EF4444]/20',
    icon: 'text-[#EF4444]',
    accent: '#EF4444',
  },
  blue: {
    bg: 'bg-[#6366F1]/10',
    border: 'border-[#6366F1]/20',
    icon: 'text-[#6366F1]',
    accent: '#6366F1',
  },
  purple: {
    bg: 'bg-[#A855F7]/10',
    border: 'border-[#A855F7]/20',
    icon: 'text-[#A855F7]',
    accent: '#A855F7',
  },
};

export function KPICard({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  color = 'orange',
  format,
  onClick,
  isLoading = false,
  className = '',
}: KPICardProps) {
  const config = colorConfig[color];
  const formattedValue = format ? format(value) : String(value);

  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4 text-[#6B7280]" />;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-[#EF4444]" />;
    return <TrendingDown className="w-4 h-4 text-[#22C55E]" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-[#6B7280]';
    if (trend > 0) return 'text-[#EF4444]';
    return 'text-[#22C55E]';
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`p-6 rounded-lg border transition-all cursor-pointer ${config.bg} ${config.border} ${className}`}
    >
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-[#2D2D2D] rounded animate-pulse w-2/3" />
          <div className="h-8 bg-[#2D2D2D] rounded animate-pulse" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-white">{formattedValue}</p>
                {unit && <span className="text-sm text-[#A0A0A0]">{unit}</span>}
              </div>
            </div>
            {Icon && <Icon className={`w-8 h-8 ${config.icon} flex-shrink-0`} />}
          </div>

          {/* Trend */}
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-sm font-semibold ${getTrendColor()}`}>
                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
              <span className="text-xs text-[#6B7280]">vs período anterior</span>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
