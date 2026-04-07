import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Activity,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertOctagon,
  ArrowUpRight,
  Target,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useNavigate } from 'react-router-dom';
import KPICard from './KPICard';
import type { Proyecto, Analisis } from '../../types/api';

interface DashboardProps {
  onVerAnalisis: (projectId: string, analysisId: string) => void;
  onVerLogs?: () => void;
  onCambiarTab?: (tab: string) => void;
}

const ACTIVE_STATUSES = ['PENDING', 'RUNNING', 'INSPECTOR_RUNNING', 'DETECTIVE_RUNNING', 'FISCAL_RUNNING'];

export default function Dashboard({ onVerAnalisis, onVerLogs, onCambiarTab }: DashboardProps) {
  const navigate = useNavigate();

  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data } = await apiService.get<any>('/analytics/summary');
      return data.data;
    },
    refetchInterval: 15_000,
  });

  const { data: proyectosData, isLoading: isLoadingProyectos } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 10_000,
  });

  const { data: alertsData, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: () => apiService.obtenerHallazgosGlobales({ limit: 5, isIncident: true }),
    refetchInterval: 15_000,
  });

  const proyectos: Proyecto[] = proyectosData?.data || [];
  const scansActivos = proyectos.filter((p) =>
    p.analyses?.some((a) => ACTIVE_STATUSES.includes(a.status))
  );

  const realAlerts = alertsData?.data || [];

  const stats = {
    totalProyectos: proyectos.length,
    analisisCompletados: analyticsData?.["totalAnalyses"] ?? 0,
    hallazgosCriticos: analyticsData?.["criticalFindings"] ?? 0,
    riskScoreGlobal: analyticsData?.["averageRiskScore"] ?? 0,
  };

  if (isLoadingAnalytics || isLoadingProyectos) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-3">
        <div className="w-8 h-8 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280]">Cargando monitor central...</span>
      </div>
    );
  }

  const healthColor =
    stats.riskScoreGlobal > 70 ? 'text-[#EF4444]' :
    stats.riskScoreGlobal > 40 ? 'text-[#EAB308]' : 'text-[#22C55E]';

  const recentReports = proyectos
    .flatMap((p) => (p.analyses || []).map((a) => ({ ...a, projectName: p.name })))
    .filter((a) => a.status === 'COMPLETED' && a.report)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5) as (Analisis & { projectName: string })[];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#2D2D2D] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs text-[#6B7280]">Monitorización activa</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Monitor Central</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onVerLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:border-[#404040] transition-all"
          >
            <Activity className="w-4 h-4" />
            Logs de agente
          </button>

          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl px-5 py-3 flex flex-col items-center">
            <span className="text-[10px] text-[#6B7280] mb-0.5">Health Index</span>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${healthColor}`}>
                {100 - stats.riskScoreGlobal}%
              </span>
              <div className="w-16 h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22C55E] rounded-full"
                  style={{ width: `${100 - stats.riskScoreGlobal}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Assets Protegidos"
          value={stats.totalProyectos}
          subtitle="repositorios en vigilancia"
          icon={<Shield className="w-5 h-5" />}
          accentColor="#F97316"
          onClick={() => navigate('/projects')}
        />
        <KPICard
          title="Scans Ejecutados"
          value={stats.analisisCompletados}
          subtitle="auditorías finalizadas"
          icon={<Activity className="w-5 h-5" />}
          accentColor="#6366F1"
          onClick={() => onCambiarTab && onCambiarTab('analyses')}
        />
        <KPICard
          title="Alerta de Riesgo"
          value={stats.hallazgosCriticos}
          subtitle="vulnerabilidades críticas"
          icon={<AlertOctagon className="w-5 h-5" />}
          accentColor="#EF4444"
          trend={{ value: 5, isPositive: false }}
          onClick={() => onCambiarTab && onCambiarTab('incidents')}
        />
        <KPICard
          title="Eficiencia"
          value="94%"
          subtitle="optimización de tokens"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="#22C55E"
          onClick={() => onCambiarTab && onCambiarTab('analytics')}
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Scans */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Orquestación en vivo</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Procesamiento de agentes IA</p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-[#F97316]/10 border border-[#F97316]/20 text-xs text-[#F97316]">
                {scansActivos.length} activos
              </span>
            </div>

            {scansActivos.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
                <Target className="w-7 h-7 text-[#2D2D2D]" />
                <p className="text-sm text-[#4B5563]">Sin procesos activos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scansActivos.slice(0, 3).map((p) => {
                  const running = p.analyses?.find((a: Analisis) => ACTIVE_STATUSES.includes(a.status));
                  return (
                    <div
                      key={p.id}
                      className="bg-[#242424] border border-[#2D2D2D] rounded-lg p-3.5 flex items-center justify-between group hover:border-[#404040] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center">
                          <Activity className="w-3.5 h-3.5 text-[#F97316] animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{p.name}</p>
                          <p className="text-xs text-[#6B7280]">{running?.status?.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end gap-1 min-w-[100px]">
                          <span className="text-xs text-white">{running?.progress ?? 0}%</span>
                          <div className="w-full h-1 bg-[#2D2D2D] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${running?.progress ?? 0}%` }}
                              className="h-full bg-[#F97316] rounded-full"
                            />
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#4B5563] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Alertas recientes</h3>
              <button 
                onClick={() => onCambiarTab && onCambiarTab('incidents')}
                className="text-xs text-[#F97316] hover:text-[#FB923C] transition-colors"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {realAlerts.length === 0 ? (
                <div className="text-center py-6 text-sm text-[#4B5563]">Sin alertas críticas recientes</div>
              ) : realAlerts.map((finding: any, i: number) => {
                const isCritical = finding.severity === 'CRITICAL';
                const isHigh = finding.severity === 'HIGH';
                const timeStr = new Date(finding.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={finding.id || i}
                    className="flex items-center gap-3 p-3.5 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#404040] transition-all cursor-pointer"
                    onClick={() => onCambiarTab && onCambiarTab('incidents')}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isCritical ? 'bg-[#EF4444]' :
                      isHigh     ? 'bg-[#FB923C]' : 'bg-[#EAB308]'
                    }`} />
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <p className="text-sm text-[#A0A0A0] truncate">{finding.riskType} en {finding.file}</p>
                      <p className="text-[10px] text-[#4B5563] truncate">Proyecto: {finding.analysis?.project?.name || 'Desconocido'}</p>
                    </div>
                    <span className="text-xs text-[#4B5563] whitespace-nowrap">{timeStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Reports */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">Últimos reportes</h3>
              <FileText className="w-4 h-4 text-[#6B7280]" />
            </div>

            <div className="space-y-4">
              {recentReports.length === 0 ? (
                <p className="text-sm text-[#4B5563] text-center py-4">Sin reportes aún</p>
              ) : recentReports.map((a) => (
                <button
                  key={a.id}
                  onClick={() => onVerAnalisis(a.projectId, a.id)}
                  className="w-full text-left group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-white group-hover:text-[#F97316] transition-colors truncate flex-1 mr-2">
                      {a.projectName}
                    </p>
                    <span className="text-xs text-[#4B5563]">
                      {new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#2D2D2D] group-hover:bg-[#F97316]/20 transition-colors" />
                    <span className="text-xs font-medium text-[#EAB308]">{a.report?.riskScore}/100</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate('/projects')}
              className="w-full mt-5 py-2.5 rounded-lg border border-[#2D2D2D] text-sm text-[#6B7280] hover:border-[#404040] hover:text-white transition-all"
            >
              Ver todos los assets
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-semibold text-white">Resumen de flujo</h4>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tasa de remediación', value: `${((analyticsData?.remediationRate || 0) * 100).toFixed(0)}%` },
                { label: 'Incidentes cerrados', value: analyticsData?.totalFindings 
                  ? Math.floor(analyticsData.totalFindings * (analyticsData.remediationRate || 0)).toString() 
                  : '0' },
                { label: 'Media de respuesta', value: analyticsData?.averageResolutionTime 
                  ? `${(analyticsData.averageResolutionTime / (1000 * 60 * 60)).toFixed(1)}h` 
                  : 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center cursor-pointer hover:bg-[#2A2A2A] p-2 -mx-2 rounded-lg transition-colors" onClick={() => onCambiarTab && onCambiarTab('analytics')}>
                  <span className="text-sm text-[#6B7280]">{label}</span>
                  <span className="text-sm font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
