/**
 * ============================================================================
 * DASHBOARD PRINCIPAL
 * ============================================================================
 *
 * Vista principal con:
 * - Lista de proyectos
 * - Iniciar nuevo análisis
 * - Historial de análisis
 * - Estado en tiempo real
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { CrearProyectoDTO } from '../../types/api';
import Button from '../ui/Button';
import KPICard from './KPICard';
import NuevoProyectoModerno from './NuevoProyectoModerno';
import ProyectoCard from './ProyectoCard';

interface DashboardProps {
  onVerAnalisis: (projectId: string, analysisId: string) => void;
}

export default function Dashboard({ onVerAnalisis }: DashboardProps) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);

  /**
   * Cargar proyectos del backend
   */
  const {
    data: proyectosData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 10_000,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const { data } = await apiService.get('/analytics/summary');
      return (data as any).data;
    },
    refetchInterval: 15_000,
  });

  /**
   * Crear proyecto nuevo
   */
  const crearProyecto = useMutation({
    mutationFn: (dto: CrearProyectoDTO) => apiService.crearProyecto(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setModalAbierto(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin text-4xl">⟳</div>
        <span className="ml-3 text-gray-600">Cargando proyectos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-medium">Error al cargar proyectos</p>
        <p className="text-red-600 text-sm mt-1">
          Verifica que el backend está activo en puerto 3000
        </p>
      </div>
    );
  }

  const proyectos = proyectosData?.data || [];

  // Calcular estadísticas desde los datos de proyectos
  const analisisCompletados = proyectos.reduce(
    (acc: number, p: any) =>
      acc + (p.analyses?.filter((a: any) => a.status === 'COMPLETED').length || 0),
    0
  );
  const totalAnalisis = proyectos.reduce(
    (acc: number, p: any) => acc + (p.analyses?.length || 0),
    0
  );
  const stats = {
    totalProyectos: proyectos.length,
    analisisCompletados,
    hallazgosCriticos: analyticsData?.criticalFindings || 0,
    riskScorePromedio: analyticsData?.totalFindings
      ? Math.round(((analyticsData.criticalFindings + analyticsData.highFindings) / analyticsData.totalFindings) * 100)
      : 0,
  };

  return (
    <div className="space-y-4 sm:space-y-6 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900/30 rounded-xl p-6 sm:p-8 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      {/* Header del dashboard - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl sm:text-4xl">🛡️</div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 dark:from-cyan-300 dark:via-blue-400 dark:to-purple-500 bg-clip-text text-transparent leading-tight">
                CodeShield Análisis
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 ml-12">
            Escanea y asegura tus repositorios con inteligencia artificial
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => {}}
            className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
          >
            <span className="hidden sm:inline">📊 Reportes</span>
            <span className="sm:hidden">📊</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => setModalAbierto(true)}
            className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">+ Nuevo</span>
            <span className="xs:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <KPICard
            title="Proyectos Activos"
            value={stats.totalProyectos}
            subtitle="repositorios en análisis"
            icon="📁"
            accentColor="#0EA5E9"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <KPICard
            title="Análisis Completados"
            value={stats.analisisCompletados}
            subtitle="escaneos finalizados"
            icon="✅"
            accentColor="#10B981"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <KPICard
            title="Hallazgos Críticos"
            value={stats.hallazgosCriticos}
            subtitle="requieren acción"
            icon="⚠️"
            accentColor="#EC4899"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <KPICard
            title="Risk Score Promedio"
            value={stats.riskScorePromedio}
            subtitle="riesgo general"
            icon="📊"
            accentColor="#F59E0B"
          />
        </motion.div>
      </div>

      {/* Lista de proyectos - Responsive grid */}
      {proyectos.length === 0 ? (
        <EmptyState onNuevo={() => setModalAbierto(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {proyectos.map((proyecto, i) => (
            <motion.div
              key={proyecto.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <ProyectoCard
                proyecto={proyecto}
                onVerAnalisis={onVerAnalisis}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de nuevo proyecto - Formulario progresivo */}
      <AnimatePresence>
        {modalAbierto && (
          <NuevoProyectoModerno
            onCrear={(dto) => crearProyecto.mutate(dto)}
            onCerrar={() => setModalAbierto(false)}
            cargando={crearProyecto.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="text-center py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 sm:px-6">
      <p className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">🔍</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
        Sin proyectos aún
      </h2>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto leading-relaxed">
        Agrega un repositorio para comenzar el análisis de seguridad
      </p>
      <Button
        variant="primary"
        onClick={onNuevo}
        className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2"
      >
        <Plus className="w-4 h-4" />
        <span className="hidden xs:inline">Agregar primer proyecto</span>
        <span className="xs:hidden">Agregar proyecto</span>
      </Button>
    </div>
  );
}
