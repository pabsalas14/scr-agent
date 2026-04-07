import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accentColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  trend,
  onClick,
}: KPICardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 hover:border-[#404040] transition-all duration-200 overflow-hidden relative group ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
            trend.isPositive ? 'text-[#22C55E] bg-[#22C55E]/10' : 'text-[#EF4444] bg-[#EF4444]/10'
          }`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-semibold text-white mb-0.5"
      >
        {value}
      </motion.p>
      <p className="text-xs text-[#6B7280]">{title}</p>
      {subtitle && <p className="text-xs text-[#4B5563] mt-0.5">{subtitle}</p>}

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-0 h-[1px] w-0 group-hover:w-full transition-all duration-500"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
}
