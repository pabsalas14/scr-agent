import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Play, Settings as SettingsIcon, Server, Box, GitPullRequest, Laptop,
  Activity, AlertTriangle, CheckCircle2, Clock, GitBranch, ExternalLink,
  ChevronDown, Zap, ShieldAlert, DollarSign, Loader2, Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';
import ProjectDetailView from './ProjectDetailView';
import { useAnalysisViewer } from '../../context/AnalysisViewerContext';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onVerAnalisis: (projectId: string, analysisId: string) => void;
}

const SCOPE_CONFIG: Record<string, { label: string; icon: LucideIcon }> = {
  REPOSITORY:   { label: 'Repositorio',   icon: Server },
  ORGANIZATION: { label: 'Organización',  icon: Box },
  PULL_REQUEST: { label: 'Pull Request',  icon: GitPullRequest },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; icon: LucideIcon }> = {
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
   const [mostrarMenuAnalisis, setMostrarMenuAnalisis] = useState(false);
   const { openAnalysisViewer } = useAnalysisViewer();

   const { data: analisisData } = useQuery({
     queryKey: ['analyses', proyecto.id],
     queryFn: () => apiService.obtenerAnalisisDeProyecto(proyecto.id),
     refetchInterval: 5_000,
   });

   const { data: costEstimate, isLoading: loadingEstimate } = useQuery({
     queryKey: ['project_estimate', proyecto.id],
     queryFn: () => apiService.obtenerEstimadoCosto(proyecto.id),
     enabled: mostrarMenuAnalisis, // Solo cargar cuando el menu se abre
     staleTime: 5 * 60 * 1000,
   });

   const iniciar = useMutation({
     mutationFn: (isIncremental: boolean = false) => apiService.iniciarAnalisis(proyecto.id, isIncremental),
     onSuccess: (analisis) => {
       // Abrir modal de progreso en tiempo real
       openAnalysisViewer(analisis.id, proyecto.id);
       // Mantener llamada original como fallback
       onVerAnalisis(proyecto.id, analisis.id);
     },
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

          {/* Quick Access to Active or Latest Analysis */}
          {ultimoAnalisis && (
            <motion.button
              onClick={() => openAnalysisViewer(ultimoAnalisis.id, proyecto.id)}
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative px-3 py-2.5 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                enProceso
                  ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/70 shadow-lg shadow-orange-500/10'
                  : ultimoAnalisis.status === 'COMPLETED'
                  ? 'bg-green-500/10 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-500/70 shadow-lg shadow-green-500/10'
                  : 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-500/70 shadow-lg shadow-red-500/10'
              }`}
              title={`Ver ${enProceso ? 'progreso en vivo' : 'análisis'}`}
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 max-w-0 group-hover:max-w-[60px] overflow-hidden">
                {enProceso ? 'En vivo' : 'Ver análisis'}
              </span>
            </motion.button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 flex items-stretch">
              <button
                onClick={() => iniciar.mutate(false)} // Por defecto Completo si se da click al principal
                disabled={enProceso || iniciar.isPending}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-l-lg text-sm font-medium transition-all ${
                  enProceso || iniciar.isPending
                    ? 'bg-[#242424] text-[#4B5563] cursor-not-allowed border-r border-[#2D2D2D]'
                    : 'bg-[#F97316] text-white hover:bg-[#EA6D00] shadow-sm border-r border-[#EA6D00]'
                }`}
              >
                {enProceso || iniciar.isPending ? (
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {enProceso || iniciar.isPending ? 'Analizando...' : 'Auditoría'}
              </button>
              
              <button
                onClick={() => !enProceso && !iniciar.isPending && setMostrarMenuAnalisis(!mostrarMenuAnalisis)}
                disabled={enProceso || iniciar.isPending}
                className={`px-2 rounded-r-lg transition-all border-l border-white/10 ${
                  enProceso || iniciar.isPending
                    ? 'bg-[#242424] text-[#4B5563] cursor-not-allowed'
                    : 'bg-[#F97316] text-white hover:bg-[#EA6D00]'
                }`}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${mostrarMenuAnalisis ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Menu para Modo de Análisis */}
            <AnimatePresence>
              {mostrarMenuAnalisis && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMostrarMenuAnalisis(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-[#1C1C1E] border border-[#2D2D2D] rounded-xl shadow-2xl z-20 space-y-1"
                  >
                    <button
                      onClick={() => {
                        iniciar.mutate(false);
                        setMostrarMenuAnalisis(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#242424] text-left group transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Auditoría Completa</p>
                        <p className="text-[10px] text-[#6B7280]">Escaneo profundo de todo el código</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        iniciar.mutate(true);
                        setMostrarMenuAnalisis(false);
                      }}
                      disabled={!ultimoAnalisis}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left group transition-colors ${
                        !ultimoAnalisis ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#242424]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Auditoría Incremental</p>
                        <p className="text-[10px] text-[#6B7280]">
                          {ultimoAnalisis ? 'Analizar solo cambios recientes' : 'Requiere un análisis previo'}
                        </p>
                      </div>
                    </button>
                    <div className="px-3 py-2 border-t border-[#2D2D2D] mt-1 bg-[#242424]/50 rounded-b-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3 text-[#22C55E]" />
                          <span className="text-[10px] font-bold text-[#A0A0A0] uppercase tracking-wider">Presupuesto Estimado</span>
                        </div>
                        {loadingEstimate ? (
                          <Loader2 className="w-3 h-3 text-[#6B7280] animate-spin" />
                        ) : (
                          <span className="text-xs font-mono font-bold text-white">${costEstimate?.costUsd?.toFixed(2) || '0.00'} <span className="text-[9px] text-[#6B7280] font-normal">USD</span></span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-[#6B7280]">Tokens: {costEstimate?.tokens?.toLocaleString() || '---'}</span>
                        <div className="flex items-center gap-1">
                           <Sparkles className="w-2.5 h-2.5 text-[#EAB308]" />
                           <span className="text-[9px] text-[#22C55E] font-medium">Ahorra -80% con Incremental</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>


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
        onVerAnalisis={onVerAnalisis}
      />
    </>
  );
}
