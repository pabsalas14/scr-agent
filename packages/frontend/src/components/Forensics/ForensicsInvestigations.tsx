import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Clock, Users, GitBranch, Shield, ChevronDown, X } from 'lucide-react';
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
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'user' | 'file' | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showFileDropdown, setShowFileDropdown] = useState(false);

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

  // Extract unique users and files
  const affectedUsersList = useMemo(() =>
    Array.from(new Set(forensicEvents?.map((e: EventoTimeline) => e.autor).filter(Boolean) || [])).sort(),
    [forensicEvents]
  );

  const affectedFilesList = useMemo(() =>
    Array.from(new Set(forensicEvents?.map((e: EventoTimeline) => e.archivo).filter(Boolean) || [])).sort(),
    [forensicEvents]
  );

  // Summary statistics - using properly mapped events
  const stats = {
    totalEvents: forensicEvents?.length || 0,
    criticalEvents: forensicEvents?.filter((e: EventoTimeline) => e.nivel_riesgo === 'CRÍTICO').length || 0,
    affectedUsers: affectedUsersList.length,
    affectedFiles: affectedFilesList.length,
  };

  // Filtered events based on selected filters
  const filteredForensicEvents = useMemo(() => {
    let filtered = forensicEvents;

    if (filterType === 'critical') {
      filtered = filtered.filter((e: EventoTimeline) => e.nivel_riesgo === 'CRÍTICO');
    } else if (filterType === 'user' && selectedUser) {
      filtered = filtered.filter((e: EventoTimeline) => e.autor === selectedUser);
    } else if (filterType === 'file' && selectedFile) {
      filtered = filtered.filter((e: EventoTimeline) => e.archivo === selectedFile);
    }

    return filtered;
  }, [forensicEvents, filterType, selectedUser, selectedFile]);

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
          {/* Summary Cards - Clickable */}
          <div className="grid grid-cols-4 gap-4">
            {/* Total Events Card */}
            <button
              onClick={() => {
                setFilterType('all');
                setSelectedUser(null);
                setSelectedFile(null);
                setActiveTab('timeline');
              }}
              className={`text-left rounded-lg p-4 transition-all border-2 cursor-pointer group ${
                filterType === 'all'
                  ? 'bg-blue-500/10 border-blue-500 text-white'
                  : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#4B5563]'
              }`}
            >
              <p className="text-xs text-[#A0A0A0] mb-2 group-hover:text-blue-300 transition-colors">Eventos Totales</p>
              <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
            </button>

            {/* Critical Events Card */}
            <button
              onClick={() => {
                setFilterType('critical');
                setSelectedUser(null);
                setSelectedFile(null);
                setActiveTab('timeline');
              }}
              className={`text-left rounded-lg p-4 transition-all border-2 cursor-pointer group ${
                filterType === 'critical'
                  ? 'bg-red-500/10 border-red-500 text-white'
                  : 'bg-[#1A1A1A] border-red-500/20 hover:border-red-500/40'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className={filterType === 'critical' ? 'text-red-400' : 'text-red-400'} />
                <p className="text-xs text-red-300">Eventos Críticos</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{stats.criticalEvents}</p>
            </button>

            {/* Affected Users Card */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowFileDropdown(false);
                }}
                className={`w-full text-left rounded-lg p-4 transition-all border-2 cursor-pointer group ${
                  filterType === 'user'
                    ? 'bg-blue-500/10 border-blue-500 text-white'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#4B5563]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Users size={14} className="text-blue-400" />
                      <p className="text-xs text-blue-300">Usuarios Afectados</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{stats.affectedUsers}</p>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Users Dropdown */}
              {showUserDropdown && affectedUsersList.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#2D2D2D] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {affectedUsersList.map((user) => (
                    <button
                      key={user}
                      onClick={() => {
                        setFilterType('user');
                        setSelectedUser(user);
                        setShowUserDropdown(false);
                        setActiveTab('timeline');
                      }}
                      className={`w-full text-left px-4 py-2 text-sm border-b border-[#2D2D2D] last:border-b-0 transition-colors ${
                        selectedUser === user
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-white'
                      }`}
                    >
                      {user}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Affected Files Card */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowFileDropdown(!showFileDropdown);
                  setShowUserDropdown(false);
                }}
                className={`w-full text-left rounded-lg p-4 transition-all border-2 cursor-pointer group ${
                  filterType === 'file'
                    ? 'bg-green-500/10 border-green-500 text-white'
                    : 'bg-[#1A1A1A] border-[#2D2D2D] hover:border-[#4B5563]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GitBranch size={14} className="text-green-400" />
                      <p className="text-xs text-green-300">Archivos Afectados</p>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{stats.affectedFiles}</p>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${showFileDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Files Dropdown */}
              {showFileDropdown && affectedFilesList.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#111111] border border-[#2D2D2D] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {affectedFilesList.map((file) => (
                    <button
                      key={file}
                      onClick={() => {
                        setFilterType('file');
                        setSelectedFile(file);
                        setShowFileDropdown(false);
                        setActiveTab('timeline');
                      }}
                      className={`w-full text-left px-4 py-2 text-xs border-b border-[#2D2D2D] last:border-b-0 transition-colors break-all font-mono ${
                        selectedFile === file
                          ? 'bg-green-500/20 text-green-300'
                          : 'text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-white'
                      }`}
                    >
                      {file}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Filter Badge */}
          {filterType && filterType !== 'all' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-blue-300">
                {filterType === 'critical' && 'Mostrando: Eventos Críticos'}
                {filterType === 'user' && `Mostrando: Eventos del usuario ${selectedUser}`}
                {filterType === 'file' && `Mostrando: Eventos del archivo ${selectedFile}`}
              </span>
              <button
                onClick={() => {
                  setFilterType('all');
                  setSelectedUser(null);
                  setSelectedFile(null);
                }}
                className="text-blue-300 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          )}

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
              {filteredForensicEvents && filteredForensicEvents.length > 0 ? (
                <ForensicTimelineVisual eventos={filteredForensicEvents} />
              ) : (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-10 h-10 text-[#666666] mx-auto mb-3" />
                  <p className="text-[#A0A0A0]">
                    {filterType && filterType !== 'all' ? 'No hay eventos que coincidan con el filtro' : 'No hay eventos forenses para este análisis'}
                  </p>
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
