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
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { CrearProyectoDTO } from '../../types/api';
import Button from '../ui/Button';
import NuevoProyecto from './NuevoProyecto';
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

  return (
    <div className="space-y-6">
      {/* Header del dashboard */}
      <div className="flex justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proyectos</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {proyectos.length} {proyectos.length === 1 ? 'repositorio' : 'repositorios'} registrados
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setModalAbierto(true)}
          className="whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </Button>
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

      {/* Modal de nuevo proyecto */}
      {modalAbierto && (
        <NuevoProyecto
          onCrear={(dto) => crearProyecto.mutate(dto)}
          onCerrar={() => setModalAbierto(false)}
          cargando={crearProyecto.isPending}
        />
      )}
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
