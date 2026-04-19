import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, AlertOctagon, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useNavigate } from 'react-router-dom';
import type { CrearProyectoDTO, Proyecto } from '../../types/api';
import Button from '../ui/Button';
import NuevoProyectoModerno from '../Dashboard/NuevoProyectoModerno';
import ProyectoCard from '../Dashboard/ProyectoCard';

const PAGE_SIZE = 20;

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: proyectosData, isLoading, error } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => apiService.obtenerProyectos({ page, limit: PAGE_SIZE, search: search || undefined }),
    refetchInterval: 15_000,
    placeholderData: (prev) => prev,
  });

  const crearProyecto = useMutation({
    mutationFn: async (dto: CrearProyectoDTO) => {
      // BUG FIX #2: Try to use combined endpoint first (backend Saga Pattern)
      // Falls back to sequential operations for backward compatibility
      try {
        const response = await apiService.post('/projects/with-analysis', dto);
        return response.data;
      } catch (error) {
        // Fallback: Sequential operations (legacy, should be removed once backend is updated)
        const proyecto = await apiService.crearProyecto(dto);
        try {
          const analisis = await apiService.iniciarAnalisis(proyecto.id);
          return { proyecto, analisis };
        } catch (analysisError) {
          // If analysis fails, mark project for manual analysis trigger
          console.error('Failed to auto-start analysis after project creation:', analysisError);
          return { proyecto, analisis: null, analysisError };
        }
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setModalAbierto(false);
      setPage(1);

      // BUG FIX #2: Handle analysis creation failure gracefully
      if (data.analisis) {
        navigate(`/projects/${data.proyecto.id}/analyses/${data.analisis.id}`);
      } else {
        // Navigate to project detail and show toast to trigger analysis manually
        navigate(`/projects/${data.proyecto.id}`);
        // Toast will be shown via error handling below
      }
    },
    onError: (error: any) => {
      // BUG FIX #2: Clear error message and prevent user from re-creating
      const errorMessage = error?.response?.data?.error || 'No se pudo crear el proyecto';
      console.error('Project creation error:', errorMessage);
    }
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  if (isLoading && !proyectosData) {
    return (
      <div className="flex flex-col justify-center items-center py-32 space-y-3">
        <div className="w-8 h-8 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280]">Cargando proyectos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-10 text-center">
        <AlertOctagon className="w-10 h-10 text-[#EF4444] mx-auto mb-4 opacity-70" />
        <h2 className="text-lg font-semibold text-white">Error de conexión</h2>
        <p className="text-sm text-[#6B7280] mt-2 max-w-sm mx-auto">
          No se pudo comunicar con el servidor de proyectos.
        </p>
      </div>
    );
  }

  const proyectos = proyectosData?.data || [];
  const total = proyectosData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-3">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Proyectos</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {total} {total === 1 ? 'repositorio registrado' : 'repositorios registrados'} bajo vigilancia
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#4B5563] focus:border-[#F97316]/40 focus:outline-none transition-all"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => setModalAbierto(true)}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </Button>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      {proyectos.length === 0 ? (
        <EmptyProjects onNuevo={() => setModalAbierto(true)} tieneFiltro={!!search} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {proyectos.map((proyecto: Proyecto, i: number) => (
              <motion.div
                key={proyecto.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProyectoCard
                  proyecto={proyecto}
                  onVerAnalisis={(projectId, analysisId) => navigate(`/projects/${projectId}/analyses/${analysisId}`)}
                />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-[#2D2D2D]">
              <span className="text-xs text-[#6B7280]">
                Página {page} de {totalPages} — {total} proyectos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalAbierto && (
          <NuevoProyectoModerno
            onCrear={(dto) => crearProyecto.mutate(dto)}
            onCerrar={() => setModalAbierto(false)}
            cargando={crearProyecto.isPending}
            error={crearProyecto.error ? (crearProyecto.error as any).response?.data?.error || (crearProyecto.error as Error).message : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyProjects({ onNuevo, tieneFiltro }: { onNuevo: () => void; tieneFiltro: boolean }) {
  return (
    <div className="text-center py-24 border border-dashed border-[#2D2D2D] rounded-xl px-8">
      <div className="w-16 h-16 bg-[#1E1E20] rounded-xl flex items-center justify-center mx-auto mb-5 border border-[#2D2D2D]">
        <Folder className="w-8 h-8 text-[#4B5563]" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">
        {tieneFiltro ? 'Sin resultados' : 'Sin proyectos'}
      </h2>
      <p className="text-sm text-[#6B7280] mb-8 max-w-sm mx-auto">
        {tieneFiltro
          ? 'Ningún proyecto coincide con tu búsqueda.'
          : 'Registra tu primer repositorio para comenzar a auditar tu código.'}
      </p>
      {!tieneFiltro && (
        <Button variant="primary" onClick={onNuevo} className="flex items-center gap-2 mx-auto">
          <Plus className="w-4 h-4" />
          Registrar primer repositorio
        </Button>
      )}
    </div>
  );
}
