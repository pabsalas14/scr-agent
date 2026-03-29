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

  const metrics = metricsData?.data;

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
        <Server className="w-12 h-12 text-[#00D1FF] animate-bounce" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Escaneando Arquitectura del Sistema...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <Card className="border-dashed border-[#FF3B3B]/30 bg-transparent flex flex-col items-center justify-center p-12 text-center">
        <CloudLightning className="w-10 h-10 text-[#FF3B3B] mb-4" />
        <p className="text-white font-black uppercase tracking-widest text-sm">Error de Enlace de Telemetría</p>
        <p className="text-[#64748B] text-xs mt-2 max-w-xs">No se pudo establecer conexión con el motor de monitoreo de bajo nivel.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header telemetry */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#00D1FF]/10 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00D1FF]">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Diagnóstico de Infraestructura Activo</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">SISTEMA</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl">
            Monitoreo en tiempo real de los recursos computacionales. Optimización de latencia y gestión de carga IA.
          </p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-[#0A0B10] border border-[#1F2937] rounded-3xl px-8 py-4 flex flex-col items-center">
              <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-1">Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FF94] shadow-[0_0_8px_#00FF94]" />
                <span className="text-lg font-black text-white tracking-tight uppercase">Nominal</span>
              </div>
           </div>
           <div className="bg-[#0A0B10] border border-[#1F2937] rounded-3xl px-8 py-4 flex flex-col items-center">
              <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-1">Uptime</span>
              <span className="text-lg font-black text-white tracking-tight">{formatUptime(metrics.uptime)}</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Resource Gauges */}
        <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
          {/* CPU Gauge */}
          <Card className="relative overflow-hidden group border-white/[0.03] hover:border-[#00D1FF]/20 transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Cpu className="w-32 h-32" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-2xl bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF]">
                    <Cpu className="w-6 h-6" />
                 </div>
                 <Badge type="info" size="sm" showIcon={false}>CORE x{metrics.cpu.cores}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <h3 className="text-2xl font-black text-white tracking-tight">CPU LOAD</h3>
                   <span className="text-4xl font-black text-[#00D1FF]">{Math.round(metrics.cpu.usage)}%</span>
                </div>
                <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.cpu.usage}%` }}
                    className="h-full bg-gradient-to-r from-[#00D1FF] to-[#7000FF] rounded-full"
                    style={{ boxShadow: '0 0 15px rgba(0,209,255,0.4)' }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* RAM Gauge */}
          <Card className="relative overflow-hidden group border-white/[0.03] hover:border-[#EC4899]/20 transition-colors">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database className="w-32 h-32" />
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                 <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/10 flex items-center justify-center text-[#EC4899]">
                    <Database className="w-6 h-6" />
                 </div>
                 <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <h3 className="text-2xl font-black text-white tracking-tight">RAM USAGE</h3>
                   <span className="text-4xl font-black text-[#EC4899]">{Math.round(metrics.memory.usage)}%</span>
                </div>
                <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${metrics.memory.usage}%` }}
                    className="h-full bg-gradient-to-r from-[#EC4899] to-[#7000FF] rounded-full"
                    style={{ boxShadow: '0 0 15px rgba(236,72,153,0.4)' }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Disk Info */}
          <Card className="md:col-span-2 relative overflow-hidden group border-white/[0.03] hover:border-[#00FF94]/20 transition-colors">
            <div className="flex flex-col md:flex-row items-center gap-10">
               <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/[0.03]" />
                    <motion.circle 
                      cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      className="text-[#00FF94]"
                      strokeDasharray={340}
                      initial={{ strokeDashoffset: 340 }}
                      animate={{ strokeDashoffset: 340 - (340 * metrics.disk.usage / 100) }}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <span className="text-2xl font-black text-white">{Math.round(metrics.disk.usage)}%</span>
                     <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest">Disk</span>
                  </div>
               </div>
               
               <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5"><HardDrive className="w-3 h-3" /> Total Space</p>
                    <p className="text-xl font-black text-white">{formatBytes(metrics.disk.total || 0)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5"><Activity className="w-3 h-3" /> Used Space</p>
                    <p className="text-xl font-black text-white">{formatBytes(metrics.disk.used || 0)}</p>
                  </div>
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <p className="text-[9px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3 h-3" /> Timestamp</p>
                    <p className="text-sm font-bold text-[#94A3B8]">{new Date(metrics.timestamp).toLocaleTimeString()}</p>
                  </div>
               </div>
            </div>
          </Card>
        </div>

        {/* Sidebar logs/info */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="bg-[#00D1FF]/5 border-[#00D1FF]/10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-[#00D1FF]/20 flex items-center justify-center text-[#00D1FF]">
                   <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Hardware Intelligence</h3>
              </div>
              <ul className="space-y-4">
                 {[
                   { label: 'Os Type', value: 'Linux/MacOS' },
                   { label: 'Process Name', value: 'SCR-AGENT-NODE' },
                   { label: 'Signal Strength', value: '100%' },
                   { label: 'Engine Path', value: '/api/v1/monitoring' },
                 ].map((item, i) => (
                   <li key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-tight">{item.label}</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.value}</span>
                   </li>
                 ))}
              </ul>
           </Card>

           <div className="p-8 rounded-[2rem] bg-gradient-to-br from-[#7000FF] to-[#00D1FF] flex flex-col items-center justify-center text-center space-y-4 shadow-[0_20px_40px_rgba(112,0,255,0.2)]">
              <Zap className="w-10 h-10 text-white animate-pulse" />
              <div className="space-y-1">
                <p className="text-white font-black uppercase tracking-widest text-sm">Coda Engine Active</p>
                <p className="text-white/60 text-[10px] font-medium leading-relaxed">Optimization in progress. Memory management level: Aggressive.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
