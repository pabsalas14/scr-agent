/**
 * Vista de Detalles de un Agente
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { monitoringService } from '../../services/monitoring.service';
import StatusBadge from '../ui/StatusBadge';
import { ArrowLeft } from 'lucide-react';

interface AgentDetailProps {
  agentId: string;
  onBack: () => void;
}

export default function AgentDetail({ agentId, onBack }: AgentDetailProps) {
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => monitoringService.getAgentDetail(agentId),
  });

  const { data: executions } = useQuery({
    queryKey: ['agent-executions', agentId],
    queryFn: () => monitoringService.getAgentExecutions(agentId, 10),
  });

  if (isLoading) {
    return (
      <div className="glass-sm rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando detalles del agente...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="glass-sm rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Agente no encontrado</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Agentes
      </button>

      {/* Agent Info */}
      <div className="glass-sm rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {agent.name}
            </h2>
            <div className="flex items-center gap-3">
              <StatusBadge status={agent.status} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {agent.type.charAt(0).toUpperCase() + agent.type.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20 dark:border-white/10">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ID</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white">{agent.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ejecuciones</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{agent.executionCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tipo</p>
            <p className="text-sm text-gray-900 dark:text-white capitalize">{agent.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Última ejecución</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {agent.lastExecution
                ? new Date(agent.lastExecution).toLocaleString()
                : 'Nunca'}
            </p>
          </div>
        </div>
      </div>

      {/* Executions History */}
      <div className="glass-sm rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historial de Ejecuciones (últimas 10)
        </h3>

        {!executions || executions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-sm">Sin ejecuciones registradas</p>
        ) : (
          <div className="space-y-2">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="flex items-center justify-between p-3 bg-white/20 dark:bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      execution.status === 'success'
                        ? 'bg-green-500'
                        : execution.status === 'error'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(execution.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {(execution.duration / 1000).toFixed(2)}s • {execution.status}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {execution.result || 'En progreso'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
