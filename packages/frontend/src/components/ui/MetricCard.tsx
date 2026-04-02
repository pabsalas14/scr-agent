interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  percentage?: number;
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

export default function MetricCard({
  title,
  value,
  unit,
  percentage,
  status = 'good',
  icon,
}: MetricCardProps) {
  const statusColors = {
    good:     'bg-[#1E1E20] border-[#22C55E]/20',
    warning:  'bg-[#1E1E20] border-[#EAB308]/20',
    critical: 'bg-[#1E1E20] border-[#EF4444]/20',
  };

  const statusDot = {
    good:     'bg-[#22C55E]',
    warning:  'bg-[#EAB308]',
    critical: 'bg-[#EF4444]',
  };

  const percentageColor = (percentage || 0) >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]';

  return (
    <div className={`border rounded-xl p-4 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
          <h3 className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{title}</h3>
        </div>
        {icon && <span className="text-[#6B7280]">{icon}</span>}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold text-white">{value}</span>
          {unit && <span className="text-sm text-[#6B7280]">{unit}</span>}
        </div>

        {percentage !== undefined && (
          <div className={`text-xs font-medium ${percentageColor}`}>
            {percentage >= 0 ? '+' : ''}{percentage}% vs. anterior
          </div>
        )}
      </div>
    </div>
  );
}
