/**
 * Monitor de Sistema
 * Muestra métricas de CPU, RAM, Almacenamiento
 */

import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '../../services/monitoring.service';
import MetricCard from '../ui/MetricCard';
import { Cpu, HardDrive, Zap } from 'lucide-react';

export default function SystemMonitor() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: () => monitoringService.getSystemMetrics(),
    refetchInterval: 5000, // Actualizar cada 5s
  });

  if (isLoading) {
    return (
      <div className="glass-sm rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando métricas del sistema...</p>
      </div>
    );
  }

  if (!metrics) return null;

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

  const getStatus = (usage: number): 'good' | 'warning' | 'critical' => {
    if (usage >= 80) return 'critical';
    if (usage >= 60) return 'warning';
    return 'good';
  };

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Uso de CPU"
          value={Math.round(metrics.cpu.usage)}
          unit="%"
          status={getStatus(metrics.cpu.usage)}
          icon={<Zap className="w-5 h-5" />}
        />
        <MetricCard
          title="Memoria RAM"
          value={Math.round(metrics.memory.usage)}
          unit="%"
          status={getStatus(metrics.memory.usage)}
          icon={<Cpu className="w-5 h-5" />}
        />
        <MetricCard
          title="Almacenamiento"
          value={Math.round(metrics.disk.usage)}
          unit="%"
          status={getStatus(metrics.disk.usage)}
          icon={<HardDrive className="w-5 h-5" />}
        />
      </div>

      {/* Detalles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Detalles */}
        <div className="glass-sm rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">CPU</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Cores:</span>
              <span className="font-medium text-gray-900 dark:text-white">{metrics.cpu.cores}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Uso:</span>
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(metrics.cpu.usage)}%</span>
            </div>
          </div>
        </div>

        {/* Memoria Detalles */}
        <div className="glass-sm rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Memoria RAM</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Usado:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(metrics.memory.used)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(metrics.memory.total)}</span>
            </div>
          </div>
        </div>

        {/* Disco Detalles */}
        <div className="glass-sm rounded-xl p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Almacenamiento</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Usado:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(metrics.disk.used)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(metrics.disk.total)}</span>
            </div>
            {/* Progress bar */}
            <div className="bg-gray-200 dark:bg-white/10 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all"
                style={{ width: `${metrics.disk.usage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Uptime */}
      <div className="glass-sm rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Tiempo de funcionamiento</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {Math.floor(metrics.uptime / 86400)} días, {Math.floor((metrics.uptime % 86400) / 3600)} horas
        </p>
      </div>
    </div>
  );
}
