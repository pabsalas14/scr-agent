import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Folder, CheckCircle2, AlertOctagon, BarChart3, Activity } from 'lucide-react';
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
      <div className="flex flex-col justify-center items-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-[#00D1FF]/20 border-t-[#00D1FF] rounded-full animate-spin" />
        <span className="text-[#64748B] font-bold uppercase tracking-widest text-xs">Cargando Sistema...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-2xl p-8 text-center backdrop-blur-md">
        <AlertOctagon className="w-12 h-12 text-[#FF3B3B] mx-auto mb-4" />
        <p className="text-white font-bold text-lg">Error de Conexión</p>
        <p className="text-[#94A3B8] text-sm mt-2">
          No se pudo establecer comunicación con el núcleo de CODA.
        </p>
      </div>
    );
  }

  const proyectos = proyectosData?.data || [];

  const analisisCompletados = proyectos.reduce(
    (acc: number, p: any) =>
      acc + (p.analyses?.filter((a: any) => a.status === 'COMPLETED').length || 0),
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
    <div className="space-y-10">
      {/* Header Centralizado */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-[#1F2937]/50 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#00D1FF] rounded-full shadow-[0_0_15px_rgba(0,209,255,0.5)]" />
            <h1 className="text-4xl font-black text-white tracking-tighter">
              Bóveda de Control
            </h1>
          </div>
          <p className="text-[#64748B] font-medium max-w-xl">
            Monitoreo en tiempo real de la salud y seguridad de tus activos digitales mediante inteligencia diagnóstica.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            className="bg-[#111218] border-[#1F2937] text-white hover:bg-[#1F2937] px-6"
            onClick={() => {}}
          >
            <Activity className="w-4 h-4 mr-2 text-[#00D1FF]" />
            Logs
          </Button>
          <Button
            variant="primary"
            onClick={() => setModalAbierto(true)}
            className="bg-[#00D1FF] text-black font-black hover:bg-[#00D1FF]/80 shadow-[0_0_20px_rgba(0,209,255,0.2)] px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proyecto
          </Button>
        </div>
      </div>

      {/* Grid de Estadísticas (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          title="Assets Totales"
          value={stats.totalProyectos}
          subtitle="repositorios vinculados"
          icon={<Folder className="w-5 h-5" />}
          accentColor="#00D1FF"
        />
        <KPICard
          title="Escaneos"
          value={stats.analisisCompletados}
          subtitle="análisis finalizados"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="#00FF94"
        />
        <KPICard
          title="Vulnerabilidades"
          value={stats.hallazgosCriticos}
          subtitle="críticas detectadas"
          icon={<AlertOctagon className="w-5 h-5" />}
          accentColor="#FF3B3B"
          trend={{ value: 12, isPositive: false }}
        />
        <KPICard
          title="Risk Index"
          value={`${stats.riskScorePromedio}%`}
          subtitle="puntuación global"
          icon={<BarChart3 className="w-5 h-5" />}
          accentColor="#FFD600"
        />
      </div>

      {/* Bandeja de Análisis Activos - Sleek Monitor */}
      {proyectos.some(p => p.analyses?.some((a: any) => !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(a.status))) && (
        <div className="bg-[#0A0B10] border border-[#00D1FF]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(0,209,255,0.05)] backdrop-blur-xl group">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D1FF] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D1FF]"></span>
              </div>
              <h3 className="text-white font-black text-xs tracking-[0.2em] uppercase">Procesamiento en Vivo</h3>
            </div>
            <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Agentes CODA Activos</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {proyectos
              .filter(p => p.analyses?.some((a: any) => !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(a.status)))
              .map(p => {
                const runningAnalysis = p.analyses?.find((a: any) => !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(a.status));
                const progress = runningAnalysis?.progress || 0;
                return (
                  <div key={`active-${p.id}`} className="bg-[#111218] rounded-xl p-4 border border-[#1F2937] hover:border-[#00D1FF]/50 transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-bold text-xs truncate">{p.name}</span>
                      <span className="text-[#00D1FF] text-[10px] font-black">{progress}%</span>
                    </div>
                    <div className="w-full bg-[#050505] rounded-full h-1 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-[#00D1FF] to-[#7000FF] shadow-[0_0_10px_#00D1FF]"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Lista de proyectos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
            Explorador de Assets
            <span className="text-[10px] bg-[#111218] text-[#64748B] px-2 py-0.5 rounded-full border border-[#1F2937]">
              {proyectos.length}
            </span>
          </h2>
        </div>

        {proyectos.length === 0 ? (
          <EmptyState onNuevo={() => setModalAbierto(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proyecto, i) => (
              <motion.div
                key={proyecto.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProyectoCard
                  proyecto={proyecto}
                  onVerAnalisis={onVerAnalisis}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

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

function EmptyState({ onNuevo }: { onNuevo: () => void }) {
  return (
    <div className="text-center py-24 bg-[#0A0B10] border border-dashed border-[#1F2937] rounded-3xl px-6 group hover:border-[#00D1FF]/30 transition-colors">
      <div className="w-20 h-20 bg-[#111218] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[#1F2937] group-hover:scale-110 transition-transform duration-500">
        <Folder className="w-10 h-10 text-[#475569] group-hover:text-[#00D1FF] transition-colors" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
        Silos de Datos Vacíos
      </h2>
      <p className="text-[#64748B] text-sm mb-10 max-w-sm mx-auto font-medium">
        Integra tu primer repositorio para activar los protocolos de observabilidad y defensa estratégica de CODA.
      </p>
      <Button
        variant="primary"
        onClick={onNuevo}
        className="bg-[#00D1FF] text-black font-black hover:bg-[#00D1FF]/80 shadow-[0_0_20px_rgba(0,209,255,0.2)] px-8"
      >
        <Plus className="w-4 h-4 mr-2" />
        Vincular Repositorio
      </Button>
    </div>
  );
}
