/**
 * Monitor de Sistema
 * Muestra métricas reales de CPU, RAM, Almacenamiento
 */

import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import { Cpu, HardDrive, Zap, Gauge } from 'lucide-react';

export default function SystemMonitor() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['systemMetrics'],
    queryFn: () => monitoringService.getSystemMetrics(),
    refetchInterval: 5000, // Actualizar cada 5s
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Cargando métricas del sistema...</p>
        </div>
      </Card>
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

  const getStatusColor = (usage: number) => {
    if (usage >= 80) return 'from-red-500 to-red-600';
    if (usage >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const MetricItem = ({ icon, title, value, unit, usage }: { icon: React.ReactNode; title: string; value: string | number; unit?: string; usage?: number }) => (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}{unit && <span className="text-lg text-gray-600 dark:text-gray-400">{unit}</span>}
            </p>
          </div>
        </div>
        {usage !== undefined && (
          <div className="text-right">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(usage)}%</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Métricas principales en grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricItem
          icon={<Zap className="w-6 h-6" />}
          title="Uso de CPU"
          value={Math.round(metrics.cpu.usage)}
          unit="%"
          usage={metrics.cpu.usage}
        />
        <MetricItem
          icon={<Cpu className="w-6 h-6" />}
          title="Memoria RAM"
          value={Math.round(metrics.memory.usage)}
          unit="%"
          usage={metrics.memory.usage}
        />
        <MetricItem
          icon={<HardDrive className="w-6 h-6" />}
          title="Almacenamiento"
          value={Math.round(metrics.disk.usage)}
          unit="%"
          usage={metrics.disk.usage}
        />
      </div>

      {/* Detalles expandidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Detalles */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            CPU
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Cores disponibles:</span>
              <span className="font-medium text-gray-900 dark:text-white">{metrics.cpu.cores}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Uso actual:</span>
              <span className="font-medium text-gray-900 dark:text-white">{Math.round(metrics.cpu.usage)}%</span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getStatusColor(metrics.cpu.usage)} h-2 rounded-full transition-all`}
                style={{ width: `${metrics.cpu.usage}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Memoria Detalles */}
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-green-600" />
            Memoria RAM
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Usado:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(metrics.memory.used)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatBytes(metrics.memory.total)}</span>
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${getStatusColor(metrics.memory.usage)} h-2 rounded-full transition-all`}
                style={{ width: `${metrics.memory.usage}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Almacenamiento */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-orange-600" />
          Almacenamiento
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Usado</p>
              <p className="font-medium text-gray-900 dark:text-white text-lg">{formatBytes(metrics.disk.used)}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Total</p>
              <p className="font-medium text-gray-900 dark:text-white text-lg">{formatBytes(metrics.disk.total)}</p>
            </div>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`bg-gradient-to-r ${getStatusColor(metrics.disk.usage)} h-2 rounded-full transition-all`}
              style={{ width: `${metrics.disk.usage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {Math.round(metrics.disk.usage)}% utilizado
          </p>
        </div>
      </Card>

      {/* Uptime */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Gauge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo de funcionamiento</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {Math.floor(metrics.uptime / 86400)} días, {Math.floor((metrics.uptime % 86400) / 3600)} horas
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
