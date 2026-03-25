/**
 * Controles de la visualización de timeline:
 * - Cambiar entre vista por commit y vista agrupada
 * - Exportar PNG / PDF
 * - Contadores de eventos
 */

import React from 'react';

interface TimelineControlsProps {
  totalEventos: number;
  eventosFiltrados: number;
  vistaGrupo: boolean;
  onToggleVista: () => void;
  onExportarPNG: () => void;
  onExportarPDF?: () => void;
}

export default function TimelineControls({
  totalEventos,
  eventosFiltrados,
  vistaGrupo,
  onToggleVista,
  onExportarPNG,
  onExportarPDF,
}: TimelineControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      {/* Contador */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          Mostrando <strong>{eventosFiltrados}</strong> de{' '}
          <strong>{totalEventos}</strong> eventos
        </span>
        {eventosFiltrados < totalEventos && (
          <span className="badge-medio text-xs">filtrado</span>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2">
        {/* Toggle vista */}
        <button
          onClick={onToggleVista}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title={vistaGrupo ? 'Ver por commit' : 'Agrupar por función'}
        >
          {vistaGrupo ? '📋 Por commit' : '🗂 Por función'}
        </button>

        {/* Exportar PNG */}
        <button
          onClick={onExportarPNG}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
          title="Exportar como SVG/PNG"
        >
          📥 PNG
        </button>

        {/* Exportar PDF */}
        {onExportarPDF && (
          <button
            onClick={onExportarPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
            title="Exportar como PDF"
          >
            📄 PDF
          </button>
        )}
      </div>
    </div>
  );
}
