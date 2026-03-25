/**
 * Card de un proyecto en el dashboard
 * Muestra info básica y permite iniciar análisis
 */

import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onVerAnalisis: (id: string) => void;
}

const SCOPE_LABELS: Record<string, string> = {
  REPOSITORIO: '📁 Repositorio',
  ORGANIZACION: '🏢 Organización',
  PULL_REQUEST: '📌 Pull Request',
};

export default function ProyectoCard({ proyecto, onVerAnalisis }: ProyectoCardProps) {
  /**
   * Análisis del proyecto
   */
  const { data: analisisData } = useQuery({
    queryKey: ['analyses', proyecto.id],
    queryFn: () => apiService.obtenerAnalisisDeProyecto(proyecto.id),
    refetchInterval: 5_000,
  });

  /**
   * Iniciar nuevo análisis
   */
  const iniciar = useMutation({
    mutationFn: () => apiService.iniciarAnalisis(proyecto.id),
    onSuccess: (analisis) => onVerAnalisis(analisis.id),
  });

  const analisisList = analisisData?.data || [];
  const ultimoAnalisis = analisisList[0];
  const enProceso = ultimoAnalisis?.status.includes('RUNNING');

  return (
    <div className="card bg-white p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 truncate">{proyecto.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{SCOPE_LABELS[proyecto.scope]}</p>
        </div>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
          {analisisList.length} análisis
        </span>
      </div>

      {/* URL */}
      <p className="text-xs font-mono text-blue-600 truncate mb-3">
        {proyecto.repositoryUrl}
      </p>

      {/* Último análisis */}
      {ultimoAnalisis && (
        <div className="bg-gray-50 rounded p-2 mb-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Último análisis</span>
            <EstadoChip status={ultimoAnalisis.status} />
          </div>
          {ultimoAnalisis.status === 'COMPLETADO' && (
            <div className="mt-1">
              <div className="bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-500 rounded-full h-1.5 transition-all"
                  style={{ width: `${ultimoAnalisis.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Descripción */}
      {proyecto.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{proyecto.description}</p>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <button
          className="button-primary flex-1 text-sm py-1.5 flex items-center justify-center gap-1"
          onClick={() => iniciar.mutate()}
          disabled={enProceso || iniciar.isPending}
        >
          {enProceso || iniciar.isPending ? '⏳ Analizando...' : '🔍 Analizar'}
        </button>
        {ultimoAnalisis?.status === 'COMPLETADO' && (
          <button
            className="button-secondary text-sm py-1.5 px-3"
            onClick={() => onVerAnalisis(ultimoAnalisis.id)}
            title="Ver último reporte"
          >
            📊
          </button>
        )}
      </div>
    </div>
  );
}

function EstadoChip({ status }: { status: string }) {
  const CONFIG: Record<string, { label: string; clase: string }> = {
    PENDIENTE: { label: 'Pendiente', clase: 'bg-gray-100 text-gray-600' },
    RUNNING: { label: 'En proceso', clase: 'bg-blue-100 text-blue-700' },
    INSPECTOR_RUNNING: { label: 'Inspector...', clase: 'bg-orange-100 text-orange-700' },
    DETECTIVE_RUNNING: { label: 'Detective...', clase: 'bg-purple-100 text-purple-700' },
    FISCAL_RUNNING: { label: 'Fiscal...', clase: 'bg-indigo-100 text-indigo-700' },
    COMPLETADO: { label: 'Completado', clase: 'bg-green-100 text-green-700' },
    ERROR: { label: 'Error', clase: 'bg-red-100 text-red-700' },
  };
  const cfg = CONFIG[status] || { label: status, clase: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${cfg.clase}`}>
      {cfg.label}
    </span>
  );
}
