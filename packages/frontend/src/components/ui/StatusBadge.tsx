/**
 * Badge de estado reutilizable
 */

import { CheckCircle, AlertCircle, Pause, Clock } from 'lucide-react';

type Status = 'active' | 'inactive' | 'error' | 'pending';

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    label: 'Activo',
    color: 'bg-green-500/20 dark:bg-green-500/20 border-green-400/50 dark:border-green-500/50 text-green-700 dark:text-green-200',
  },
  inactive: {
    icon: Pause,
    label: 'Inactivo',
    color: 'bg-gray-500/20 dark:bg-gray-500/20 border-gray-400/50 dark:border-gray-500/50 text-gray-700 dark:text-gray-200',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'bg-red-500/20 dark:bg-red-500/20 border-red-400/50 dark:border-red-500/50 text-red-700 dark:text-red-200',
  },
  pending: {
    icon: Clock,
    label: 'Pendiente',
    color: 'bg-yellow-500/20 dark:bg-yellow-500/20 border-yellow-400/50 dark:border-yellow-500/50 text-yellow-700 dark:text-yellow-200',
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <div className={`${config.color} border rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 text-sm font-medium`}>
      <Icon className="w-4 h-4" />
      <span>{displayLabel}</span>
    </div>
  );
}
