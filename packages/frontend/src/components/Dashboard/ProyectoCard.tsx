/**
 * Card de un proyecto en el dashboard
 * Muestra info básica y permite iniciar análisis
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { Eye, Play } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';
import Button from '../ui/Button';
import Card from '../ui/Card';

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
    <Card interactive elevated={!!ultimoAnalisis}>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{proyecto.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{SCOPE_LABELS[proyecto.scope]}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-md font-medium">
            {analisisList.length}
          </span>
        </div>
      </div>

      {/* URL */}
      <p className="text-xs font-mono text-blue-600 dark:text-blue-400 truncate mb-3 hover:text-clip break-all">
        {proyecto.repositoryUrl}
      </p>

      {/* Descripción */}
      {proyecto.description && (
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{proyecto.description}</p>
      )}

      {/* Último análisis - si existe */}
      {ultimoAnalisis && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-md p-3 mb-4 text-xs border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 font-medium">Último análisis</span>
            <EstadoChip status={ultimoAnalisis.status} />
          </div>
          {ultimoAnalisis.status === 'COMPLETADO' && (
            <div className="mt-2">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 rounded-full h-2 transition-all"
                  style={{ width: `${ultimoAnalisis.progress || 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          onClick={() => iniciar.mutate()}
          disabled={enProceso || iniciar.isPending}
          isLoading={enProceso || iniciar.isPending}
        >
          <Play className="w-3.5 h-3.5" />
          {enProceso || iniciar.isPending ? 'Analizando...' : 'Analizar'}
        </Button>
        {ultimoAnalisis?.status === 'COMPLETADO' && (
          <Button
            variant="tertiary"
            size="md"
            onClick={() => onVerAnalisis(ultimoAnalisis.id)}
            title="Ver reporte"
            aria-label="Ver reporte"
          >
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function EstadoChip({ status }: { status: string }) {
  const CONFIG: Record<string, { label: string; clase: string }> = {
    PENDIENTE: { label: 'Pendiente', clase: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
    RUNNING: { label: 'En proceso', clase: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200' },
    INSPECTOR_RUNNING: { label: 'Inspector...', clase: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200' },
    DETECTIVE_RUNNING: { label: 'Detective...', clase: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200' },
    FISCAL_RUNNING: { label: 'Fiscal...', clase: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' },
    COMPLETADO: { label: 'Completado', clase: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200' },
    ERROR: { label: 'Error', clase: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' },
  };
  const cfg = CONFIG[status] || { label: status, clase: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.clase}`}>
      {cfg.label}
    </span>
  );
}
