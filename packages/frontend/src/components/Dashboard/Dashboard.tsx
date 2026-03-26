import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { apiService } from '../../services/api.service';
import type { Proyecto, CrearProyectoDTO } from '../../types/api';
import NuevoProyecto from './NuevoProyecto';
import ProyectoCard from './ProyectoCard';

interface DashboardProps {
  onVerAnalisis: (analysisId: string) => void;
}

export default function Dashboard({ onVerAnalisis }: DashboardProps) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data: proyectosData, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 10_000,
  });

  const crearProyecto = useMutation({
    mutationFn: (dto: CrearProyectoDTO) => apiService.crearProyecto(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setModalAbierto(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="card p-8 max-w-md text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠
          </div>
          <h3 className="font-semibold text-slate-800 mb-1">Error de conexion</h3>
          <p className="text-sm text-slate-500">
            No se pudo conectar al backend. Verifica que este activo en el puerto 3001.
          </p>
        </div>
      </div>
    );
  }

  const proyectos = proyectosData?.data || [];

  return (
    <>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Proyectos</h1>
          <p className="page-subtitle">
            {proyectos.length === 0
              ? 'Ningun repositorio registrado aun'
              : proyectos.length + ' repositorio' + (proyectos.length === 1 ? '' : 's') + ' registrado' + (proyectos.length === 1 ? '' : 's')}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalAbierto(true)}>
          + Nuevo proyecto
        </button>
      </div>

      {proyectos.length === 0 ? (
        <EmptyState onNuevo={() => setModalAbierto(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {proyectos.map((proyecto, i) => (
            <motion.div
              key={proyecto.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.2 }}
            >
              <ProyectoCard proyecto={proyecto} onVerAnalisis={onVerAnalisis} />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalAbierto && (
          <NuevoProyecto
            onCrear={(dto) => crearProyecto.mutate(dto)}
            onCerrar={() => setModalAbierto(false)}
            cargando={crearProyecto.isPending}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function EmptyState({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-96 py-8">
      <div className="card p-12 max-w-md w-full text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-indigo-50 rounded-2xl" />
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🔍
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-2">
          Sin proyectos todavia
        </h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Agrega un repositorio de GitHub, GitLab o Bitbucket para comenzar el analisis de seguridad con CODA.
        </p>
        <button className="btn-primary w-full justify-center" onClick={onNuevo}>
          + Agregar primer proyecto
        </button>
      </div>
    </div>
  );
}
