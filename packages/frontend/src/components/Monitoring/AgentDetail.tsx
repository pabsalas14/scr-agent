/**
 * Detalle del Agente - Premium Redesign
 * Vista profunda de telemetría y logs de un autómata específico
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Terminal, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Zap,
  Cpu,
  BrainCircuit,
  History,
  MessageSquare
} from 'lucide-react';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface AgentDetailProps {
  agentId: string;
  onBack: () => void;
}

export default function AgentDetail({ agentId, onBack }: AgentDetailProps) {
  const { data: agent, isLoading: loadingAgent } = useQuery({
    queryKey: ['monitoring', 'agents', agentId],
    queryFn: () => monitoringService.getAgentDetail(agentId),
    refetchInterval: 5000,
  });

  const { data: executions = [], isLoading: loadingExecs } = useQuery({
    queryKey: ['monitoring', 'agents', agentId, 'executions'],
    queryFn: () => monitoringService.getAgentExecutions(agentId),
    refetchInterval: 10000,
  });

  if (loadingAgent || loadingExecs) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Activity className="w-12 h-12 text-[#00D1FF] animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Accediendo a Memoria del Agente...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <Card className="border-dashed border-[#FF3B3B]/30 bg-transparent flex flex-col items-center justify-center p-12 text-center">
        <ArrowLeft className="w-10 h-10 text-[#64748B] mb-4 cursor-pointer hover:text-white" onClick={onBack} />
        <p className="text-white font-black uppercase tracking-widest text-sm">Agente no Encontrado</p>
        <p className="text-[#64748B] text-xs mt-2 max-w-xs">El identificador de agente especificado no existe o ha sido desmantelado.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header with Back Button */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="w-12 h-12 rounded-2xl bg-[#0A0B10] border border-[#1F2937] flex items-center justify-center text-[#64748B] hover:text-[#00D1FF] hover:border-[#00D1FF]/50 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-white tracking-tighter">{agent.name}</h1>
              <Badge type={agent.status === 'active' ? 'success' : 'pending'}>{agent.status.toUpperCase()}</Badge>
            </div>
            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.3em] flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              UUID: {agent.id}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-[#0A0B10] border border-[#1F2937] rounded-2xl px-6 py-3 flex flex-col items-center">
            <span className="text-[8px] font-black text-[#64748B] uppercase tracking-widest leading-none mb-1">Capa de Red</span>
            <span className="text-sm font-black text-[#00D1FF]">L7 / AGENT-BUS</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Info Column */}
        <div className="lg:col-span-4 space-y-8">
           <Card className="relative overflow-hidden group border-white/[0.03]">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <BrainCircuit className="w-32 h-32" />
              </div>
              <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-8">Metadata del Autómata</h3>
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                   <span className="text-[10px] font-bold text-[#475569] uppercase tracking-tight flex items-center gap-2"><Cpu className="w-3 h-3" /> Tipo de Motor</span>
                   <span className="text-xs font-black text-white uppercase tracking-widest">{agent.type}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                   <span className="text-[10px] font-bold text-[#475569] uppercase tracking-tight flex items-center gap-2"><Zap className="w-3 h-3" /> Ciclos</span>
                   <span className="text-xs font-black text-white">{agent.executionCount}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                   <span className="text-[10px] font-bold text-[#475569] uppercase tracking-tight flex items-center gap-2"><Clock className="w-3 h-3" /> Última Actividad</span>
                   <span className="text-xs font-black text-[#00D1FF] uppercase">
                     {agent.lastExecution ? new Date(agent.lastExecution).toLocaleTimeString() : 'N/A'}
                   </span>
                </div>
              </div>
           </Card>

           <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#1F2937] to-[#0A0B10] border border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Estado Nominal</h4>
              </div>
              <p className="text-[11px] text-[#64748B] leading-relaxed">
                Este agente está operando bajo los parámetros de seguridad establecidos. No se detectan anomalías en sus últimos 1,000 ciclos de ejecución.
              </p>
           </div>
        </div>

        {/* Executions Column */}
        <div className="lg:col-span-8 space-y-8">
           <h2 className="text-xs font-black text-white uppercase tracking-[0.25em] flex items-center gap-3 ml-2">
              <History className="w-4 h-4 text-[#00D1FF]" />
              Cronología de Ejecuciones
           </h2>
           
           <div className="space-y-4">
              {executions.length > 0 ? executions.map((exec: any, idx: number) => (
                <motion.div
                  key={exec.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="hover:border-white/10 transition-all border-white/[0.03] group">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            exec.status === 'success' ? 'bg-[#00FF94]/10 text-[#00FF94]' : 'bg-[#FF3B3B]/10 text-[#FF3B3B]'
                          }`}>
                            {exec.status === 'success' ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{exec.id}</p>
                             <h5 className="font-black text-white text-sm tracking-tight capitalize">{exec.result || 'Ejecución estándar de auditoría'}</h5>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-bold text-[#475569] uppercase tracking-widest">Duración</p>
                          <p className="text-xs font-black text-white">{(exec.duration / 1000).toFixed(2)}s</p>
                       </div>
                    </div>
                  </Card>
                </motion.div>
              )) : (
                <Card className="border-dashed border-[#1F2937] bg-transparent h-40 flex flex-col items-center justify-center opacity-30">
                  <MessageSquare className="w-8 h-8 mb-4 text-[#64748B]" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sin historial de logs</p>
                </Card>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
