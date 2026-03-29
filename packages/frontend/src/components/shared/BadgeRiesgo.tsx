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
  CRÍTICO: '🚨 CRÍTICO',
  ALTO: '⚠️ ALTO',
  MEDIO: '❔ MEDIO',
  BAJO: '✓ BAJO',
};

const CLASES: Record<NivelRiesgo, string> = {
  CRÍTICO: 'bg-red-100 text-red-800 border-red-300',
  ALTO: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIO: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  BAJO: 'bg-green-100 text-green-800 border-green-300',
};

export default function BadgeRiesgo({ nivel, size = 'md' }: BadgeRiesgoProps) {
  const mapped = SEVERITY_MAP[nivel] || nivel;
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
