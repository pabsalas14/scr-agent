/**
 * AnalysisQueueMonitor - Monitoreo de Bull queue
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { queueService } from '../../services/queue.service';
import { useToast } from '../../hooks/useToast';

export default function AnalysisQueueMonitor() {
  const [stats, setStats] = useState<any>(null);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadQueueData();
    const interval = setInterval(loadQueueData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueueData = async () => {
    try {
      const [statsData, activeData, pendingData] = await Promise.all([
        queueService.getQueueStats(),
        queueService.getActiveJobs(),
        queueService.getPendingJobs(10),
      ]);

      setStats(statsData);
      setActiveJobs(activeData);
      setPendingJobs(pendingData);
    } catch (error) {
      console.error('Error loading queue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return 'bg-[#EF4444]';
    if (progress < 50) return 'bg-[#EAB308]';
    if (progress < 75) return 'bg-[#3B82F6]';
    return 'bg-[#22C55E]';
  };

  if (isLoading && !stats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-10"
      >
        <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
        <p className="text-[#6B7280]">Inicializando monitor...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#F97316]" />
          Cola de Análisis
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Monitoreo en tiempo real del procesamiento Bull/Redis
        </p>
      </div>

      {/* Queue Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#6B7280] mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#EAB308] mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-[#EAB308]">{stats.pending}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#3B82F6] mb-1">Activos</p>
            <p className="text-2xl font-bold text-[#3B82F6]">{stats.active}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#22C55E] mb-1">Completados</p>
            <p className="text-2xl font-bold text-[#22C55E]">{stats.completed}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#6B7280] mb-1">Éxito</p>
            <p className="text-2xl font-bold text-[#22C55E]">
              {stats.successRate.toFixed(0)}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Active Jobs */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#3B82F6]" />
          Análisis en Progreso ({activeJobs.length})
        </h3>

        {activeJobs.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-center">
            <p className="text-[#6B7280] text-sm">No hay análisis activos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 rounded-lg bg-[#1C1C1E] border border-[#3B82F6]/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin" />
                    <span className="font-medium text-white">
                      Job: {job.id.slice(0, 8)}...
                    </span>
                  </div>
                  <span className="text-xs text-[#6B7280]">
                    {job.progress}% complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#0F0F0F] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${job.progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${getProgressColor(job.progress)}`}
                  />
                </div>

                <div className="mt-2 flex gap-4 text-xs text-[#6B7280]">
                  <div>
                    Intento: <span className="text-white">{job.attempt}</span>/
                    {job.maxAttempts}
                  </div>
                  {job.startedAt && (
                    <div>
                      Iniciado:{' '}
                      {new Date(job.startedAt).toLocaleTimeString('es-ES')}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Jobs */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#EAB308]" />
          Pendientes en Cola ({pendingJobs.length})
        </h3>

        {pendingJobs.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-center">
            <p className="text-[#6B7280] text-sm">Cola vacía</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="p-3 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] flex justify-between items-center hover:border-[#EAB308]/50 transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {job.id.slice(0, 8)}...
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    Creado:{' '}
                    {new Date(job.createdAt).toLocaleTimeString('es-ES')}
                  </p>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-[#EAB308]/10 text-[#EAB308] border border-[#EAB308]/20">
                  En espera
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Info */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-lg bg-[#0F0F0F] border border-[#2D2D2D]"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-[#22C55E] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-white mb-1">Rendimiento</p>
              <p className="text-xs text-[#6B7280]">
                Tiempo promedio de procesamiento:{' '}
                <span className="text-white font-medium">
                  {stats.avgProcessingTime}s
                </span>
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                Tasa de éxito:{' '}
                <span className="text-[#22C55E] font-medium">
                  {stats.successRate.toFixed(1)}%
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
