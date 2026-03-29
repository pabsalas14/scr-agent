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
        <div className="w-12 h-12 border-4 border-[#7000FF]/20 border-t-[#7000FF] rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Calculando Proyecciones Financieras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Refined Header - Budget Control */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#7000FF] shadow-[0_0_8px_#7000FF] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#7000FF]">Control de Presupuesto Global</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none uppercase">COSTOS</h1>
          <p className="text-[#64748B] text-xs font-medium max-w-lg leading-relaxed">
            Análisis detallado de inversión en tokens. Visualización de gasto por modelo y optimización de ROI en auditorías.
          </p>
        </div>
        
        <div className="flex items-center bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.05] rounded-[1.5rem] p-1 shadow-xl">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id as any)}
              className={`px-6 py-2 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${
                period === p.id 
                  ? 'bg-[#7000FF] text-white shadow-[0_0_15px_rgba(112,0,255,0.3)]' 
                  : 'text-[#475569] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <Card className="border-dashed border-white/[0.03] bg-[#0A0B10]/20 py-24 flex flex-col items-center justify-center space-y-6 rounded-[2.5rem]">
           <div className="w-16 h-16 rounded-[2rem] bg-white/[0.02] flex items-center justify-center text-[#3D4A5C]">
             <CreditCard className="w-8 h-8 opacity-40" />
           </div>
           <div className="text-center space-y-2">
              <h3 className="text-white text-xs font-black uppercase tracking-widest">Sin Consumo Detectado</h3>
              <p className="text-[#64748B] text-[10px] max-w-xs leading-relaxed uppercase tracking-tight font-medium">
                Los costos se calculan basándose en los análisis completados. Inicia un nuevo escaneo para ver datos financieros.
              </p>
           </div>
        </Card>
      ) : (
        <>
          {/* Main KPI Cards - Proportional Redesign */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 group transition-all duration-500 hover:border-[#7000FF]/20">
               <div className="space-y-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#7000FF]/10 flex items-center justify-center text-[#7000FF] border border-[#7000FF]/20 mb-4">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em]">Gasto Total ({period})</p>
                    <p className="text-4xl font-black text-white tracking-tighter">${costs.totalCostUSD.toFixed(2)} <span className="text-base text-[#64748B] ml-1 uppercase font-bold tracking-widest">USD</span></p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                  <TrendingUp className="w-24 h-24" />
               </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 group transition-all duration-500 hover:border-[#00D1FF]/20">
               <div className="space-y-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF] border border-[#00D1FF]/20 mb-4">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em]">Tokens Procesados</p>
                    <p className="text-4xl font-black text-white tracking-tighter">
                      {costs.entries.reduce((acc: number, curr: any) => acc + curr.inputTokens + curr.outputTokens, 0).toLocaleString()}
                    </p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                  <Zap className="w-24 h-24" />
               </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 group transition-all duration-500 hover:border-[#00FF94]/20">
               <div className="space-y-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#00FF94]/10 flex items-center justify-center text-[#00FF94] border border-[#00FF94]/20 mb-4">
                    <Target className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em]">Llamadas API</p>
                    <p className="text-4xl font-black text-white tracking-tighter">
                      {costs.entries.reduce((acc: number, curr: any) => acc + curr.calls, 0)}
                    </p>
                  </div>
               </div>
               <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                  <PieChartIcon className="w-24 h-24" />
               </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* Chart Area - Elite Refinement */}
            <div className="lg:col-span-8">
              <div className="h-full rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 space-y-10">
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.03]">
                   <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2.5">
                     <TrendingUp className="w-4 h-4 text-[#7000FF]/70" />
                     Distribución por Modelo
                   </h3>
                </div>
                
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costs.entries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis 
                        dataKey="model" 
                        stroke="#475569" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => val.split('-').pop()?.toUpperCase() || val}
                      />
                      <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                        contentStyle={{ backgroundColor: '#0A0B10', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="costUSD" radius={[4, 4, 0, 0]} barSize={40}>
                        {costs.entries.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={MODEL_COLORS[entry.model] || '#7000FF'} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* List area - Intelligence Card Style */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-4">
                {costs.entries.map((entry: any, i: number) => (
                  <motion.div
                    key={entry.model}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-6 rounded-[2rem] space-y-5 transition-all duration-300 hover:border-white/10 group">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[entry.model] || '#7000FF', boxShadow: `0_0_8px_${MODEL_COLORS[entry.model] || '#7000FF'}` }} />
                            <span className="text-[10px] font-black text-white uppercase tracking-tight">{entry.model}</span>
                         </div>
                         <span className="text-sm font-black text-white tracking-tighter">${entry.costUSD.toFixed(2)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 border-t border-white/[0.03] pt-5">
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-[#475569] uppercase tracking-widest">Tokens de Entrada</p>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{entry.inputTokens.toLocaleString()}</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[8px] font-black text-[#475569] uppercase tracking-widest">Tokens de Salida</p>
                            <p className="text-[10px] font-black text-white uppercase tracking-tighter">{entry.outputTokens.toLocaleString()}</p>
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-8 rounded-[2rem] bg-white/[0.01] border border-white/[0.03] space-y-4">
                 <div className="flex items-center gap-2.5 text-[#7000FF]/60">
                    <PieChartIcon className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Nota de Facturación</span>
                 </div>
                 <p className="text-[9px] text-[#475569] leading-relaxed uppercase tracking-tight font-medium">
                   Tarifas oficiales (OpenAI / Anthropic). No incluye impuestos. Monitoreo en tiempo real sincronizado con CODA-CORE.
                 </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
