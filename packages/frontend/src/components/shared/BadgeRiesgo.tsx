/**
 * Badge visual para niveles de riesgo
 * Usado en múltiples componentes
 */

import type { NivelRiesgo } from '../../types/timeline';

interface BadgeRiesgoProps {
  nivel: NivelRiesgo;
  size?: 'sm' | 'md';
}

const SEVERITY_MAP: Record<string, NivelRiesgo> = {
  CRITICAL: 'CRÍTICO',
  HIGH: 'ALTO',
  MEDIUM: 'MEDIO',
  LOW: 'BAJO',
  CRÍTICO: 'CRÍTICO',
  ALTO: 'ALTO',
  MEDIO: 'MEDIO',
  BAJO: 'BAJO',
};

const LABELS: Record<NivelRiesgo, string> = {
  CRÍTICO: 'CRÍTICO',
  ALTO: 'ALTO',
  MEDIO: 'MEDIO',
  BAJO: 'BAJO',
};

const CLASES: Record<NivelRiesgo, string> = {
  CRÍTICO: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/40',
  ALTO: 'bg-[#FB923C]/10 text-[#FB923C] border-[#FB923C]/40',
  MEDIO: 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/40',
  BAJO: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/40',
};

export default function BadgeRiesgo({ nivel, size = 'md' }: BadgeRiesgoProps) {
  const mapped = SEVERITY_MAP[nivel] || (nivel.toUpperCase() as NivelRiesgo);
  return (
    <span
      className={`
        inline-flex items-center border rounded-full font-semibold
        ${CLASES[mapped] || CLASES['BAJO']}
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
      `}
    >
      {LABELS[mapped] || nivel}
    </span>
  );
}
