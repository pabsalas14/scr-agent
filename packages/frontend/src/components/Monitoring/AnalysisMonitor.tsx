/**
 * Monitor de Análisis - Rediseñado
 * Muestra análisis en progreso, completados y fallidos con nuevo design system
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgGradient: string }> = {
  PENDING: { label: 'Pendiente', icon: <Clock className="w-5 h-5" />, color: '#8B7280', bgGradient: 'from-gray-600/20 to-gray-500/20' },
  RUNNING: { label: 'En progreso', icon: <Zap className="w-5 h-5" />, color: '#0EA5E9', bgGradient: 'from-blue-600/20 to-blue-500/20' },
  INSPECTOR_RUNNING: { label: 'Inspector...', icon: <Zap className="w-5 h-5" />, color: '#F59E0B', bgGradient: 'from-orange-600/20 to-orange-500/20' },
  DETECTIVE_RUNNING: { label: 'Detective...', icon: <Zap className="w-5 h-5" />, color: '#8B5CF6', bgGradient: 'from-purple-600/20 to-purple-500/20' },
  FISCAL_RUNNING: { label: 'Fiscal...', icon: <Zap className="w-5 h-5" />, color: '#6366F1', bgGradient: 'from-indigo-600/20 to-indigo-500/20' },
  COMPLETADO: { label: 'Completado', icon: <CheckCircle className="w-5 h-5" />, color: '#10B981', bgGradient: 'from-green-600/20 to-green-500/20' },
  ERROR: { label: 'Error', icon: <AlertCircle className="w-5 h-5" />, color: '#DC2626', bgGradient: 'from-red-600/20 to-red-500/20' },
};

export default function AnalysisMonitor() {
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 5_000,
  });

  const proyectos = projectsData?.data || [];

  // Obtener todos los análisis
  const allAnalyses = proyectos.flatMap((proyecto: any) =>
    (proyecto.analyses || []).map((analysis: any) => ({
      ...analysis,
      projectName: proyecto.name,
      projectId: proyecto.id,
    }))
  );

  const enProgreso = allAnalyses.filter(
    (a: any) => a.status === 'RUNNING' || a.status.includes('RUNNING')
  );
  const completados = allAnalyses.filter((a: any) => a.status === 'COMPLETADO');
  const fallidos = allAnalyses.filter((a: any) => a.status === 'ERROR');

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white mb-2">📊 Reportes de Análisis</h1>
        <p className="text-gray-400">Monitorea el estado de todos tus análisis de seguridad</p>
      </motion.div>

      {/* Estadísticas con colores vibrantes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">En Progreso</p>
                <p className="text-3xl font-black text-blue-400 mt-1">{enProgreso.length}</p>
              </div>
              <Zap className="w-12 h-12 text-blue-400 opacity-30" />
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completados</p>
                <p className="text-3xl font-black text-emerald-400 mt-1">{completados.length}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-emerald-400 opacity-30" />
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Fallidos</p>
                <p className="text-3xl font-black text-red-400 mt-1">{fallidos.length}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-400 opacity-30" />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* En Progreso */}
      {enProgreso.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <span className="text-2xl">⚡</span>
            Análisis en Progreso ({enProgreso.length})
          </h2>
          <div className="space-y-3">
            {enProgreso.map((analysis: any) => {
              const cfg = STATUS_CONFIG[analysis.status] || STATUS_CONFIG['RUNNING'];
              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className="group"
                >
                  <Card className="border-l-4 transition-all group-hover:shadow-xl" style={{ borderLeftColor: cfg.color }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                          {cfg.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{analysis.projectName}</p>
                          <p className="text-xs text-gray-400">{cfg.label}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold" style={{ color: cfg.color }}>
                        {analysis.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full transition-all"
                        style={{ background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}dd)` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${analysis.progress || 0}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completados */}
      {completados.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <span className="text-2xl">✅</span>
            Completados ({completados.length})
          </h2>
          <div className="space-y-3">
            {completados.map((analysis: any, idx: number) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="border-l-4 border-emerald-500/50 bg-gradient-to-r from-emerald-900/10 to-transparent transition-all hover:shadow-xl hover:border-emerald-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{analysis.projectName}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(analysis.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Fallidos */}
      {fallidos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <span className="text-2xl">❌</span>
            Fallidos ({fallidos.length})
          </h2>
          <div className="space-y-3">
            {fallidos.map((analysis: any, idx: number) => (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="border-l-4 border-red-500/50 bg-gradient-to-r from-red-900/10 to-transparent transition-all hover:shadow-xl hover:border-red-400">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-white">{analysis.projectName}</p>
                      <p className="text-xs text-red-300 mt-1 break-words">{analysis.error || 'Error desconocido'}</p>
                    </div>
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 ml-3" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Sin análisis */}
      {allAnalyses.length === 0 && (
        <Card>
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-300 text-lg font-semibold">No hay análisis registrados</p>
            <p className="text-gray-400 text-sm mt-2">
              Crea un proyecto y comienza un análisis
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
