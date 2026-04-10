import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Execution {
  id: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'RUNNING';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  findingsCount?: number;
  criticalCount?: number;
}

interface ExecutionHistoryProps {
  executions: Execution[];
  isLoading?: boolean;
}

const statusConfig = {
  COMPLETED: {
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
    bgColor: 'bg-[#22C55E]/10',
    label: 'Completado',
  },
  FAILED: {
    icon: AlertCircle,
    color: 'text-[#EF4444]',
    bgColor: 'bg-[#EF4444]/10',
    label: 'Fallido',
  },
  CANCELLED: {
    icon: Clock,
    color: 'text-[#6B7280]',
    bgColor: 'bg-[#6B7280]/10',
    label: 'Cancelado',
  },
  RUNNING: {
    icon: Zap,
    color: 'text-[#F97316]',
    bgColor: 'bg-[#F97316]/10',
    label: 'En progreso',
  },
};

const formatDuration = (seconds?: number): string => {
  if (!seconds) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
};

export default function ExecutionHistory({ executions, isLoading }: ExecutionHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="h-16 bg-[#242424] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-dashed border-[#2D2D2D]">
        <p className="text-sm text-[#6B7280]">Sin historial de ejecución</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
        Historial de Ejecuciones
      </div>
      {executions.map((execution, index) => {
        const config = statusConfig[execution.status];
        const Icon = config.icon;
        const relativeTime = formatDistanceToNow(execution.startTime, {
          addSuffix: true,
          locale: es,
        });

        return (
          <motion.div
            key={execution.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#404040] transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${config.bgColor} flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{relativeTime}</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-white">
                  {formatDuration(execution.duration)}
                </p>
                {execution.findingsCount !== undefined && (
                  <p className="text-xs text-[#6B7280] mt-1">
                    {execution.findingsCount} hallazgos
                    {execution.criticalCount ? ` (${execution.criticalCount} críticos)` : ''}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
