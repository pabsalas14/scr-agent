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
import { apiService } from '../../services/api.service';
import type { CrearProyectoDTO } from '../../types/api';
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proyectos</h2>
          <p className="text-sm text-gray-600">
            {proyectos.length} repositorios registrados
          </p>
        </div>
        <button
          className="button-primary flex items-center gap-2"
          onClick={() => setModalAbierto(true)}
        >
          + Nuevo Proyecto
        </button>
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
    <div className="text-center py-16 bg-white border border-gray-200 rounded-lg">
      <p className="text-5xl mb-4">🔍</p>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">
        Sin proyectos aún
      </h3>
      <p className="text-gray-500 mb-6">
        Agrega un repositorio para comenzar el análisis de seguridad
      </p>
      <button className="button-primary" onClick={onNuevo}>
        + Agregar primer proyecto
      </button>
    </div>
  );
}
