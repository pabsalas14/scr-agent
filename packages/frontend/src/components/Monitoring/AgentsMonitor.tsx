/**
 * Monitor de Agentes
 * Muestra lista de agentes, estado y acciones
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface AgentsMonitorProps {
  onSelectAgent?: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', label: '🟢 Activo' },
  inactive: { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: '⚫ Inactivo' },
  error: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', label: '🔴 Error' },
};

export default function AgentsMonitor({ onSelectAgent }: AgentsMonitorProps) {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => monitoringService.getAgents(),
    refetchInterval: 30000, // Actualizar cada 30s
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Cargando agentes...</p>
        </div>
      </Card>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Sin agentes disponibles</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {agents.map((agent, i) => {
        const statusInfo = STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive;

        return (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card interactive>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </h3>
                    <Badge
                      variant={agent.status === 'active' ? 'success' : agent.status === 'error' ? 'warning' : 'pending'}
                      size="sm"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Tipo: <span className="font-medium capitalize">{agent.type}</span> • Ejecuciones: <span className="font-medium">{agent.executionCount}</span>
                  </p>
                  {agent.lastExecution && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Última ejecución: {new Date(agent.lastExecution).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectAgent?.(agent.id)}
                  >
                    Ver detalles
                  </Button>
                  {agent.status === 'active' && (
                    <Button variant="primary" size="sm">
                      Ejecutar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
