/**
 * Card de un proyecto en el dashboard
 * Muestra info básica y permite iniciar análisis
 */

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Eye, Play, Settings } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ProjectDetailView from './ProjectDetailView';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onVerAnalisis: (id: string) => void;
}

const SCOPE_LABELS: Record<string, string> = {
  REPOSITORY: '📁 Repositorio',
  ORGANIZATION: '🏢 Organización',
  PULL_REQUEST: '📌 Pull Request',
};

export default function ProyectoCard({ proyecto, onVerAnalisis }: ProyectoCardProps) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);

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

  const analisisList = analisisData || [];
  const ultimoAnalisis = analisisList[0];
  const enProceso = ultimoAnalisis?.status.includes('RUNNING');

  return (
    <Card interactive elevated={!!ultimoAnalisis} className="hover:border-blue-500/50 transition-all duration-300">
      {/* Header Section - Responsive */}
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white mb-1 line-clamp-2">
              {proyecto.name}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 whitespace-nowrap">
                {SCOPE_LABELS[proyecto.scope]}
              </span>
              <span className="text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30 whitespace-nowrap">
                {analisisList.length} análisis
              </span>
            </div>
          </div>
        </div>

        {/* Repository URL */}
        <p className="text-xs text-gray-400 font-mono mb-2 truncate hover:text-gray-300 transition-colors" title={proyecto.repositoryUrl}>
          {proyecto.repositoryUrl}
        </p>

        {/* Description */}
        {proyecto.description && (
          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 mb-2 sm:mb-3">
            {proyecto.description}
          </p>
        )}
      </div>

      {/* Status & Progress Section - Responsive */}
      {ultimoAnalisis && (
        <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Último Análisis
            </span>
            <EstadoChip status={ultimoAnalisis.status} />
          </div>

          {ultimoAnalisis.status === 'COMPLETADO' && (
            <div className="mt-2 sm:mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-500">Progreso</span>
                <span className="text-xs text-gray-400 font-medium">
                  {ultimoAnalisis.progress || 100}%
                </span>
              </div>
              <div className="w-full h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${ultimoAnalisis.progress || 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons - Responsive */}
      <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2">
        <Button
          variant="primary"
          size="sm"
          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2"
          onClick={() => iniciar.mutate()}
          disabled={enProceso || iniciar.isPending}
          isLoading={enProceso || iniciar.isPending}
        >
          <Play className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="hidden xs:inline">{enProceso || iniciar.isPending ? 'Analizando...' : 'Analizar'}</span>
          <span className="xs:hidden">{enProceso || iniciar.isPending ? '...' : '▶'}</span>
        </Button>
        {ultimoAnalisis?.status === 'COMPLETADO' && (
          <Button
            variant="secondary"
            size="sm"
            className="px-2 sm:px-3 py-1.5 sm:py-2"
            onClick={() => onVerAnalisis(ultimoAnalisis.id)}
            title="Ver reporte"
            aria-label="Ver reporte"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="px-2 sm:px-3 py-1.5 sm:py-2"
          onClick={() => setDetalleAbierto(true)}
          title="Ver detalles"
          aria-label="Ver detalles del proyecto"
        >
          <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {/* Modal de detalles */}
      <ProjectDetailView
        projectId={proyecto.id}
        isOpen={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        onProjectDeleted={() => {
          setDetalleAbierto(false);
          // Refresh projects list (parent handles this via query invalidation)
        }}
      />
    </Card>
  );
}

function EstadoChip({ status }: { status: string }) {
  const CONFIG: Record<string, { label: string; clase: string; icon: string }> = {
    PENDIENTE: { label: 'Pendiente', clase: 'bg-gray-500/20 text-gray-300 border border-gray-500/30', icon: '⏳' },
    RUNNING: { label: 'Analizando', clase: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse', icon: '⚡' },
    INSPECTOR_RUNNING: { label: 'Inspector', clase: 'bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse', icon: '🔍' },
    DETECTIVE_RUNNING: { label: 'Detective', clase: 'bg-purple-500/20 text-purple-300 border border-purple-500/30 animate-pulse', icon: '🔎' },
    FISCAL_RUNNING: { label: 'Fiscal', clase: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse', icon: '⚖️' },
    COMPLETADO: { label: 'Completado', clase: 'bg-green-500/20 text-green-300 border border-green-500/30', icon: '✅' },
    ERROR: { label: 'Error', clase: 'bg-red-500/20 text-red-300 border border-red-500/30', icon: '❌' },
  };
  const cfg = CONFIG[status] || { label: status, clase: 'bg-gray-500/20 text-gray-300 border border-gray-500/30', icon: '•' };
  return (
    <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex items-center gap-0.5 sm:gap-1 whitespace-nowrap flex-shrink-0 transition-all duration-200 ${cfg.clase}`}>
      <span className="text-sm">{cfg.icon}</span>
      <span className="hidden xs:inline">{cfg.label}</span>
    </span>
  );
}
