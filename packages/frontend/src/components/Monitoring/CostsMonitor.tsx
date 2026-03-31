import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  Zap,
  CreditCard,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';

interface CostEntry {
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
}

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week',  label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const MODEL_COLORS: Record<string, string> = {
  'claude-opus-4-6':           '#F97316',
  'claude-sonnet-4-6':         '#6366F1',
  'claude-haiku-4-5-20251001': '#22C55E',
  'claude-3-7-sonnet-20250219':'#FB923C',
  'claude-3-5-sonnet-20241022':'#A78BFA',
  'claude-3-5-haiku-20241022': '#34D399',
  'claude-3-opus-20240229':    '#F59E0B',
  'claude-3-opus':             '#F97316',
  'claude-3-sonnet':           '#6366F1',
};

export default function CostsMonitor() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');

  const { data: costs, isLoading } = useQuery({
    queryKey: ['costs', period],
    queryFn: () => monitoringService.getCosts(period),
    refetchInterval: 10000,
  });

  const hasData = costs && costs.entries.length > 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <div className="w-8 h-8 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280]">Calculando proyecciones financieras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
            <span className="text-xs text-[#6B7280]">Control de presupuesto global</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Costos</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Análisis de inversión en tokens y optimización de ROI.
          </p>
        </div>

        <div className="flex items-center bg-[#1E1E20] border border-[#2D2D2D] rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as 'today' | 'week' | 'month')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                period === p.id
                  ? 'bg-[#F97316] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed border-[#2D2D2D] bg-transparent py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] flex items-center justify-center text-[#4B5563]">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Sin consumo detectado</p>
            <p className="text-xs text-[#6B7280] mt-1 max-w-xs">
              Los costos se calculan tras completar análisis. Inicia un escaneo para ver datos financieros.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: `Gasto total (${period})`,
                value: `$${costs.totalCostUSD.toFixed(2)}`,
                unit: 'USD',
                icon: DollarSign,
                color: '#F97316',
              },
              {
                label: 'Tokens procesados',
                value: costs.entries.reduce((acc: number, curr: CostEntry) => acc + curr.inputTokens + curr.outputTokens, 0).toLocaleString(),
                icon: Zap,
                color: '#6366F1',
              },
              {
                label: 'Llamadas API',
                value: costs.entries.reduce((acc: number, curr: CostEntry) => acc + curr.calls, 0).toString(),
                icon: Target,
                color: '#22C55E',
              },
            ].map((kpi, i) => (
              <div key={i} className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 hover:border-[#404040] transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                    <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                </div>
                <p className="text-xs text-[#6B7280] mb-1">{kpi.label}</p>
                <p className="text-2xl font-semibold text-white">
                  {kpi.value}
                  {kpi.unit && <span className="text-sm text-[#6B7280] ml-1">{kpi.unit}</span>}
                </p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2D2D2D]">
                <TrendingUp className="w-4 h-4 text-[#F97316]" />
                <h3 className="text-sm font-medium text-white">Distribución por modelo</h3>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costs.entries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                    <XAxis
                      dataKey="model"
                      stroke="#6B7280"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => val.split('-').pop()?.toUpperCase() || val}
                    />
                    <YAxis stroke="#6B7280" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={{
                        backgroundColor: '#1E1E20',
                        border: '1px solid #2D2D2D',
                        borderRadius: '12px',
                      }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Bar dataKey="costUSD" radius={[4, 4, 0, 0]} barSize={36}>
                      {costs.entries.map((entry: CostEntry, index: number) => (
                        <Cell key={`cell-${index}`} fill={MODEL_COLORS[entry.model] || '#F97316'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Model List */}
            <div className="space-y-3">
              {costs.entries.map((entry: CostEntry, i: number) => (
                <motion.div
                  key={entry.model}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-3.5 hover:border-[#404040] transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MODEL_COLORS[entry.model] || '#F97316' }}
                      />
                      <span className="text-xs font-medium text-white">{entry.model}</span>
                    </div>
                    <span className="text-sm font-semibold text-white">${entry.costUSD.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2D2D2D]">
                    <div>
                      <p className="text-xs text-[#6B7280]">Entrada</p>
                      <p className="text-xs font-medium text-white">{entry.inputTokens.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#6B7280]">Salida</p>
                      <p className="text-xs font-medium text-white">{entry.outputTokens.toLocaleString()}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="p-3 rounded-xl bg-[#1E1E20] border border-[#2D2D2D]">
                <p className="text-xs text-[#6B7280]">
                  Tarifas oficiales Anthropic. No incluye impuestos.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
