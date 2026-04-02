import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type BadgeType = 'critical' | 'high' | 'medium' | 'low' | 'success' | 'pending' | 'warning' | 'info';

interface BadgeProps {
  type: BadgeType;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const badgeStyles: Record<BadgeType, string> = {
  critical: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25',
  high:     'bg-[#FB923C]/10 text-[#FB923C] border border-[#FB923C]/25',
  medium:   'bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/25',
  low:      'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25',
  success:  'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/25',
  pending:  'bg-[#6B7280]/10 text-[#9CA3AF] border border-[#6B7280]/25',
  warning:  'bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/25',
  info:     'bg-[#6366F1]/10 text-[#818CF8] border border-[#6366F1]/25',
};

const iconMap: Record<BadgeType, React.ReactNode> = {
  critical: <AlertCircle className="w-3.5 h-3.5" />,
  high:     <AlertTriangle className="w-3.5 h-3.5" />,
  medium:   <AlertTriangle className="w-3.5 h-3.5" />,
  low:      <CheckCircle className="w-3.5 h-3.5" />,
  success:  <CheckCircle className="w-3.5 h-3.5" />,
  pending:  <Info className="w-3.5 h-3.5" />,
  warning:  <AlertTriangle className="w-3.5 h-3.5" />,
  info:     <Info className="w-3.5 h-3.5" />,
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function Badge({
  type,
  children,
  size = 'md',
  showIcon = true,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium transition-all ${badgeStyles[type]} ${sizes[size]}`}
    >
      {showIcon && iconMap[type]}
      {children}
    </span>
  );
}
