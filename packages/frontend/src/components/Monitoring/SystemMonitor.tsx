/**
 * Monitor de Hardware y Sistema - Premium Redesign
 * Telemetría en tiempo real de CPU, RAM y Almacenamiento
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Cpu, 
  Database, 
  HardDrive, 
  Activity, 
  Clock, 
  Server,
  CloudLightning
} from 'lucide-react';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function SystemMonitor() {
  const { data: metricsData, isLoading, error } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => monitoringService.getSystemMetrics(),
    refetchInterval: 3000,
  });

  const metrics = metricsData;

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Server className="w-10 h-10 text-[#00D1FF] animate-pulse" />
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#64748B]">Escaneando Arquitectura...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="border border-dashed border-[#FF3B3B]/20 bg-[#FF3B3B]/5 rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center">
        <CloudLightning className="w-8 h-8 text-[#FF3B3B] mb-4 opacity-50" />
        <p className="text-white font-black uppercase tracking-widest text-xs">Fallo en Enlace de Telemetría</p>
        <p className="text-[#64748B] text-[10px] mt-2 max-w-xs font-medium uppercase tracking-tight">No se pudo establecer conexión con el motor de monitoreo de bajo nivel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Refined Header - Infrastructure Telemetry */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] shadow-[0_0_8px_#00D1FF] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00D1FF]">Diagnóstico de Infraestructura Activo</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none uppercase">SISTEMA</h1>
          <p className="text-[#64748B] text-xs font-medium max-w-lg leading-relaxed">
            Monitoreo en tiempo real de recursos computacionales. Optimización de latencia de red y gestión de carga de agentes IA.
          </p>
        </div>
        
        <div className="flex gap-3">
           <div className="bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.05] rounded-2xl px-6 py-3 flex flex-col items-center min-w-[120px]">
              <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest mb-1">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF94] shadow-[0_0_5px_#00FF94]" />
                <span className="text-sm font-black text-white tracking-tight uppercase">Nominal</span>
              </div>
           </div>
           <div className="bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.05] rounded-2xl px-6 py-3 flex flex-col items-center min-w-[120px]">
              <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest mb-1">Uptime</span>
              <span className="text-sm font-black text-white tracking-tight">{formatUptime(metrics.uptime)}</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Resource Gauges */}
        <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
          {/* CPU Gauge */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 group hover:border-white/10 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
              <Cpu className="w-24 h-24" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                 <div className="w-10 h-10 rounded-xl bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF] border border-[#00D1FF]/20">
                    <Cpu className="w-5 h-5" />
                 </div>
                 <div className="px-2 py-0.5 rounded-md bg-white/[0.02] border border-white/5 text-[8px] font-black text-[#64748B] uppercase tracking-widest">CORE x{metrics.cpu.cores}</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <h3 className="text-xl font-black text-white tracking-tighter uppercase">Carga de CPU</h3>
                   <span className="text-3xl font-black text-[#00D1FF] tracking-tighter">{Math.round(metrics.cpu.usage)}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.cpu.usage}%` }}
                    className="h-full bg-[#00D1FF] rounded-full"
                    style={{ boxShadow: '0 0 10px rgba(0,209,255,0.3)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RAM Gauge */}
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 group hover:border-white/10 transition-all duration-500">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
              <Database className="w-24 h-24" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                 <div className="w-10 h-10 rounded-xl bg-[#EC4899]/10 flex items-center justify-center text-[#EC4899] border border-[#EC4899]/20">
                    <Database className="w-5 h-5" />
                 </div>
                 <div className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.1em] opacity-60">{formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                   <h3 className="text-xl font-black text-white tracking-tighter uppercase">Memoria RAM</h3>
                   <span className="text-3xl font-black text-[#EC4899] tracking-tighter">{Math.round(metrics.memory.usage)}%</span>
                </div>
                <div className="h-1 w-full bg-white/[0.03] rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.memory.usage}%` }}
                    className="h-full bg-[#EC4899] rounded-full"
                    style={{ boxShadow: '0 0 10px rgba(236,72,153,0.3)' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Disk Info - Refined */}
          <div className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-8 group transition-all duration-500">
            <div className="flex flex-col md:flex-row items-center gap-12">
               <div className="relative">
                  <svg className="w-28 h-28 transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/[0.03]" />
                    <motion.circle 
                      cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="10" fill="transparent" 
                      className="text-[#00FF94]"
                      strokeDasharray={302}
                      initial={{ strokeDashoffset: 302 }}
                      animate={{ strokeDashoffset: 302 - (302 * metrics.disk.usage / 100) }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-2xl font-black text-white tracking-tighter">{Math.round(metrics.disk.usage)}%</span>
                     <span className="text-[7px] font-black text-[#64748B] uppercase tracking-widest">DISK</span>
                  </div>
               </div>
               
               <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 w-full">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2"><HardDrive className="w-3 h-3 opacity-50" /> Espacio Total</p>
                    <p className="text-xl font-black text-white tracking-tight">{formatBytes(metrics.disk.total || 0)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2"><Activity className="w-3 h-3 opacity-50" /> Espacio en Uso</p>
                    <p className="text-xl font-black text-white tracking-tight">{formatBytes(metrics.disk.used || 0)}</p>
                  </div>
                  <div className="space-y-2 col-span-2 md:col-span-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-[0.2em] flex items-center gap-2"><Clock className="w-3 h-3 opacity-50" /> Sincronizado</p>
                    <p className="text-xs font-bold text-[#94A3B8] uppercase tracking-tighter">{new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Sidebar Intelligence Panel */}
        <div className="lg:col-span-4 space-y-8">
           <div className="p-8 rounded-[2rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] shadow-xl">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/[0.03]">
                <div className="w-8 h-8 rounded-xl bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF] border border-[#00D1FF]/20">
                   <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Arquitectura</h3>
              </div>
              <ul className="space-y-5">
                  {[
                    { label: 'TIPO DE SO', value: 'LINUX / MACOS' },
                    { label: 'PROCESADOR', value: 'AGENT-CORE-V1' },
                    { label: 'RED', value: 'PROTEGIDA' },
                    { label: 'MOTOR', value: 'CODA-POLYMER' },
                  ].map((item, i) => (
                    <li key={i} className="flex justify-between items-center group">
                       <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest transition-colors group-hover:text-white/40">{item.label}</span>
                       <span className="text-[10px] font-black text-white uppercase tracking-tighter">{item.value}</span>
                    </li>
                  ))}
               </ul>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#7000FF] to-[#00D1FF] flex flex-col items-center justify-center text-center space-y-5 shadow-[0_20px_60px_rgba(112,0,255,0.3)] relative overflow-hidden group">
               <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
               <CloudLightning className="w-10 h-10 text-white animate-pulse relative z-10" />
               <div className="space-y-2 relative z-10">
                 <p className="text-white font-black uppercase tracking-[0.2em] text-sm">Motor Coda Activo</p>
                 <p className="text-white/70 text-[10px] font-medium leading-[1.6] max-w-[180px] mx-auto uppercase tracking-wide">Optimización en curso. Gestión de memoria: AGRESIVA.</p>
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}
