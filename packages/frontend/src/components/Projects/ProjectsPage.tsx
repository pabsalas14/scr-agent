/**
 * ============================================================================
 * PROYECTOS PAGE - Dedicated Repository Management
 * ============================================================================
 * 
 * Este componente permite al usuario gestionar sus repositorios (assets),
 * ver el estado de seguridad de cada uno y añadir nuevos proyectos.
 * Se ha separado del Dashboard para ofrecer una vista más limpia y enfocada.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, AlertOctagon, Search, ArrowRight, ShieldCheck, Filter } from 'lucide-react';
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
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin" />
        <span className="text-[#64748B] font-bold uppercase tracking-widest text-xs">Accediendo a Bóveda...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-[2rem] p-12 text-center backdrop-blur-md">
        <AlertOctagon className="w-16 h-16 text-[#FF3B3B] mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Falla de Enlace</h2>
        <p className="text-[#94A3B8] text-sm mt-3 max-w-sm mx-auto">
          No se pudo establecer comunicación con el almacenamiento de assets de CODA.
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
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-white/[0.03] pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-2 h-10 bg-gradient-to-b from-[#00D1FF] to-[#7000FF] rounded-full shadow-[0_0_15px_rgba(0,209,255,0.4)]" />
             <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
               Gestión de <span className="text-[#00D1FF]">Assets</span>
             </h1>
          </div>
          <p className="text-[#64748B] text-sm font-medium max-w-2xl leading-relaxed uppercase tracking-tight">
            Inventario completo de aplicaciones y servicios bajo vigilancia agéntica. Configure el perímetro de seguridad para cada repositorio.
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within:text-[#00D1FF] transition-colors" />
            <input 
              type="text" 
              placeholder="FILTRAR ASSETS..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full bg-[#0A0B10]/60 border border-white/[0.05] rounded-2xl pl-12 pr-4 py-3.5 text-white text-[10px] font-black tracking-widest uppercase focus:border-[#00D1FF]/30 focus:outline-none transition-all placeholder:text-[#3D4A5C]"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setModalAbierto(true)}
            className="bg-gradient-to-r from-[#00D1FF] to-[#7000FF] text-white font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_10px_30px_rgba(0,209,255,0.15)] px-8 py-4 rounded-2xl flex items-center gap-2 border-none"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Añadir Asset</span>
          </Button>
        </div>
      </div>

      {/* Grid de Proyectos */}
      {filtrados.length === 0 ? (
        <EmptyProjects onNuevo={() => setModalAbierto(true)} tieneFiltro={!!filtro} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtrados.map((proyecto: any, i: number) => (
            <motion.div
              key={proyecto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProyectoCard
                proyecto={proyecto}
                onVerAnalisis={(projectId, analysisId) => navigate(`/projects/${projectId}/analyses/${analysisId}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de nuevo proyecto */}
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

function EmptyProjects({ onNuevo, tieneFiltro }: { onNuevo: () => void, tieneFiltro: boolean }) {
  return (
    <div className="text-center py-32 bg-[#0A0B10]/40 border border-dashed border-white/[0.03] rounded-[3rem] px-8 group transition-all duration-700 hover:border-[#00D1FF]/20">
      <div className="w-24 h-24 bg-white/[0.02] rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/[0.05] group-hover:scale-110 group-hover:bg-[#00D1FF]/5 transition-all duration-500">
        <Folder className="w-12 h-12 text-[#475569] group-hover:text-[#00D1FF] transition-colors" />
      </div>
      <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">
        {tieneFiltro ? 'Asset No Identificado' : 'Bóveda Desocupada'}
      </h2>
      <p className="text-[#64748B] text-sm mb-12 max-w-sm mx-auto font-medium leading-relaxed uppercase tracking-tight">
        {tieneFiltro 
          ? 'La búsqueda no coincide con ningún asset registrado en su infraestructura local.' 
          : 'Inicie el protocolo de vinculación para registrar su primer repositorio en el ecosistema de CODA.'}
      </p>
      {!tieneFiltro && (
        <Button
          variant="primary"
          onClick={onNuevo}
          className="bg-white/[0.03] text-white border border-white/10 font-black hover:bg-white hover:text-black transition-all px-10 py-4 rounded-xl shadow-2xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          REGISTRAR PRIMER REPOSITORIO
        </Button>
      )}
    </div>
  );
}
