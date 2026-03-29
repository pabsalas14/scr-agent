/**
 * Monitor de Costos - Premium Redesign
 * Desglose financiero de consumo de tokens y modelos IA
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  ChevronDown, 
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

const PERIODS = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
];

const MODEL_COLORS: Record<string, string> = {
  'gpt-4-turbo': '#7000FF',
  'gpt-3.5-turbo': '#00D1FF',
  'claude-3-opus': '#FF8A00',
  'claude-3-sonnet': '#EC4899',
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
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#8B5CF6]/20 border-t-[#8B5CF6] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Calculando Proyecciones Financieras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#8B5CF6]/10 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#8B5CF6]">
            <Target className="w-3 h-3" />
            <span>Control de Presupuesto Global</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">COSTOS</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl">
            Análisis detallado de inversión en tokens. Visualiza el gasto por modelo y optimiza el ROI de tus auditorías automáticas.
          </p>
        </div>
        
        <div className="flex items-center bg-[#0A0B10] border border-[#1F2937] rounded-3xl p-1.5 shadow-xl">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                period === p.id 
                  ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                  : 'text-[#64748B] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed border-[#1F2937] bg-transparent py-24 flex flex-col items-center justify-center space-y-6">
           <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] flex items-center justify-center text-[#3D4A5C]">
             <CreditCard className="w-10 h-10" />
           </div>
           <div className="text-center space-y-2">
              <h3 className="text-white font-black uppercase tracking-widest">Sin Consumo Detectado</h3>
              <p className="text-[#64748B] text-xs max-w-xs leading-relaxed">
                Los costos se calculan basándose en los análisis completados. Inicia un nuevo escaneo para ver datos financieros.
              </p>
           </div>
        </Card>
      ) : (
        <>
          {/* Main KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden bg-gradient-to-br from-[#8B5CF6]/10 to-transparent border-white/[0.05]">
               <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Gasto Total ({period})</p>
                  <p className="text-4xl font-black text-white tracking-tighter">${costs.totalCostUSD.toFixed(2)} <span className="text-xl text-[#64748B] ml-1">USD</span></p>
               </div>
               <DollarSign className="absolute top-4 right-4 w-12 h-12 text-[#8B5CF6] opacity-20" />
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-[#00D1FF]/10 to-transparent border-white/[0.05]">
               <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Tokens Procesados</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {costs.entries.reduce((acc: number, curr: any) => acc + curr.inputTokens + curr.outputTokens, 0).toLocaleString()}
                  </p>
               </div>
               <BarChart3 className="absolute top-4 right-4 w-12 h-12 text-[#00D1FF] opacity-20" />
            </Card>

            <Card className="relative overflow-hidden bg-gradient-to-br from-[#00FF94]/10 to-transparent border-white/[0.05]">
               <div className="space-y-1 relative z-10">
                  <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Llamadas API</p>
                  <p className="text-4xl font-black text-white tracking-tighter">
                    {costs.entries.reduce((acc: number, curr: any) => acc + curr.calls, 0)}
                  </p>
               </div>
               <Zap className="absolute top-4 right-4 w-12 h-12 text-[#00FF94] opacity-20" />
            </Card>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Chart Area */}
            <div className="lg:col-span-8">
              <Card className="h-full border-white/[0.03] space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                     <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
                     Distribución por Modelo
                   </h3>
                </div>
                
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costs.entries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                      <XAxis 
                        dataKey="model" 
                        stroke="#475569" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val.split('-').pop()?.toUpperCase() || val}
                      />
                      <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0B10', borderColor: '#1F2937', borderRadius: '16px' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="costUSD" radius={[6, 6, 0, 0]}>
                        {costs.entries.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={MODEL_COLORS[entry.model] || '#8B5CF6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* List area */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-4">Desglose Técnico</h3>
              <div className="space-y-4">
                {costs.entries.map((entry: any, i: number) => (
                  <motion.div
                    key={entry.model}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="bg-[#0A0B10] border border-[#1F2937] p-6 rounded-3xl space-y-4 group hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[entry.model] || '#8B5CF6', boxShadow: `0 0 10px ${MODEL_COLORS[entry.model] || '#8B5CF6'}60` }} />
                            <span className="text-xs font-black text-white uppercase tracking-tight">{entry.model}</span>
                         </div>
                         <span className="text-sm font-black text-white">${entry.costUSD.toFixed(2)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-[#475569] uppercase tracking-widest">Input Tokens</p>
                            <p className="text-xs font-black text-white">{entry.inputTokens.toLocaleString()}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[9px] font-bold text-[#475569] uppercase tracking-widest">Output Tokens</p>
                            <p className="text-xs font-black text-white">{entry.outputTokens.toLocaleString()}</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 rounded-3xl bg-black/40 border border-[#8B5CF6]/20 space-y-3">
                 <div className="flex items-center gap-2 text-[#8B5CF6]">
                    <PieChartIcon className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nota de Facturación</span>
                 </div>
                 <p className="text-[10px] text-[#64748B] leading-relaxed">
                   Los precios se basan en tarifas oficiales de los proveedores (OpenAI, Anthropic). No incluyen impuestos aplicables ni créditos promocionales.
                 </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
