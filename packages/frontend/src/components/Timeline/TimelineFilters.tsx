/**
 * Panel de filtros de la línea de tiempo
 * Permite filtrar por severidad, autor, archivo y rango de fechas
 */

import React from 'react';
import type { EventoTimeline, FiltrosTimeline, NivelRiesgo } from '../../types/timeline';
import { COLORES_RIESGO } from '../../types/timeline';

interface TimelineFiltersProps {
  eventos: EventoTimeline[];
  filtros: FiltrosTimeline;
  onChange: (filtros: FiltrosTimeline) => void;
}

const NIVELES: NivelRiesgo[] = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];

export default function TimelineFilters({ eventos, filtros, onChange }: TimelineFiltersProps) {
  /**
   * Autores únicos en los eventos
   */
  const autoresUnicos = Array.from(new Set(eventos.map((e) => e.autor)));

  /**
   * Archivos únicos
   */
  const archivosUnicos = Array.from(new Set(eventos.map((e) => e.archivo)));

  /**
   * Toggle de severidad
   */
  const toggleSeveridad = (nivel: NivelRiesgo) => {
    const actuals = filtros.severidad || [];
    const siguientes = actuals.includes(nivel)
      ? actuals.filter((s) => s !== nivel)
      : [...actuals, nivel];
    onChange({ ...filtros, severidad: siguientes.length ? siguientes : undefined });
  };

  /**
   * Limpiar todos los filtros
   */
  const limpiarFiltros = () => onChange({});

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex flex-wrap gap-4 items-end">
        {/* Filtro de severidad */}
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium mb-1.5">Severidad</p>
          <div className="flex gap-1.5">
            {NIVELES.map((nivel) => {
              const activo = filtros.severidad?.includes(nivel);
              return (
                <button
                  key={nivel}
                  onClick={() => toggleSeveridad(nivel)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{
                    borderColor: COLORES_RIESGO[nivel],
                    backgroundColor: activo ? COLORES_RIESGO[nivel] : 'white',
                    color: activo ? 'white' : COLORES_RIESGO[nivel],
                  }}
                >
                  {nivel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtro de autor */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium mb-1.5 block">
            Autor
          </label>
          <select
            className="input-field text-sm py-1"
            value={filtros.autor || ''}
            onChange={(e) =>
              onChange({ ...filtros, autor: e.target.value || undefined })
            }
          >
            <option value="">Todos</option>
            {autoresUnicos.map((autor) => (
              <option key={autor} value={autor}>
                {autor}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de archivo */}
        <div>
          <label className="text-xs text-gray-500 uppercase font-medium mb-1.5 block">
            Archivo
          </label>
          <select
            className="input-field text-sm py-1"
            value={filtros.archivo || ''}
            onChange={(e) =>
              onChange({ ...filtros, archivo: e.target.value || undefined })
            }
          >
            <option value="">Todos</option>
            {archivosUnicos.map((archivo) => (
              <option key={archivo} value={archivo}>
                {archivo.split('/').pop()}
              </option>
            ))}
          </select>
        </div>

        {/* Limpiar filtros */}
        {hayFiltros && (
          <button
            onClick={limpiarFiltros}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
