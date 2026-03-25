/**
 * Tipos para la visualización de timeline forense
 * Usados por el componente TimelineViewer con D3.js
 */

export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO';

export interface EventoTimeline {
  id: string;
  timestamp: string; // ISO 8601
  commit: string;
  autor: string;
  archivo: string;
  funcion?: string;
  accion: 'AGREGADO' | 'MODIFICADO' | 'ELIMINADO';
  mensaje_commit: string;
  resumen_cambios?: string;
  nivel_riesgo: NivelRiesgo;
  indicadores_sospecha?: string[];
  hallazgo_id?: string;
  // Datos de visualización (calculados en frontend)
  x?: number;
  y?: number;
}

export interface GrupoFuncion {
  funcion: string;
  archivo: string;
  eventos: EventoTimeline[];
  nivel_riesgo_maximo: NivelRiesgo;
  primera_fecha: string;
  ultima_fecha: string;
}

export interface FiltrosTimeline {
  severidad?: NivelRiesgo[];
  autor?: string;
  archivo?: string;
  desde?: string;
  hasta?: string;
}

export const COLORES_RIESGO: Record<NivelRiesgo, string> = {
  BAJO: '#22c55e',
  MEDIO: '#eab308',
  ALTO: '#ea580c',
  CRÍTICO: '#dc2626',
};

export const COLORES_RIESGO_CLARO: Record<NivelRiesgo, string> = {
  BAJO: '#dcfce7',
  MEDIO: '#fef9c3',
  ALTO: '#ffedd5',
  CRÍTICO: '#fee2e2',
};
