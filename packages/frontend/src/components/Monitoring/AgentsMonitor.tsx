/**
 * Monitor de Agentes
 * Muestra lista de agentes, estado y acciones
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { monitoringService } from '../../services/monitoring.service';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';

interface AgentsMonitorProps {
  onSelectAgent?: (agentId: string) => void;
}

export default function AgentsMonitor({ onSelectAgent }: AgentsMonitorProps) {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => monitoringService.getAgents(),
    refetchInterval: 30000, // Actualizar cada 30s
  });

  if (isLoading) {
    return (
      <div className="glass-sm rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando agentes...</p>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="glass-sm rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Sin agentes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-sm rounded-xl p-5 hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {agent.name}
                </h3>
                <StatusBadge status={agent.status} />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tipo: <span className="font-medium">{agent.type}</span> • Ejecuciones: <span className="font-medium">{agent.executionCount}</span>
              </p>
              {agent.lastExecution && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Última ejecución: {new Date(agent.lastExecution).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => onSelectAgent?.(agent.id)}
                className="text-sm px-3 py-2"
              >
                Ver detalles
              </Button>
              {agent.status === 'active' && (
                <Button variant="primary" className="text-sm px-3 py-2">
                  Ejecutar
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
