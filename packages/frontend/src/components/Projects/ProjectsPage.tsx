import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, AlertOctagon, Search } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useNavigate } from 'react-router-dom';
import type { CrearProyectoDTO } from '../../types/api';
import Button from '../ui/Button';
import NuevoProyectoModerno from '../Dashboard/NuevoProyectoModerno';
import ProyectoCard from '../Dashboard/ProyectoCard';

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtro, setFiltro] = useState('');

  const { data: proyectosData, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 15_000,
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
  const filtrados = proyectos.filter((p: any) =>
    p.name.toLowerCase().includes(filtro.toLowerCase()) ||
    p.repositoryUrl.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Proyectos</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              {proyectos.length} {proyectos.length === 1 ? 'repositorio registrado' : 'repositorios registrados'} bajo vigilancia
            </p>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
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
      {filtrados.length === 0 ? (
        <EmptyProjects onNuevo={() => setModalAbierto(true)} tieneFiltro={!!filtro} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((proyecto: any, i: number) => (
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
      )}

      {/* Modal */}
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
