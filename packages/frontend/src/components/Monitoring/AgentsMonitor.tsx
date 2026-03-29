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
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Header telemetry */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-[#EC4899]/10 pb-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#EC4899]">
            <Cpu className="w-3 h-3" />
            <span>Infraestructura Cognitiva Activa</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">AGENTES IA</h1>
          <p className="text-[#64748B] text-sm font-medium max-w-xl">
             Gestión de autómatas especializados en auditoría. Cada agente opera en una capa distinta del stack de seguridad.
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card 
                className="relative overflow-hidden cursor-pointer hover:border-white/10 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                onClick={() => onSelectAgent(agent.id)}
              >
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                  <Icon className="w-40 h-40" />
                </div>

                <div className="space-y-8 relative z-10">
                   <div className="flex items-center justify-between">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cfg.bg} border border-white/5 group-hover:scale-110 transition-transform duration-500`}>
                        <Icon className="w-7 h-7" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge type={agent.status === 'active' ? 'success' : 'pending'}>
                          {agent.status.toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                           <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-[#00FF94] animate-pulse shadow-[0_0_8px_#00FF94]' : 'bg-[#64748B]'}`} />
                           <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest leading-none">Pulse</span>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-[#EC4899] transition-colors">{agent.name}</h3>
                      <p className="text-[10px] font-black text-[#475569] uppercase tracking-[0.2em]">{agent.type}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
                           <Zap className="w-3 h-3" /> Ejecuciones
                         </p>
                         <p className="text-lg font-black text-white">{agent.executionCount}</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
                           <Clock className="w-3 h-3" /> Last Activity
                         </p>
                         <p className="text-[11px] font-black text-white uppercase tracking-tighter">
                           {agent.lastExecution ? new Date(agent.lastExecution).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                         </p>
                      </div>
                   </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#EC4899] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </Card>
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
