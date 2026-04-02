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
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <Server className="w-8 h-8 text-[#F97316] animate-pulse" />
        <p className="text-sm text-[#6B7280]">Escaneando arquitectura...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="border border-dashed border-[#EF4444]/20 bg-[#EF4444]/5 rounded-xl flex flex-col items-center justify-center p-12 text-center">
        <CloudLightning className="w-8 h-8 text-[#EF4444] mb-3 opacity-60" />
        <p className="text-sm font-medium text-white">Fallo en enlace de telemetría</p>
        <p className="text-xs text-[#6B7280] mt-1 max-w-xs">No se pudo establecer conexión con el motor de monitoreo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6 flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse" />
            <span className="text-xs text-[#6B7280]">Diagnóstico de infraestructura activo</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Sistema</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Monitoreo en tiempo real de recursos computacionales.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl px-4 py-3 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-[#6B7280] mb-1">Estado</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="text-sm font-medium text-white">Nominal</span>
            </div>
          </div>
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl px-4 py-3 flex flex-col items-center min-w-[100px]">
            <span className="text-xs text-[#6B7280] mb-1">Tiempo activo</span>
            <span className="text-sm font-medium text-white">{formatUptime(metrics.uptime)}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Resource Gauges */}
        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
          {/* CPU */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs text-[#6B7280]">CORE x{metrics.cpu.cores}</span>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm font-medium text-white">Carga de CPU</p>
                <span className="text-xl font-semibold text-[#F97316]">{Math.round(metrics.cpu.usage)}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#2D2D2D] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.cpu.usage}%` }}
                  className="h-full bg-[#F97316] rounded-full"
                />
              </div>
            </div>
          </div>

          {/* RAM */}
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1]">
                <Database className="w-4 h-4" />
              </div>
              <span className="text-xs text-[#6B7280]">{formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}</span>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm font-medium text-white">Memoria RAM</p>
                <span className="text-xl font-semibold text-[#6366F1]">{Math.round(metrics.memory.usage)}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#2D2D2D] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics.memory.usage}%` }}
                  className="h-full bg-[#6366F1] rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Disk */}
          <div className="md:col-span-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative flex-shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#2D2D2D]" />
                  <motion.circle
                    cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                    className="text-[#22C55E]"
                    strokeDasharray={251}
                    initial={{ strokeDashoffset: 251 }}
                    animate={{ strokeDashoffset: 251 - (251 * metrics.disk.usage / 100) }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-semibold text-white">{Math.round(metrics.disk.usage)}%</span>
                  <span className="text-xs text-[#6B7280]">Disco</span>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                {[
                  { label: 'Total', value: formatBytes(metrics.disk.total || 0), icon: HardDrive },
                  { label: 'En uso', value: formatBytes(metrics.disk.used || 0), icon: Activity },
                  { label: 'Sincronizado', value: new Date(metrics.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: Clock },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mb-1">
                      <item.icon className="w-3 h-3" /> {item.label}
                    </p>
                    <p className="text-sm font-medium text-white">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#2D2D2D]">
              <div className="w-7 h-7 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-sm font-medium text-white">Arquitectura</h3>
            </div>
            <ul className="space-y-3">
              {[
                { label: 'Tipo de SO',  value: 'Linux / macOS' },
                { label: 'Procesador', value: 'Agent-Core-V1' },
                { label: 'Red',        value: 'Protegida' },
                { label: 'Motor',      value: 'SCR-Polymer' },
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">{item.label}</span>
                  <span className="text-xs font-medium text-white">{item.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#F97316]/10 border border-[#F97316]/20 rounded-xl p-4 flex flex-col items-center text-center space-y-2">
            <CloudLightning className="w-8 h-8 text-[#F97316]" />
            <p className="text-sm font-medium text-white">Motor activo</p>
            <p className="text-xs text-[#A0A0A0]">Optimización en curso. Gestión de memoria: agresiva.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
