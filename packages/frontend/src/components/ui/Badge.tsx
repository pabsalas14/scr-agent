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
  critical: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700',
  high: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700',
  medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700',
  low: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700',
  success: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700',
  pending: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700',
  warning: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700',
  info: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700',
};

const iconMap: Record<BadgeType, React.ReactNode> = {
  critical: <AlertCircle className="w-4 h-4" />,
  high: <AlertTriangle className="w-4 h-4" />,
  medium: <AlertTriangle className="w-4 h-4" />,
  low: <CheckCircle className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  pending: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const sizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
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
