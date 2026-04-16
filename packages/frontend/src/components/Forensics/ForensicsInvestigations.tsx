import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Users, GitBranch, Shield } from 'lucide-react';
import { apiService } from '../../services/api.service';
import ForensicTimelineVisual from '../Timeline/ForensicTimelineVisual';
import type { EventoTimeline } from '../../types/timeline';

// Mapeo de acciones inglesas a españolas
const ACTION_MAP: Record<string, 'AGREGADO' | 'MODIFICADO' | 'ELIMINADO'> = {
  ADDED: 'AGREGADO',
  MODIFIED: 'MODIFICADO',
  DELETED: 'ELIMINADO',
};

// Mapeo de niveles de riesgo ingleses a españoles
const RISK_MAP: Record<string, 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO'> = {
  LOW: 'BAJO',
  MEDIUM: 'MEDIO',
  HIGH: 'ALTO',
  CRITICAL: 'CRÍTICO',
};

export default function ForensicsInvestigations() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'summary'>('timeline');

  const { data: analysesData, isLoading: isLoadingAnalyses } = useQuery({
    queryKey: ['analyses-list-forensics'],
    queryFn: () => apiService.obtenerAnalisisGlobales({ limit: 20 }),
  });

  const { data: rawForensicEvents, isLoading: isLoadingEvents } = useQuery<any[]>({
    queryKey: ['forensic-events', selectedAnalysisId],
    queryFn: () => selectedAnalysisId ? apiService.obtenerEventosForenses(selectedAnalysisId) : Promise.resolve([]),
    enabled: !!selectedAnalysisId,
  });

  // Mapear eventos: traducir acciones, niveles de riesgo y campos de autor
  const forensicEvents: EventoTimeline[] = useMemo(() => {
    return (rawForensicEvents || []).map((e: any) => ({
      id: e.id,
      timestamp: e.timestamp,
      commit: e.commitHash || e.commit,
      autor: e.author || e.autor,
      archivo: e.file || e.archivo,
      funcion: e.function || e.funcion,
      accion: ACTION_MAP[e.action] || ACTION_MAP[e.accion] || e.accion || e.action,
      mensaje_commit: e.commitMessage || e.mensaje_commit,
      resumen_cambios: e.changesSummary || e.resumen_cambios,
      // Mapear nivel_riesgo si viene en inglés (riskLevel) o español (nivel_riesgo)
      nivel_riesgo: RISK_MAP[e.riskLevel] || RISK_MAP[e.nivel_riesgo] || e.nivel_riesgo || 'BAJO',
      indicadores_sospecha: e.suspicionIndicators || e.indicadores_sospecha || [],
      hallazgo_id: e.findingId || e.hallazgo_id,
    }));
  }, [rawForensicEvents]);

  const completedAnalyses = (analysesData?.data || []).filter((a: any) => a.status === 'COMPLETED');
  const selectedAnalysis = completedAnalyses.find((a: any) => a.id === selectedAnalysisId);

  useEffect(() => {
    if (!selectedAnalysisId && completedAnalyses.length > 0) {
      setSelectedAnalysisId(completedAnalyses[0].id);
    }
  }, [completedAnalyses, selectedAnalysisId]);

  // Summary statistics - using properly mapped events
  const stats = {
    totalEvents: forensicEvents?.length || 0,
    criticalEvents: forensicEvents?.filter((e: EventoTimeline) => e.nivel_riesgo === 'CRÍTICO').length || 0,
    affectedUsers: new Set(forensicEvents?.map((e: EventoTimeline) => e.autor).filter(Boolean) || []).size,
    affectedFiles: new Set(forensicEvents?.map((e: EventoTimeline) => e.archivo).filter(Boolean) || []).size,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Investigaciones Forenses</h2>
          <p className="text-sm text-[#A0A0A0]">
            Analiza la línea de tiempo completa de eventos forenses, usuarios y cambios de código
          </p>
        </div>

        {/* Session Selector */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#666666] mb-2">
              Sesión de Análisis
            </label>
            <select
              className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-all"
              value={selectedAnalysisId || ''}
              onChange={(e) => setSelectedAnalysisId(e.target.value)}
              disabled={isLoadingAnalyses}
            >
              {isLoadingAnalyses ? (
                <option value="">Cargando...</option>
              ) : completedAnalyses.length === 0 ? (
                <option value="">Sin registros completados</option>
              ) : (
                completedAnalyses.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.projectName || 'Análisis'} - {new Date(a.createdAt).toLocaleDateString('es-ES')}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedAnalysis && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Clock size={16} className="text-blue-400" />
              <span className="text-xs text-blue-300">
                {new Date(selectedAnalysis.createdAt).toLocaleString('es-ES')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* No data state */}
      {!selectedAnalysisId && (
        <div className="border border-dashed border-[#2D2D2D] rounded-lg p-8 text-center bg-[#1A1A1A]">
          <AlertTriangle className="w-10 h-10 text-[#666666] mx-auto mb-3" />
          <p className="text-white text-sm font-medium">Selecciona un análisis para comenzar</p>
          <p className="text-[#A0A0A0] text-xs mt-1">Elige una sesión de análisis para ver los eventos forenses</p>
        </div>
      )}

      {/* Data display */}
      {selectedAnalysisId && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#4B5563] transition-colors">
              <p className="text-xs text-[#A0A0A0] mb-2">Eventos Totales</p>
              <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
            </div>

            <div className="bg-[#1A1A1A] border border-red-500/20 rounded-lg p-4 hover:border-red-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-red-400" />
                <p className="text-xs text-red-300">Eventos Críticos</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.criticalEvents}</p>
            </div>

            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#4B5563] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} className="text-blue-400" />
                <p className="text-xs text-blue-300">Usuarios Afectados</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">{stats.affectedUsers}</p>
            </div>

            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#4B5563] transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch size={14} className="text-green-400" />
                <p className="text-xs text-green-300">Archivos Afectados</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{stats.affectedFiles}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Línea de Tiempo
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white'
                  : 'text-[#A0A0A0] hover:text-white'
              }`}
            >
              Resumen
            </button>
          </div>

          {/* Content */}
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            </div>
          ) : activeTab === 'timeline' ? (
            // Timeline View
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg overflow-hidden">
              {forensicEvents && forensicEvents.length > 0 ? (
                <ForensicTimelineVisual eventos={forensicEvents} />
              ) : (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-10 h-10 text-[#666666] mx-auto mb-3" />
                  <p className="text-[#A0A0A0]">No hay eventos forenses para este análisis</p>
                </div>
              )}
            </div>
          ) : (
            // Summary View
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Resumen de Investigación</h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[#111111] rounded-lg">
                    <span className="text-[#A0A0A0]">Total de Eventos</span>
                    <span className="text-white font-semibold">{stats.totalEvents}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#111111] rounded-lg border-l-2 border-red-500">
                    <span className="text-[#A0A0A0]">Eventos Críticos</span>
                    <span className="text-red-400 font-semibold">{stats.criticalEvents}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#111111] rounded-lg border-l-2 border-blue-500">
                    <span className="text-[#A0A0A0]">Usuarios Únicos</span>
                    <span className="text-blue-400 font-semibold">{stats.affectedUsers}</span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#111111] rounded-lg border-l-2 border-green-500">
                    <span className="text-[#A0A0A0]">Archivos Modificados</span>
                    <span className="text-green-400 font-semibold">{stats.affectedFiles}</span>
                  </div>
                </div>
              </div>

              {selectedAnalysis && (
                <div className="pt-4 border-t border-[#2D2D2D]">
                  <h4 className="text-sm font-semibold text-white mb-2">Detalles del Análisis</h4>
                  <div className="text-xs space-y-1">
                    <p><span className="text-[#A0A0A0]">Proyecto:</span> <span className="text-white">{selectedAnalysis.projectName}</span></p>
                    <p><span className="text-[#A0A0A0]">Estado:</span> <span className="text-green-400">{selectedAnalysis.status}</span></p>
                    <p><span className="text-[#A0A0A0]">Fecha:</span> <span className="text-white">{new Date(selectedAnalysis.createdAt).toLocaleString('es-ES')}</span></p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
