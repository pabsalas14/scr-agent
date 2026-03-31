import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Eye, Play, Settings as SettingsIcon, Server, Box, GitPullRequest, Laptop,
  Activity, AlertTriangle, CheckCircle2, Clock, GitBranch, ExternalLink
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';
import ProjectDetailView from './ProjectDetailView';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onVerAnalisis: (projectId: string, analysisId: string) => void;
}

const SCOPE_CONFIG: Record<string, { label: string; icon: any }> = {
  REPOSITORY:   { label: 'Repositorio',   icon: Server },
  ORGANIZATION: { label: 'Organización',  icon: Box },
  PULL_REQUEST: { label: 'Pull Request',  icon: GitPullRequest },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: any }> = {
  PENDING:           { label: 'En espera',    color: 'text-[#6B7280]',  dot: 'bg-[#6B7280]',  icon: Clock },
  RUNNING:           { label: 'Analizando',   color: 'text-[#F97316]',  dot: 'bg-[#F97316]',  icon: Activity },
  INSPECTOR_RUNNING: { label: 'Inspector',    color: 'text-[#EAB308]',  dot: 'bg-[#EAB308]',  icon: Activity },
  DETECTIVE_RUNNING: { label: 'Detective',    color: 'text-[#6366F1]',  dot: 'bg-[#6366F1]',  icon: Activity },
  FISCAL_RUNNING:    { label: 'Fiscal',       color: 'text-[#F97316]',  dot: 'bg-[#F97316]',  icon: Activity },
  COMPLETED:         { label: 'Completado',   color: 'text-[#22C55E]',  dot: 'bg-[#22C55E]',  icon: CheckCircle2 },
  FAILED:            { label: 'Fallido',      color: 'text-[#EF4444]',  dot: 'bg-[#EF4444]',  icon: AlertTriangle },
  ERROR:             { label: 'Error',        color: 'text-[#EF4444]',  dot: 'bg-[#EF4444]',  icon: AlertTriangle },
  CANCELLED:         { label: 'Cancelado',    color: 'text-[#EAB308]',  dot: 'bg-[#EAB308]',  icon: AlertTriangle },
};

export default function ProyectoCard({ proyecto, onVerAnalisis }: ProyectoCardProps) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);

  const { data: analisisData } = useQuery({
    queryKey: ['analyses', proyecto.id],
    queryFn: () => apiService.obtenerAnalisisDeProyecto(proyecto.id),
    refetchInterval: 5_000,
  });

  const iniciar = useMutation({
    mutationFn: () => apiService.iniciarAnalisis(proyecto.id),
    onSuccess: (analisis) => onVerAnalisis(proyecto.id, analisis.id),
  });

  const analisisList = analisisData || [];
  const ultimoAnalisis = analisisList[0];
  const enProceso = ultimoAnalisis && !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(ultimoAnalisis.status);
  const ScopeIcon = SCOPE_CONFIG[proyecto.scope]?.icon || Laptop;
  const scopeLabel = SCOPE_CONFIG[proyecto.scope]?.label || 'General';

  const statusCfg = ultimoAnalisis
    ? STATUS_CONFIG[ultimoAnalisis.status] || { label: ultimoAnalisis.status, color: 'text-[#6B7280]', dot: 'bg-[#6B7280]', icon: Activity }
    : null;
  const StatusIcon = statusCfg?.icon;

  const repoShort = proyecto.repositoryUrl
    .replace('https://github.com/', '')
    .replace('https://gitlab.com/', '')
    .replace('https://', '');

  return (
    <>
      <div className={`bg-[#1E1E20] border rounded-xl overflow-hidden transition-all duration-200 hover:border-[#404040] group ${
        enProceso ? 'border-[#F97316]/30' : 'border-[#2D2D2D]'
      }`}>
        {/* Top accent bar when active */}
        {enProceso && (
          <div className="h-0.5 bg-gradient-to-r from-[#F97316] to-[#EA6D00]" />
        )}

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                enProceso ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-[#242424] text-[#6B7280]'
              }`}>
                <ScopeIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{proyecto.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <GitBranch className="w-3 h-3 text-[#4B5563] flex-shrink-0" />
                  <p className="text-xs text-[#4B5563] font-mono truncate" title={proyecto.repositoryUrl}>
                    {repoShort}
                  </p>
                </div>
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${enProceso ? 'bg-[#F97316] animate-pulse' : 'bg-[#2D2D2D]'}`} />
          </div>

          {/* Status & Scope row */}
          <div className="flex items-center justify-between py-2.5 border-y border-[#2D2D2D]">
            <div className="flex items-center gap-1.5">
              {statusCfg && StatusIcon ? (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${enProceso ? 'animate-pulse' : ''}`} />
                  <span className={`text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                </>
              ) : (
                <span className="text-xs text-[#4B5563]">Sin análisis</span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#6B7280]">{analisisList.length} escaneos</span>
              <span className="text-[#2D2D2D]">·</span>
              <span className="text-xs text-[#4B5563]">{scopeLabel}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => iniciar.mutate()}
              disabled={enProceso || iniciar.isPending}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                enProceso || iniciar.isPending
                  ? 'bg-[#242424] text-[#4B5563] cursor-not-allowed'
                  : 'bg-[#F97316] text-white hover:bg-[#EA6D00] shadow-sm hover:shadow-[0_4px_12px_rgba(249,115,22,0.25)]'
              }`}
            >
              {enProceso || iniciar.isPending
                ? <Activity className="w-3.5 h-3.5 animate-spin" />
                : <Play className="w-3.5 h-3.5" />
              }
              {enProceso || iniciar.isPending ? 'Analizando...' : 'Iniciar auditoría'}
            </button>

            {ultimoAnalisis?.status === 'COMPLETED' && (
              <button
                onClick={() => onVerAnalisis(proyecto.id, ultimoAnalisis.id)}
                className="p-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-[#A0A0A0] hover:text-white hover:border-[#22C55E]/40 transition-all"
                title="Ver reporte"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setDetalleAbierto(true)}
              className="p-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-[#6B7280] hover:text-white hover:border-[#404040] transition-all"
              title="Configuración"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ProjectDetailView
        projectId={proyecto.id}
        isOpen={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        onProjectDeleted={() => setDetalleAbierto(false)}
      />
    </>
  );
}
