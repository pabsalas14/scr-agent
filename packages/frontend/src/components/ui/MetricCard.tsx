/**
 * Tarjeta de métrica reutilizable
 * Muestra valor, porcentaje de cambio y pequeño gráfico
 */

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
    good: 'bg-green-500/20 dark:bg-green-500/20 border-green-400/50 dark:border-green-500/50 text-green-700 dark:text-green-200',
    warning: 'bg-yellow-500/20 dark:bg-yellow-500/20 border-yellow-400/50 dark:border-yellow-500/50 text-yellow-700 dark:text-yellow-200',
    critical: 'bg-red-500/20 dark:bg-red-500/20 border-red-400/50 dark:border-red-500/50 text-red-700 dark:text-red-200',
  };

  const percentageColor = (percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`glass-sm rounded-xl p-5 ${statusColors[status]}`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h3>
        {icon && <span className="text-xl">{icon}</span>}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
          {unit && <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>}
        </div>

        {percentage !== undefined && (
          <div className={`text-xs font-medium ${percentageColor}`}>
            {percentage >= 0 ? '+' : ''}{percentage}% vs. anteriormente
          </div>
        )}
      </div>
    </div>
  );
}
