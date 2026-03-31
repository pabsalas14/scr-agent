import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Activity,
  TrendingUp,
  Clock,
  ShieldCheck,
  Zap,
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
import { analyticsService } from '../../services/analytics.service';
import KPICard from '../Dashboard/KPICard';
import RiskScoreGauge from '../Analysis/RiskScoreGauge';
import LoadingBar from '../ui/LoadingBar';

const SEVERITY_COLORS = {
  critical: '#EF4444',
  high:     '#FB923C',
  medium:   '#EAB308',
  low:      '#22C55E',
};

const PIE_COLORS = ['#F97316', '#6366F1', '#22C55E', '#EF4444', '#EAB308', '#A0A0A0'];

export default function AnalyticsDashboard() {
  const [days, setDays] = useState(30);

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

  const avgResolutionHours = summary
    ? Math.round(summary.averageResolutionTime / (1000 * 60 * 60))
    : 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-xs text-[#6B7280]">Central de inteligencia estratégica</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Análisis Global</h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-xl">
            Consolidado de hallazgos, remediaciones y vectores de ataque en todo el perímetro analizado.
          </p>
        </div>

        <div className="flex items-center bg-[#1E1E20] border border-[#2D2D2D] rounded-lg p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                days === d ? 'bg-[#F97316] text-white' : 'text-[#6B7280] hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Hallazgos totales"
          value={summary?.totalFindings || 0}
          icon={<ShieldAlert className="w-4 h-4" />}
          accentColor="#EF4444"
          subtitle="Detectados en sistema"
        />
        <KPICard
          title="Tasa de remediación"
          value={`${Math.round((summary?.remediationRate || 0) * 100)}%`}
          icon={<ShieldCheck className="w-4 h-4" />}
          accentColor="#22C55E"
          subtitle="Hallazgos verificados"
        />
        <KPICard
          title="Tiempo promedio"
          value={`${avgResolutionHours}h`}
          icon={<Clock className="w-4 h-4" />}
          accentColor="#F97316"
          subtitle="Detección a resolución"
        />
        <KPICard
          title="Análisis ejecutados"
          value={summary?.totalAnalyses || 0}
          icon={<Zap className="w-4 h-4" />}
          accentColor="#6366F1"
          subtitle="Escaneos completados"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-5"
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#F97316]" /> Tendencia de amenazas
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">Detección acumulada {days} días</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SEVERITY_COLORS.critical} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SEVERITY_COLORS.high} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={SEVERITY_COLORS.high} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  fontSize={11}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis stroke="#6B7280" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E20', border: '1px solid #2D2D2D', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ fontWeight: '500' }}
                />
                <Area type="monotone" dataKey="critical" name="Crítico" stroke={SEVERITY_COLORS.critical} fillOpacity={1} fill="url(#colorCritical)" strokeWidth={2} />
                <Area type="monotone" dataKey="high" name="Alto" stroke={SEVERITY_COLORS.high} fillOpacity={1} fill="url(#colorHigh)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Severity Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <PieChartIcon className="w-4 h-4 text-[#EF4444]" /> Severidades
          </h3>
          <p className="text-xs text-[#6B7280] mb-5">Distribución de riesgo</p>

          <div className="space-y-4">
            {[
              { label: 'Crítico', value: summary?.criticalFindings || 0, color: SEVERITY_COLORS.critical },
              { label: 'Alto',    value: summary?.highFindings || 0,     color: SEVERITY_COLORS.high },
              { label: 'Medio',   value: summary?.mediumFindings || 0,   color: SEVERITY_COLORS.medium },
              { label: 'Bajo',    value: summary?.lowFindings || 0,      color: SEVERITY_COLORS.low },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#A0A0A0]">{item.label}</span>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
                <div className="h-1.5 w-full bg-[#2D2D2D] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / Math.max(summary?.totalFindings || 1, 1)) * 100}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-[#2D2D2D] text-center">
            <p className="text-xs text-[#6B7280] mb-1">Efectividad de remediación</p>
            <p className="text-2xl font-semibold text-[#22C55E]">
              {Math.round((summary?.remediationRate || 0) * 100)}%
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk Types */}
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
            <Layers className="w-4 h-4 text-[#6366F1]" /> Vectores de ataque
          </h3>
          <p className="text-xs text-[#6B7280] mb-4">Desglose por categoría de riesgo</p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={6} dataKey="value">
                  {typeData.map((_: unknown, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1E20', border: '1px solid #2D2D2D', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#A0A0A0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Score */}
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-5 flex flex-col items-center justify-center">
          <div className="text-center mb-4">
            <p className="text-xs text-[#6B7280]">Intensidad de amenaza global</p>
            <p className="text-sm font-semibold text-white mt-0.5">Índice de blindaje</p>
          </div>
          <RiskScoreGauge
            score={summary ? (summary.criticalFindings * 10 + summary.highFindings * 5) / (summary.totalFindings || 1) * 10 : 0}
            size={220}
            strokeWidth={12}
          />
          <div className="mt-4 bg-[#242424] border border-[#2D2D2D] px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-xs text-[#A0A0A0]">Monitoreo activo - Escaneo continuo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
