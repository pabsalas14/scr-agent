/**
 * Panel de detalle de un evento de la línea de tiempo
 * Se muestra al hacer click en un nodo del SVG
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { EventoTimeline } from '../../types/timeline';
import { COLORES_RIESGO, COLORES_RIESGO_CLARO } from '../../types/timeline';
import BadgeRiesgo from '../shared/BadgeRiesgo';

interface TimelineEventProps {
  evento: EventoTimeline;
  onCerrar: () => void;
}

export default function TimelineEvent({ evento, onCerrar }: TimelineEventProps) {
  const color = COLORES_RIESGO[evento.nivel_riesgo];
  const colorClaro = COLORES_RIESGO_CLARO[evento.nivel_riesgo];

  const fecha = new Date(evento.timestamp).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="border rounded-lg p-5 shadow-sm"
      style={{ borderColor: color, backgroundColor: colorClaro }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <BadgeRiesgo nivel={evento.nivel_riesgo} />
          <span className="font-mono text-sm text-gray-600 bg-white px-2 py-0.5 rounded border">
            {evento.commit}
          </span>
        </div>
        <button
          onClick={onCerrar}
          className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Info principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Fecha</p>
          <p className="text-sm text-gray-800">{fecha}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Autor</p>
          <p className="text-sm text-gray-800">{evento.autor}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Archivo</p>
          <p className="text-sm font-mono text-gray-800">{evento.archivo}</p>
        </div>
        {evento.funcion && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium mb-1">Función</p>
            <p className="text-sm font-mono text-gray-800">{evento.funcion}</p>
          </div>
        )}
      </div>

      {/* Mensaje del commit */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase font-medium mb-1">Mensaje del commit</p>
        <p className="text-sm text-gray-800 italic">"{evento.mensaje_commit}"</p>
      </div>

      {/* Resumen de cambios */}
      {evento.resumen_cambios && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase font-medium mb-1">Resumen de cambios</p>
          <p className="text-sm text-gray-800">{evento.resumen_cambios}</p>
        </div>
      )}

      {/* Indicadores de sospecha */}
      {evento.indicadores_sospecha && evento.indicadores_sospecha.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase font-medium mb-2">Indicadores de sospecha</p>
          <ul className="space-y-1">
            {evento.indicadores_sospecha.map((ind, i) => (
              <li
                key={i}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span style={{ color }} className="mt-0.5">⚠</span>
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
