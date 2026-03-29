/**
 * Monitor de Agentes IA - Premium Redesign
 * Visualización de la flota de agentes y su estado operacional
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Terminal, 
  Cpu,
  BrainCircuit,
  Binary
} from 'lucide-react';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface AgentsMonitorProps {
  onSelectAgent: (agentId: string) => void;
}

const AGENT_TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  inspector: { icon: Terminal, color: '#0EA5E9', bg: 'bg-[#0EA5E9]/10' },
  detective: { icon: BrainCircuit, color: '#8B5CF6', bg: 'bg-[#8B5CF6]/10' },
  fiscal: { icon: ShieldCheck, color: '#10B981', bg: 'bg-[#10B981]/10' },
  custom: { icon: Binary, color: '#EC4899', bg: 'bg-[#EC4899]/10' },
};

export default function AgentsMonitor({ onSelectAgent }: AgentsMonitorProps) {
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['monitoring', 'agents'],
    queryFn: () => monitoringService.getAgents(),
    refetchInterval: 5000,
  });

  const agents = agentsData || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <BrainCircuit className="w-12 h-12 text-[#EC4899] animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Sincronizando Red Neuronal de Agentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Refined Header - Cognitive Infrastructure */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/[0.03] pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
             <div className="w-1.5 h-1.5 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899] animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#EC4899]">Infraestructura Cognitiva Activa</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none uppercase">AGENTES IA</h1>
          <p className="text-[#64748B] text-xs font-medium max-w-lg leading-relaxed">
             Gestión de autómatas especializados en auditoria. Cada agente opera en una capa distinta del stack de seguridad de CODA.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map((agent: any, idx: number) => {
          const cfg = (AGENT_TYPE_CONFIG[agent.type] || AGENT_TYPE_CONFIG['custom'])!;
          const Icon = cfg.icon;
          
          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div 
                className="relative overflow-hidden cursor-pointer rounded-[2rem] bg-[#0A0B10]/40 backdrop-blur-md border border-white/[0.03] p-6 lg:p-8 transition-all duration-500 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                onClick={() => onSelectAgent(agent.id)}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-5 transition-opacity duration-700 pointer-events-none">
                  <Icon className="w-24 h-24" />
                </div>

                <div className="space-y-8 relative z-10">
                   <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg} border border-white/5 group-hover:scale-105 transition-transform duration-500`}>
                        <Icon className="w-6 h-6" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`px-2 py-0.5 rounded-md border text-[8px] font-black uppercase tracking-widest ${
                           agent.status === 'active' ? 'bg-[#00FF94]/10 border-[#00FF94]/20 text-[#00FF94]' : 'bg-[#64748B]/10 border-[#64748B]/20 text-[#64748B]'
                        }`}>
                          {agent.status.toUpperCase()}
                        </div>
                        <div className="flex items-center gap-1.5">
                           <div className={`w-1 h-1 rounded-full ${agent.status === 'active' ? 'bg-[#00FF94] shadow-[0_0_5px_#00FF94]' : 'bg-[#64748B]'}`} />
                           <span className="text-[7px] font-black text-[#64748B] uppercase tracking-widest leading-none">Status Pulse</span>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <h3 className="text-xl font-black text-white tracking-tighter uppercase group-hover:text-[#EC4899] transition-colors">{agent.name}</h3>
                      <p className="text-[9px] font-bold text-[#475569] uppercase tracking-[0.2em]">{agent.type}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-6 border-t border-white/[0.03] pt-6">
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
                           <Zap className="w-3 h-3 opacity-50" /> Ejecuciones
                         </p>
                         <p className="text-xl font-black text-white tracking-tighter">{agent.executionCount}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[8px] font-black text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
                           <Clock className="w-3 h-3 opacity-50" /> Actividad
                         </p>
                         <p className="text-[10px] font-black text-white uppercase tracking-tighter">
                           {agent.lastExecution ? new Date(agent.lastExecution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Hover Indicator Line */}
                <div className="absolute inset-x-8 bottom-0 h-px bg-gradient-to-r from-transparent via-[#EC4899]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Agents Network Status Footer */}
      <Card className="bg-[#111218]/50 border-white/[0.03] backdrop-blur-sm">
         <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#64748B]" />
               </div>
               <div>
                  <p className="text-white font-black text-xs uppercase tracking-widest">Estado de la Flota: <span className="text-[#00FF94]">SALUDABLE</span></p>
                  <p className="text-[9px] text-[#64748B] font-medium uppercase tracking-[0.2em] mt-1">Todos los agentes respondiendo en el puerto 5001</p>
               </div>
            </div>
            <button className="px-6 py-2.5 rounded-2xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/5">
               Desplegar Nuevo Autómata
            </button>
         </div>
      </Card>
    </div>
  );
}
