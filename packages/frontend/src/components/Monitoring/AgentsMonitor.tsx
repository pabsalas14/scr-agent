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
  Binary,
  type LucideIcon,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Agent } from '../../types/monitoring';
import Card from '../ui/Card';

interface AgentsMonitorProps {
  onSelectAgent: (agentId: string) => void;
}

const AGENT_TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  inspector: { icon: Terminal,    color: '#F97316' },
  detective: { icon: BrainCircuit,color: '#6366F1' },
  fiscal:    { icon: ShieldCheck, color: '#22C55E' },
  custom:    { icon: Binary,      color: '#A0A0A0' },
};

export default function AgentsMonitor({ onSelectAgent }: AgentsMonitorProps) {
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['monitoring', 'agents'],
    queryFn: () => apiService.obtenerAgentes(),
    refetchInterval: 5000,
  });

  const agents = agentsData || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-3">
        <BrainCircuit className="w-8 h-8 text-[#6366F1] animate-pulse" />
        <p className="text-sm text-[#6B7280]">Sincronizando agentes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] animate-pulse" />
          <span className="text-xs text-[#6B7280]">Infraestructura cognitiva activa</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Agentes IA</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Gestión de autómatas especializados en auditoría de seguridad.
        </p>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent: Agent, idx: number) => {
          const cfg = AGENT_TYPE_CONFIG[agent.type] || AGENT_TYPE_CONFIG['custom']!;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div
                className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-4 cursor-pointer hover:border-[#404040] transition-all duration-200 group"
                onClick={() => onSelectAgent(agent.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${cfg.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'active' ? 'bg-[#22C55E]' : 'bg-[#6B7280]'}`} />
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                        agent.status === 'active'
                          ? 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]'
                          : 'bg-[#6B7280]/10 border-[#6B7280]/20 text-[#9CA3AF]'
                      }`}
                    >
                      {agent.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="text-sm font-semibold text-white group-hover:text-[#F97316] transition-colors">{agent.name}</h3>
                  <p className="text-xs text-[#6B7280] capitalize">{agent.type}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#2D2D2D]">
                  <div>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3" /> Ejecuciones
                    </p>
                    <p className="text-sm font-semibold text-white">{agent.executionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" /> Actividad
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {agent.lastExecution
                        ? agent.lastExecution.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '---'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Status */}
      <Card className="bg-[#1E1E20] border-[#2D2D2D]">
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#22C55E]/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Estado de la flota: <span className="text-[#22C55E]">Saludable</span></p>
              <p className="text-xs text-[#6B7280] mt-0.5">Todos los agentes respondiendo en puerto 5001</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#404040] text-sm text-[#A0A0A0] hover:text-white transition-all">
            Desplegar agente
          </button>
        </div>
      </Card>
    </div>
  );
}
