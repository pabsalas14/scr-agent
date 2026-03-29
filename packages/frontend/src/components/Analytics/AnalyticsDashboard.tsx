/**
 * ============================================================================
 * ANALYTICS DASHBOARD - VISTA GLOBAL DE SEGURIDAD
 * ============================================================================
 * 
 * Dashboard integral que agrega métricas de múltiples análisis:
 * - Resumen de hallazgos por severidad
 * - Tasa de remediación global
 * - Línea de tiempo de detección de vulnerabilidades
 * - Desglose por tipo de riesgo
 * - Tiempo medio de resolución
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Zap,
  Calendar,
  Layers,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { analyticsService, AnalyticsSummary, TimelineData, TypeData } from '../../services/analytics.service';
import KPICard from '../Dashboard/KPICard';
import RiskScoreGauge from '../Analysis/RiskScoreGauge';
import LoadingBar from '../ui/LoadingBar';

const SEVERITY_COLORS = {
  critical: '#FF3B3B',
  high: '#FF8A00',
  medium: '#FFD600',
  low: '#00FF94',
};

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);

  // Data Fetching
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsService.getSummary(),
  });

  const { data: timeline = [], isLoading: loadingTimeline } = useQuery({
    queryKey: ['analytics', 'timeline', days],
    queryFn: () => analyticsService.getTimeline(days),
  });

  const { data: typeData = [], isLoading: loadingType } = useQuery({
    queryKey: ['analytics', 'by-type'],
    queryFn: () => analyticsService.getByType(),
  });

  if (loadingSummary || loadingTimeline || loadingType) {
    return <LoadingBar />;
  }

  // Formatting resolution time (ms to hours)
  const avgResolutionHours = summary 
    ? Math.round(summary.averageResolutionTime / (1000 * 60 * 60)) 
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-10 pb-20 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">
            <Activity className="w-3 h-3" />
            <span>CENTRAL DE INTELIGENCIA</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter">ESTADÍSTICAS</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl leading-relaxed">
            Consolidado estratégico de hallazgos, remediaciones y vectores de ataque a través de todo el perímetro de código analizado.
          </p>
        </div>
        
        <div className="bg-[#0A0B10] border border-[#1F2937] rounded-2xl p-1.5 flex gap-1 h-fit">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                days === d ? 'bg-white text-black' : 'text-[#475569] hover:text-white'
              }`}
            >
              {d} DÍAS
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Primarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Hallazgos Totales" 
          value={summary?.totalFindings || 0} 
          icon={<ShieldAlert />} 
          accentColor="#FF3B3B" 
          subtitle="Detectados en sistema"
        />
        <KPICard 
          title="Tasa Remediación" 
          value={`${Math.round((summary?.remediationRate || 0) * 100)}%`} 
          icon={<ShieldCheck />} 
          accentColor="#00FF94" 
          subtitle="Hallazgos verificados"
        />
        <KPICard 
          title="Tiempo Promedio" 
          value={`${avgResolutionHours}h`} 
          icon={<Clock />} 
          accentColor="#00D1FF" 
          subtitle="Detección a resolución"
        />
        <KPICard 
          title="Análisis Ejecutados" 
          value={summary?.totalAnalyses || 0} 
          icon={<Zap />} 
          accentColor="#7000FF" 
          subtitle="Escaneos completados"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid lg:grid-cols-12 gap-8">
        {/* Timeline Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-8 bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-8 lg:p-10 space-y-8"
        >
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#00D1FF]" />
                Tendencia de Amenazas
              </h3>
              <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Detección acumulada {days} días</p>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.high} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={SEVERITY_COLORS.high} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  fontSize={10} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1F2937', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="critical" 
                  name="Crítico"
                  stroke={SEVERITY_COLORS.critical} 
                  fillOpacity={1} 
                  fill="url(#colorCritical)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="high" 
                  name="Alto"
                  stroke={SEVERITY_COLORS.high} 
                  fillOpacity={1} 
                  fill="url(#colorHigh)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Breakdown Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-4 space-y-8"
        >
          {/* Severity Breakdown Card */}
          <div className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-8 space-y-8 h-full">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#FF3B3B]" />
                Severidades
              </h3>
              <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Distribución de riesgo</p>
            </div>

            <div className="space-y-6">
              {[
                { label: 'Crítico', value: summary?.criticalFindings || 0, color: SEVERITY_COLORS.critical },
                { label: 'Alto', value: summary?.highFindings || 0, color: SEVERITY_COLORS.high },
                { label: 'Medio', value: summary?.mediumFindings || 0, color: SEVERITY_COLORS.medium },
                { label: 'Bajo', value: summary?.lowFindings || 0, color: SEVERITY_COLORS.low },
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">{item.label}</span>
                    <span className="text-lg font-black text-white">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#111218] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / (summary?.totalFindings || 1)) * 100}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-[#1F2937]">
               <div className="bg-[#111218] rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
                  <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Efectividad de Remediación</div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#00FF94]/5 blur-xl rounded-full scale-125" />
                    <div className="text-3xl font-black text-[#00FF94] tracking-tighter">
                      {Math.round((summary?.remediationRate || 0) * 100)}%
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Grid: Type Distribution and Resolution Stats */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Risk Types Pie Chart */}
        <section className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-10 space-y-10">
           <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#7000FF]" />
                Vectores de Ataque
              </h3>
              <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Desglose por categoría de riesgo</p>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#7000FF', '#00D1FF', '#00FF94', '#FF3B3B', '#FFD600', '#EC4899'
                      ][index % 6]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </section>

        {/* Global Risk Intensity Display */}
        <section className="bg-[#0A0B10] border border-[#1F2937] rounded-[2.5rem] p-10 flex flex-col items-center justify-center space-y-10">
           <div className="text-center space-y-2">
              <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Intensidad de Amenaza Global</h3>
              <p className="text-3xl font-black text-white tracking-tighter">ÍNDICE DE BLINDAJE</p>
           </div>
           
           <div className="relative group">
              <div className="absolute inset-0 bg-[#FF3B3B]/5 blur-[80px] rounded-full scale-150 group-hover:bg-[#FF3B3B]/10 transition-colors duration-1000" />
              <RiskScoreGauge score={summary ? (summary.criticalFindings * 10 + summary.highFindings * 5) / (summary.totalFindings || 1) * 10 : 0} size={280} strokeWidth={14} />
           </div>

           <div className="bg-[#111218] border border-[#1F2937] px-8 py-4 rounded-full flex items-center gap-4">
              <div className="animate-pulse w-2 h-2 rounded-full bg-[#FF3B3B]" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Monitoreo Activo - Escaneo Continuo</span>
           </div>
        </section>
      </div>
    </div>
  );
}
