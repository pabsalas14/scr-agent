import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';

interface SLAIndicatorProps {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  targetDate: Date;
  createdDate: Date;
  resolvedDate?: Date;
  isResolved?: boolean;
}

const getSLAConfig = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return { label: 'Crítico', hoursToResolve: 1, color: 'text-[#EF4444]', bgColor: 'bg-[#EF4444]' };
    case 'HIGH':
      return { label: 'Alto', hoursToResolve: 4, color: 'text-[#FB923C]', bgColor: 'bg-[#FB923C]' };
    case 'MEDIUM':
      return { label: 'Medio', hoursToResolve: 24, color: 'text-[#EAB308]', bgColor: 'bg-[#EAB308]' };
    case 'LOW':
      return { label: 'Bajo', hoursToResolve: 72, color: 'text-[#22C55E]', bgColor: 'bg-[#22C55E]' };
    default:
      return { label: 'General', hoursToResolve: 24, color: 'text-[#6B7280]', bgColor: 'bg-[#6B7280]' };
  }
};

const formatDuration = (startDate: Date, endDate: Date): string => {
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m`;
  }
  return `${diffMinutes}m`;
};

export default function SLAIndicator({
  severity,
  targetDate,
  createdDate,
  resolvedDate,
  isResolved = false,
}: SLAIndicatorProps) {
  const config = getSLAConfig(severity);
  const now = new Date();
  const isOverdue = isPast(targetDate) && !isResolved;
  const actualDuration = resolvedDate ? formatDuration(createdDate, resolvedDate) : null;
  const remainingTime = formatDistanceToNow(targetDate, { locale: es });

  let status: 'met' | 'overdue' | 'warning' | 'pending';
  let statusIcon;
  let statusLabel;
  let statusColor;

  if (isResolved && resolvedDate) {
    if (isPast(resolvedDate) && !isPast(targetDate)) {
      status = 'met';
      statusIcon = CheckCircle2;
      statusLabel = 'SLA Cumplido';
      statusColor = 'text-[#22C55E]';
    } else {
      status = 'overdue';
      statusIcon = AlertCircle;
      statusLabel = 'SLA Incumplido';
      statusColor = 'text-[#EF4444]';
    }
  } else if (isOverdue) {
    status = 'overdue';
    statusIcon = AlertTriangle;
    statusLabel = 'SLA Vencido';
    statusColor = 'text-[#EF4444]';
  } else {
    const timeUntilOverdue = targetDate.getTime() - now.getTime();
    const hoursUntilOverdue = timeUntilOverdue / (1000 * 60 * 60);

    if (hoursUntilOverdue < 2) {
      status = 'warning';
      statusIcon = AlertTriangle;
      statusLabel = 'Próximo a Vencer';
      statusColor = 'text-[#F97316]';
    } else {
      status = 'pending';
      statusIcon = Clock;
      statusLabel = 'En Progreso';
      statusColor = 'text-[#F97316]';
    }
  }

  const StatusIcon = statusIcon;
  const progressPercent = Math.min(
    100,
    ((now.getTime() - createdDate.getTime()) / (targetDate.getTime() - createdDate.getTime())) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border ${
        status === 'met'
          ? 'bg-[#22C55E]/5 border-[#22C55E]/20'
          : status === 'overdue'
            ? 'bg-[#EF4444]/5 border-[#EF4444]/20'
            : status === 'warning'
              ? 'bg-[#F97316]/5 border-[#F97316]/20'
              : 'bg-[#F97316]/5 border-[#F97316]/20'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusColor}`} />
          <p className={`text-sm font-semibold ${statusColor}`}>{statusLabel}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-semibold ${config.color} bg-opacity-10 bg-current`}>
          {config.label}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6B7280]">Progreso SLA</span>
          <span className="font-semibold text-white">{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full h-2 bg-[#242424] rounded-full overflow-hidden border border-[#2D2D2D]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full rounded-full ${
              status === 'met'
                ? 'bg-gradient-to-r from-[#22C55E] to-[#16A34A]'
                : status === 'overdue'
                  ? 'bg-gradient-to-r from-[#EF4444] to-[#DC2626]'
                  : 'bg-gradient-to-r from-[#F97316] to-[#EA6B1B]'
            }`}
          />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Objetivo</p>
          {!isResolved ? (
            <p className="text-sm font-semibold text-white">
              {status === 'pending' || status === 'warning' ? 'En ' : ''}
              {remainingTime}
            </p>
          ) : (
            <p className="text-sm font-semibold text-white">
              {isPast(targetDate) ? 'Vencido' : 'Cumplido'}
            </p>
          )}
        </div>

        {actualDuration && (
          <div className="space-y-1">
            <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Tiempo Real</p>
            <p className="text-sm font-semibold text-white">{actualDuration}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">SLA</p>
          <p className="text-sm font-semibold text-white">{config.hoursToResolve}h</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">Estado</p>
          <p className={`text-sm font-semibold ${statusColor}`}>
            {isResolved ? '✓ Resuelto' : '⏱ Pendiente'}
          </p>
        </div>
      </div>

      {/* Status Message */}
      {status === 'overdue' && !isResolved && (
        <div className="mt-3 p-2 rounded bg-[#EF4444]/10 border border-[#EF4444]/30">
          <p className="text-xs text-[#EF4444] font-medium">
            ⚠️ SLA vencido. Se requiere acción inmediata para resolver este incidente.
          </p>
        </div>
      )}

      {status === 'warning' && !isResolved && (
        <div className="mt-3 p-2 rounded bg-[#F97316]/10 border border-[#F97316]/30">
          <p className="text-xs text-[#F97316] font-medium">
            ⏰ SLA próximo a vencer. Acelera la resolución para cumplir el objetivo.
          </p>
        </div>
      )}

      {status === 'met' && (
        <div className="mt-3 p-2 rounded bg-[#22C55E]/10 border border-[#22C55E]/30">
          <p className="text-xs text-[#22C55E] font-medium">
            ✓ SLA cumplido correctamente. Tiempo real: {actualDuration}
          </p>
        </div>
      )}
    </motion.div>
  );
}
