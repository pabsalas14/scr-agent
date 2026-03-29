import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Eye, Play, Settings as SettingsIcon, Shield, Server, Box, GitPullRequest, Laptop, Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Proyecto } from '../../types/api';
import Button from '../ui/Button';
import ProjectDetailView from './ProjectDetailView';

interface ProyectoCardProps {
  proyecto: Proyecto;
  onVerAnalisis: (projectId: string, analysisId: string) => void;
}

const SCOPE_CONFIG: Record<string, { label: string, icon: any }> = {
  REPOSITORY: { label: 'Repo', icon: Server },
  ORGANIZATION: { icon: Box, label: 'Org' },
  PULL_REQUEST: { icon: GitPullRequest, label: 'PR' },
};

export default function ProyectoCard({ proyecto, onVerAnalisis }: ProyectoCardProps) {
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const { data: analisisData } = useQuery({
    queryKey: ['analyses', proyecto.id],
    queryFn: () => apiService.obtenerAnalisisDeProyecto(proyecto.id),
    refetchInterval: 5_000,
  });

  const iniciar = useMutation({
    mutationFn: () => apiService.iniciarAnalisis(proyecto.id),
    onSuccess: (analisis) => onVerAnalisis(proyecto.id, analisis.id),
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const analisisList = analisisData || [];
  const ultimoAnalisis = analisisList[0];
  const enProceso = ultimoAnalisis && !['COMPLETED', 'FAILED', 'ERROR', 'CANCELLED'].includes(ultimoAnalisis.status);
  const ScopeIcon = SCOPE_CONFIG[proyecto.scope]?.icon || Laptop;

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-[2.5rem] bg-[#0A0B10]/40 backdrop-blur-md border transition-all duration-700 overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] ${
        enProceso 
          ? 'border-[#00D1FF]/40 shadow-[0_0_30px_rgba(0,209,255,0.05)]' 
          : 'border-white/[0.03] hover:border-white/10'
      }`}
    >
      {/* Dynamic Spotlight Effect */}
      <div 
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 209, 255, 0.08), transparent 40%)`,
        }}
      />

      <div className="relative z-10 p-6 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 content-start flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#111218] border border-[#1F2937] text-[#00D1FF]">
                   <ScopeIcon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                   {SCOPE_CONFIG[proyecto.scope]?.label || 'General'}
                </span>
             </div>
             <h3 className="text-xl font-black text-white tracking-tighter truncate">
                {proyecto.name}
             </h3>
             <p className="text-[10px] text-[#475569] font-mono truncate" title={proyecto.repositoryUrl}>
                {proyecto.repositoryUrl.replace('https://github.com/', '')}
             </p>
          </div>
          
          <div className="flex-shrink-0">
             <div className={`w-2.5 h-2.5 rounded-full ${enProceso ? 'bg-[#00D1FF] animate-pulse shadow-[0_0_10px_#00D1FF]' : 'bg-[#1F2937]'}`} />
          </div>
        </div>

        {/* Stats / Status Row */}
        <div className="grid grid-cols-2 gap-3 py-4 border-y border-[#1F2937]/50">
           <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#475569] uppercase tracking-wider">Último Status</p>
              {ultimoAnalisis ? <EstadoChip status={ultimoAnalisis.status} /> : <span className="text-xs text-[#64748B] font-medium">Sin datos</span>}
           </div>
           <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#475569] uppercase tracking-wider">Historial</p>
              <p className="text-xs text-white font-bold tracking-tight">{analisisList.length} Escaneos</p>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => iniciar.mutate()}
            disabled={enProceso || iniciar.isPending}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all ${
              enProceso || iniciar.isPending
                ? 'bg-[#111218] text-[#64748B] border border-[#1F2937]'
                : 'bg-[#111218] text-[#00D1FF] border border-[#00D1FF]/20 hover:bg-[#00D1FF] hover:text-black hover:shadow-[0_0_15px_rgba(0,209,255,0.3)]'
            }`}
          >
            {enProceso || iniciar.isPending ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {enProceso || iniciar.isPending ? 'Sincronizando' : 'Iniciar Auditoría'}
          </Button>

          {ultimoAnalisis?.status === 'COMPLETED' && (
            <button
              onClick={() => onVerAnalisis(proyecto.id, ultimoAnalisis.id)}
              className="p-2.5 rounded-xl bg-[#111218] border border-[#1F2937] text-white hover:border-[#00D1FF]/50 transition-all group/btn"
              title="Ver reporte detallado"
            >
              <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            </button>
          )}

          <button
            onClick={() => setDetalleAbierto(true)}
            className="p-2.5 rounded-xl bg-[#111218] border border-[#1F2937] text-[#64748B] hover:text-white hover:border-[#374151] transition-all"
            title="Protocolos de Configuración"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ProjectDetailView
        projectId={proyecto.id}
        isOpen={detalleAbierto}
        onClose={() => setDetalleAbierto(false)}
        onProjectDeleted={() => setDetalleAbierto(false)}
      />
    </div>
  );
}

function EstadoChip({ status }: { status: string }) {
  const CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    PENDING: { label: 'En Espera', color: 'text-[#64748B]', icon: Clock },
    RUNNING: { label: 'Analizando', color: 'text-[#00D1FF]', icon: Activity },
    INSPECTOR_RUNNING: { label: 'Inspector', color: 'text-[#FF8A00]', icon: Shield },
    DETECTIVE_RUNNING: { label: 'Detective', color: 'text-[#7000FF]', icon: Eye },
    FISCAL_RUNNING: { label: 'Fiscal', color: 'text-[#00D1FF]', icon: Activity },
    COMPLETED: { label: 'Asegurado', color: 'text-[#00FF94]', icon: CheckCircle2 },
    FAILED: { label: 'Fallo Crítico', color: 'text-[#FF3B3B]', icon: AlertTriangle },
    CANCELLED: { label: 'Abortado', color: 'text-[#FFD600]', icon: AlertTriangle },
  };
  
  const cfg = CONFIG[status] || { label: status, color: 'text-[#64748B]', icon: Activity };
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-1.5 ${cfg.color} font-black text-[10px] tracking-tight`}>
       <Icon className="w-3 h-3" />
       <span className="uppercase">{cfg.label}</span>
    </div>
  );
}
