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
  CRÍTICO: 'bg-[#FF3B3B]/10 text-[#FF3B3B] border-[#FF3B3B]/40 shadow-[0_0_10px_rgba(255,59,59,0.15)]',
  ALTO: 'bg-[#FF8A00]/10 text-[#FF8A00] border-[#FF8A00]/40',
  MEDIO: 'bg-[#FFD600]/10 text-[#FFD600] border-[#FFD600]/40',
  BAJO: 'bg-[#00FF94]/10 text-[#00FF94] border-[#00FF94]/40',
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
