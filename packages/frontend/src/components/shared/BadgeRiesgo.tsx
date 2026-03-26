import React from 'react';

interface BadgeRiesgoProps {
  severity: string;
  size?: 'sm' | 'md';
}

const CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  CRITICAL: { label: 'Critico', cls: 'badge-critical', dot: 'bg-red-500' },
  HIGH:     { label: 'Alto',    cls: 'badge-high',     dot: 'bg-orange-500' },
  MEDIUM:   { label: 'Medio',   cls: 'badge-medium',   dot: 'bg-amber-500' },
  LOW:      { label: 'Bajo',    cls: 'badge-low',      dot: 'bg-emerald-500' },
  // Spanish fallbacks
  CRITICO:  { label: 'Critico', cls: 'badge-critical', dot: 'bg-red-500' },
  ALTO:     { label: 'Alto',    cls: 'badge-high',     dot: 'bg-orange-500' },
  MEDIO:    { label: 'Medio',   cls: 'badge-medium',   dot: 'bg-amber-500' },
  BAJO:     { label: 'Bajo',    cls: 'badge-low',      dot: 'bg-emerald-500' },
};

export default function BadgeRiesgo({ severity, size = 'md' }: BadgeRiesgoProps) {
  const key = severity?.toUpperCase() ?? '';
  const cfg = CONFIG[key] ?? { label: severity, cls: 'badge bg-slate-100 text-slate-600', dot: 'bg-slate-400' };

  return (
    <span className={cfg.cls + (size === 'sm' ? ' text-[10px] px-1.5' : '')}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
