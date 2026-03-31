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
    color: 'bg-[#22C55E]/10 border-[#22C55E]/25 text-[#22C55E]',
  },
  inactive: {
    icon: Pause,
    label: 'Inactivo',
    color: 'bg-[#6B7280]/10 border-[#6B7280]/25 text-[#9CA3AF]',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'bg-[#EF4444]/10 border-[#EF4444]/25 text-[#EF4444]',
  },
  pending: {
    icon: Clock,
    label: 'Pendiente',
    color: 'bg-[#EAB308]/10 border-[#EAB308]/25 text-[#EAB308]',
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <div className={`${config.color} border rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5 text-xs font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{displayLabel}</span>
    </div>
  );
}
