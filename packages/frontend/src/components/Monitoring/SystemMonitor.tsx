/**
 * Monitor de Sistema - Rediseñado
 * Muestra métricas reales de CPU, RAM, Almacenamiento con nuevo design system
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import { Cpu, HardDrive, Zap, Gauge, TrendingUp } from 'lucide-react';

export default function SystemMonitor() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: () => monitoringService.getSystemMetrics(),
    refetchInterval: 5000, // Actualizar cada 5s
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="inline-block animate-spin text-4xl mb-3">⚙️</div>
          <p className="text-gray-400">Cargando métricas del sistema...</p>
        </div>
      </Card>
    );
  }

  if (!metrics) return null;

  const getStatusColor = (usage: number) => {
    if (usage >= 80) return { gradient: 'from-red-500 to-red-600', color: '#dc2626' };
    if (usage >= 60) return { gradient: 'from-yellow-500 to-yellow-600', color: '#eab308' };
    return { gradient: 'from-green-500 to-green-600', color: '#22c55e' };
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white mb-2">⚙️ Monitor del Sistema</h1>
        <p className="text-gray-400">Métricas en tiempo real del servidor</p>
      </motion.div>

      {/* Métricas principales */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* CPU */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-2xl">⚡</div>
                <div>
                  <p className="text-gray-400 text-sm">CPU</p>
                  <p className="text-white font-black text-2xl">{Math.round(metrics.cpu.usage)}%</p>
                </div>
              </div>
              <TrendingUp className="w-6 h-6 text-gray-500" />
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${getStatusColor(metrics.cpu.usage).gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.cpu.usage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{metrics.cpu.cores} cores disponibles</p>
          </Card>
        </motion.div>

        {/* Memoria */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-2xl">💾</div>
                <div>
                  <p className="text-gray-400 text-sm">RAM</p>
                  <p className="text-white font-black text-2xl">{Math.round(metrics.memory.usage)}%</p>
                </div>
              </div>
              <TrendingUp className="w-6 h-6 text-gray-500" />
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${getStatusColor(metrics.memory.usage).gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.memory.usage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}</p>
          </Card>
        </motion.div>

        {/* Almacenamiento */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center text-2xl">💿</div>
                <div>
                  <p className="text-gray-400 text-sm">Disco</p>
                  <p className="text-white font-black text-2xl">{Math.round(metrics.disk.usage)}%</p>
                </div>
              </div>
              <TrendingUp className="w-6 h-6 text-gray-500" />
            </div>
            <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${getStatusColor(metrics.disk.usage).gradient}`}
                initial={{ width: 0 }}
                animate={{ width: `${metrics.disk.usage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)}</p>
          </Card>
        </motion.div>
      </motion.div>

      {/* Uptime */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-purple-500/20 flex items-center justify-center text-2xl">⏱️</div>
              <div>
                <p className="text-gray-400 text-sm">Tiempo de funcionamiento</p>
                <p className="text-white font-black text-xl">
                  {Math.floor(metrics.uptime / 86400)} días, {Math.floor((metrics.uptime % 86400) / 3600)} horas
                </p>
              </div>
            </div>
            <Gauge className="w-8 h-8 text-purple-400 opacity-50" />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
