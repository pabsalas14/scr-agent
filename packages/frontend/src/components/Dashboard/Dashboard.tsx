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
  onVerAnalisis: (analysisId: string) => void;
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
    refetchInterval: 10_000, // Refrescar cada 10s
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

  // Calcular estadísticas
  const stats = {
    totalProyectos: proyectos.length,
    analisisCompletados: 0, // Se cargarán dinámicamente desde cada ProyectoCard
    hallazgosCriticos: 0, // Se cargarán dinámicamente desde cada ProyectoCard
    riskScorePromedio: 0, // Se cargarán dinámicamente desde cada ProyectoCard
  };

  return (
    <div className="space-y-6">
      {/* Header del dashboard */}
      <div className="flex justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            📊 Mis Proyectos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestiona y analiza tus repositorios de código
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => {}}
            className="whitespace-nowrap"
          >
            📊 Reportes
          </Button>
          <Button
            variant="primary"
            onClick={() => setModalAbierto(true)}
            className="whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            + Nuevo Análisis
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Lista de proyectos */}
      {proyectos.length === 0 ? (
        <EmptyState onNuevo={() => setModalAbierto(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
      <p className="text-6xl mb-4">🔍</p>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Sin proyectos aún
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Agrega un repositorio para comenzar el análisis de seguridad
      </p>
      <Button variant="primary" onClick={onNuevo} className="inline-flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Agregar primer proyecto
      </Button>
    </div>
  );
}
