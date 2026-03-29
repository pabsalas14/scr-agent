/**
 * ============================================================================
 * COMMAND CENTER (DASHBOARD) - Vista de Resumen Estratégico
 * ============================================================================
 * 
 * Este componente es el núcleo de monitoreo global. Proporciona una vista
 * de alto nivel de la salud de seguridad, costos y actividad reciente de
 * todos los assets vinculados.
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  AlertOctagon,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useNavigate } from 'react-router-dom';
import KPICard from './KPICard';
import { useTheme } from '../../contexts/ThemeProvider';

interface DashboardProps {
  onVerAnalisis: (projectId: string, analysisId: string) => void;
  onVerLogs?: () => void;
}

export default function Dashboard({ onVerAnalisis, onVerLogs }: DashboardProps) {
  const navigate = useNavigate();
  const { theme } = useTheme();

  /**
   * Cargar datos analíticos globales
   */
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data } = await apiService.get('/analytics/summary');
      return (data as any).data;
    },
    refetchInterval: 15_000,
  });

  /**
   * Cargar proyectos para ver scans activos
   */
  const { data: proyectosData, isLoading: isLoadingProyectos } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 10_000,
  });

  const proyectos = proyectosData?.data || [];
  const scansActivos = proyectos.filter((p: any) => 
    p.analyses?.some((a: any) => !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(a.status))
  );

  const stats = {
    totalProyectos: proyectos.length,
    analisisCompletados: analyticsData?.totalAnalyses || 0,
    hallazgosCriticos: analyticsData?.criticalFindings || 0,
    riskScoreGlobal: analyticsData?.averageRiskScore || 0,
  };

  if (isLoadingAnalytics || isLoadingProyectos) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin" />
        <span className="text-[#64748B] font-black uppercase tracking-[0.3em] text-[10px]">Sincronizando Sistema...</span>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Strategic Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/[0.03] pb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_10px_#00FF94] animate-pulse" />
             <span className="text-[10px] font-black text-[#00FF94] uppercase tracking-[0.3em]">Protocolo de Monitorización Activo</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Monitor <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D1FF] to-[#7000FF]">Central</span>
          </h1>
          <p className="text-[#64748B] text-xs font-medium max-w-xl leading-relaxed uppercase tracking-tight">
            Consola centralizada para la supervisión de riesgos, costos operativos y orquestación de agentes automas de seguridad.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onVerLogs}
            className="group flex items-center gap-2.5 px-6 py-4 rounded-2xl bg-[#0A0B10]/40 border border-white/5 hover:border-[#00D1FF]/30 transition-all"
          >
            <Activity className="w-4 h-4 text-[#00D1FF]" />
            <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest group-hover:text-white transition-colors">Logs de Agente</span>
          </button>

          <div className="bg-[#0A0B10]/60 backdrop-blur-xl border border-white/[0.05] rounded-2xl px-8 py-4 flex flex-col items-center">
             <span className="text-[8px] font-black text-[#64748B] uppercase tracking-[0.2em] mb-1">Global Health Index</span>
             <div className="flex items-center gap-3">
                <span className={`text-2xl font-black tracking-tighter ${stats.riskScoreGlobal > 70 ? 'text-[#FF3B3B]' : stats.riskScoreGlobal > 40 ? 'text-[#F59E0B]' : 'text-[#00FF94]'}`}>
                  {100 - stats.riskScoreGlobal}%
                </span>
                <div className="w-20 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-gradient-to-r from-[#00FF94] to-[#00D1FF]" 
                     style={{ width: `${100 - stats.riskScoreGlobal}%` }} 
                   />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Primary KPIs - Premium Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Assets Protegidos"
          value={stats.totalProyectos}
          subtitle="repositorios en vigilancia"
          icon={<Shield className="w-5 h-5" />}
          accentColor="#00D1FF"
        />
        <KPICard
          title="Scans Ejecutados"
          value={stats.analisisCompletados}
          subtitle="auditorías finalizadas"
          icon={<Activity className="w-5 h-5" />}
          accentColor="#7000FF"
        />
        <KPICard
          title="Alerta de Riesgo"
          value={stats.hallazgosCriticos}
          subtitle="vulnerabilidades críticas"
          icon={<AlertOctagon className="w-5 h-5" />}
          accentColor="#FF3B3B"
          trend={{ value: 5, isPositive: false }}
        />
        <KPICard
          title="Eficiencia de Costos"
          value="94%"
          subtitle="optimización de tokens"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="#00FF94"
        />
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Active Processing & Incidents */}
        <div className="lg:col-span-8 space-y-8">
          {/* Active Scans */}
          <div className="bg-[#0A0B10]/40 backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Zap className="w-24 h-24 text-[#00D1FF]" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="space-y-1">
                 <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Orquestación en Vivo</h3>
                 <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Procesamiento de Agentes IA</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[#00D1FF]/10 border border-[#00D1FF]/20 text-[9px] font-black text-[#00D1FF] uppercase tracking-widest">
                {scansActivos.length} Activos
              </div>
            </div>

            {scansActivos.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                 <Target className="w-8 h-8 text-[#1F2937]" />
                 <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Sin procesos activos en el perímetro</p>
              </div>
            ) : (
              <div className="space-y-4 relative z-10">
                {scansActivos.slice(0, 3).map((p: any) => {
                  const running = p.analyses?.find((a: any) => !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(a.status));
                  return (
                    <div key={p.id} className="bg-white/[0.02] border border-white/[0.03] rounded-2xl p-4 flex items-center justify-between group hover:border-[#00D1FF]/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5">
                            <Activity className="w-4 h-4 text-[#00D1FF] animate-pulse" />
                         </div>
                         <div>
                            <p className="text-xs font-black text-white uppercase tracking-tight">{p.name}</p>
                            <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">{running?.status?.replace('_', ' ')}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end gap-1.5 min-w-[120px]">
                           <span className="text-[9px] font-black text-white">{running?.progress || 0}%</span>
                           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${running?.progress || 0}%` }}
                                className="h-full bg-gradient-to-r from-[#00D1FF] to-[#7000FF]" 
                              />
                           </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-[#475569] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Critical Alerts Section */}
          <div className="bg-[#0A0B10]/40 backdrop-blur-xl border border-white/[0.05] rounded-[2.5rem] p-8">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-8">Alertas de Seguridad Recientes</h3>
            <div className="space-y-4">
               {/* Mock alerts for UI preview until we have a real alerts API */}
               {[
                 { msg: 'Detección de Ofuscación en Core-Service', time: '2h ago', level: 'CRITICAL' },
                 { msg: 'Múltiples fallos de auth en API-Gateway', time: '5h ago', level: 'HIGH' },
                 { msg: 'Nuevo autor no identificado en repo Bank-Svc', time: '8h ago', level: 'MEDIUM' }
               ].map((alert, i) => (
                 <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all">
                   <div className={`w-2 h-2 rounded-full ${alert.level === 'CRITICAL' ? 'bg-[#FF3B3B]' : alert.level === 'HIGH' ? 'bg-[#F59E0B]' : 'bg-[#00D1FF]'}`} />
                   <p className="text-xs font-bold text-[#94A3B8] flex-1 truncate uppercase tracking-tight">{alert.msg}</p>
                   <span className="text-[9px] font-black text-[#475569] uppercase tracking-widest whitespace-nowrap">{alert.time}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Sidebar Intel Section */}
        <div className="lg:col-span-4 space-y-8">
          {/* Recent Reports List */}
          <div className="bg-gradient-to-b from-[#111218] to-[#0A0B10] border border-white/[0.05] rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Últimos Reportes</h3>
               <FileText className="w-4 h-4 text-[#7000FF]" />
            </div>
            
            <div className="space-y-6">
              {proyectos.flatMap(p => p.analyses || [])
                .filter(a => a.status === 'COMPLETED' && a.report)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((a: any) => (
                  <button 
                    key={a.id} 
                    onClick={() => onVerAnalisis(a.projectId, a.id)}
                    className="w-full text-left group space-y-2"
                  >
                    <div className="flex justify-between items-center group-hover:px-1 transition-all">
                      <p className="text-xs font-black text-white uppercase tracking-tight group-hover:text-[#00D1FF] truncate flex-1 mr-2">{proyectos.find(p => p.id === a.projectId)?.name}</p>
                      <span className="text-[9px] font-bold text-[#475569] uppercase tracking-widest">{new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex-1 h-0.5 bg-white/5 group-hover:bg-[#00D1FF]/20" />
                       <span className="text-[10px] font-black text-[#F59E0B] tracking-tighter">{a.report?.riskScore}/100</span>
                    </div>
                  </button>
                ))}
            </div>
            
            <button 
              onClick={() => navigate('/projects')}
              className="w-full mt-10 py-4 rounded-xl border border-white/10 text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] hover:bg-white/5 hover:text-[#00D1FF] transition-all"
            >
              Ver Todos los Assets
            </button>
          </div>

          {/* Quick Stats Panel */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#00D1FF]/5 to-[#7000FF]/5 border border-white/[0.05] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-10">
                <CheckCircle2 className="w-12 h-12 text-[#00FF94]" />
             </div>
             <div className="space-y-6 relative z-10">
                <h4 className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.3em]">Resumen de Flujo</h4>
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Tasa de Remediación</span>
                      <span className="text-sm font-black text-white tracking-tighter">82%</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Incidentes Cerrados</span>
                      <span className="text-sm font-black text-white tracking-tighter">124</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Media de Respuesta</span>
                      <span className="text-sm font-black text-white tracking-tighter">1.4h</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
