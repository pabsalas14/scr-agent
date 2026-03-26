import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onVerAnalisis: (id: string) => void;
}

const SCOPE_CONFIG: Record<string, { label: string; color: string }> = {
  REPOSITORY:   { label: 'Repositorio',  color: 'bg-violet-50 text-violet-700' },
  ORGANIZATION: { label: 'Organizacion', color: 'bg-sky-50 text-sky-700' },
  PULL_REQUEST: { label: 'Pull Request', color: 'bg-rose-50 text-rose-700' },
};

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:          { label: 'Pendiente',   cls: 'status-pending',  dot: 'bg-slate-400' },
  RUNNING:          { label: 'En proceso',  cls: 'status-running',  dot: 'bg-blue-500 animate-pulse' },
  INSPECTOR_RUNNING:{ label: 'Inspector',   cls: 'status-running',  dot: 'bg-orange-500 animate-pulse' },
  DETECTIVE_RUNNING:{ label: 'Detective',   cls: 'status-running',  dot: 'bg-purple-500 animate-pulse' },
  FISCAL_RUNNING:   { label: 'Fiscal',      cls: 'status-running',  dot: 'bg-indigo-500 animate-pulse' },
  COMPLETED:        { label: 'Completado',  cls: 'status-done',     dot: 'bg-emerald-500' },
  FAILED:           { label: 'Error',       cls: 'status-failed',   dot: 'bg-red-500' },
  PARTIAL:          { label: 'Parcial',     cls: 'status-partial',  dot: 'bg-amber-500' },
};

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace('www.','') + u.pathname;
  } catch {
    return url;
  }
}

export default function ProyectoCard({ proyecto, onVerAnalisis }: ProyectoCardProps) {
  const { data: analisisData } = useQuery({
    queryKey: ['analyses', proyecto.id],
    queryFn: () => apiService.obtenerAnalisisDeProyecto(proyecto.id),
    refetchInterval: 5_000,
  });

  const iniciar = useMutation({
    mutationFn: () => apiService.iniciarAnalisis(proyecto.id),
    onSuccess: (analisis) => onVerAnalisis(analisis.id),
  });

  const analisisList = analisisData || [];
  const ultimo = analisisList[0];
  const enProceso = ultimo?.status.includes('RUNNING') || iniciar.isPending;
  const scope = SCOPE_CONFIG[proyecto.scope] ?? { label: proyecto.scope, color: 'bg-slate-100 text-slate-600' };
  const statusCfg = ultimo ? (STATUS_CONFIG[ultimo.status] ?? { label: ultimo.status, cls: 'status-pending', dot: 'bg-slate-400' }) : null;

  return (
    <div className="card-hover flex flex-col h-full">
      {/* Top bar */}
      <div className="px-5 pt-5 pb-4 flex-1">

        {/* Scope + count */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${scope.color}`}>
            {scope.label}
          </span>
          <span className="text-xs text-slate-400">
            {analisisList.length} analisis
          </span>
        </div>

        {/* Name */}
        <h3 className="font-semibold text-slate-900 truncate text-[15px] mb-1">
          {proyecto.name}
        </h3>

        {/* URL */}
        <p className="code-text text-[11px] truncate mb-3 max-w-full block" title={proyecto.repositoryUrl}>
          {shortUrl(proyecto.repositoryUrl)}
        </p>

        {/* Description */}
        {proyecto.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {proyecto.description}
          </p>
        )}

        {/* Last analysis status */}
        {statusCfg && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className={`status-dot ${statusCfg.dot} w-2 h-2 rounded-full flex-shrink-0`} />
            <span className={`text-xs font-medium ${
              statusCfg.cls === 'status-done' ? 'text-emerald-700' :
              statusCfg.cls === 'status-running' ? 'text-blue-700' :
              statusCfg.cls === 'status-failed' ? 'text-red-700' :
              'text-slate-600'
            }`}>
              {statusCfg.label}
            </span>
            {ultimo?.status === 'COMPLETED' && typeof ultimo.progress === 'number' && (
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-16 bg-slate-200 rounded-full h-1">
                  <div
                    className="bg-emerald-500 h-1 rounded-full transition-all"
                    style={{ width: `${ultimo.progress}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{ultimo.progress}%</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-2 pt-3 border-t border-slate-100">
        <button
          className={`btn flex-1 text-sm py-2 ${enProceso ? 'btn-secondary' : 'btn-primary'}`}
          onClick={() => iniciar.mutate()}
          disabled={enProceso}
        >
          {enProceso ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Analizando...</span>
            </>
          ) : (
            <>
              <span>▶</span>
              <span>Analizar</span>
            </>
          )}
        </button>

        {ultimo?.status === 'COMPLETED' && (
          <button
            className="btn-secondary px-3 py-2 text-sm"
            onClick={() => onVerAnalisis(ultimo.id)}
            title="Ver reporte"
          >
            📊
          </button>
        )}
      </div>
    </div>
  );
}
