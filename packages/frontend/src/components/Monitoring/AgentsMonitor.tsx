/**
 * Monitor de Agentes IA - Rediseñado
 * Muestra lista de agentes, estado y acciones con nuevo design system
 */

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { PlayCircle, Clock, Zap } from 'lucide-react';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface AgentsMonitorProps {
  onSelectAgent?: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; text: string; label: string; icon: string }> = {
  active: { color: '#10B981', bg: 'from-emerald-900/20 to-emerald-800/10', text: 'text-emerald-300', label: 'Activo', icon: '🟢' },
  inactive: { color: '#8B7280', bg: 'from-gray-800/50 to-gray-700/30', text: 'text-gray-400', label: 'Inactivo', icon: '⚫' },
  error: { color: '#DC2626', bg: 'from-red-900/20 to-red-800/10', text: 'text-red-300', label: 'Error', icon: '🔴' },
};

export default function AgentsMonitor({ onSelectAgent }: AgentsMonitorProps) {
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => monitoringService.getAgents(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="inline-block animate-spin text-4xl mb-3">⚙️</div>
          <p className="text-gray-400">Cargando agentes IA...</p>
        </div>
      </Card>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-gray-300 font-semibold">Sin agentes disponibles</p>
          <p className="text-gray-400 text-sm mt-2">Los agentes aparecerán aquí cuando se inicien análisis</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white mb-2">🤖 Agentes IA</h1>
        <p className="text-gray-400">Inspector, Detective y Fiscal trabajando en análisis</p>
      </motion.div>

      {/* Grid de agentes */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="space-y-3"
      >
        {agents.map((agent, i) => {
          const statusInfo = STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <Card className={`border-l-4 bg-gradient-to-r ${statusInfo.bg} transition-all hover:shadow-xl`} style={{ borderLeftColor: statusInfo.color }}>
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-gray-800/50">
                        {statusInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">
                          {agent.name}
                        </h3>
                        <p className={`text-xs font-semibold ${statusInfo.text}`}>
                          {statusInfo.label}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-400 text-xs">Tipo</p>
                          <p className="text-white font-semibold capitalize">{agent.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <PlayCircle className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-gray-400 text-xs">Ejecuciones</p>
                          <p className="text-white font-semibold">{agent.executionCount}</p>
                        </div>
                      </div>
                    </div>

                    {agent.lastExecution && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600/30">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <p className="text-xs text-gray-400">
                          Última ejecución: <span className="text-gray-300">{new Date(agent.lastExecution).toLocaleString()}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      onClick={() => onSelectAgent?.(agent.id)}
                      className="flex items-center gap-2"
                    >
                      📊 Detalles
                    </Button>
                    {agent.status === 'active' && (
                      <Button variant="primary" className="flex items-center gap-2">
                        <PlayCircle className="w-4 h-4" />
                        Ejecutar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
