/**
 * AuditTrail - Visualización del historial de auditoría
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Loader2,
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { auditService } from '../../services/audit.service';
import { useToast } from '../../hooks/useToast';

interface AuditTrailProps {
  userId?: string;
  resourceId?: string;
  resourceType?: string;
}

export default function AuditTrail({
  userId,
  resourceId,
  resourceType,
}: AuditTrailProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadAuditData();
  }, [userId, resourceId, resourceType, selectedAction]);

  const loadAuditData = async () => {
    try {
      setIsLoading(true);

      if (resourceId && resourceType) {
        // Cargar auditoría de recurso específico
        const result = await auditService.getResourceAuditLogs(
          resourceType,
          resourceId,
          { limit: 50 }
        );
        setLogs(result.logs);
      } else {
        // Cargar auditoría de usuario o global
        const result = await auditService.getUserAuditLogs(userId, {
          action: selectedAction || undefined,
          limit: 50,
        });
        setLogs(result.logs);
      }

      // Cargar estadísticas
      const summary = await auditService.getActivitySummary();
      setStats(summary);
    } catch (error) {
      toast.error('Error cargando auditoría');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-[#22C55E]/10 text-[#22C55E]';
    if (action.includes('UPDATE')) return 'bg-[#3B82F6]/10 text-[#3B82F6]';
    if (action.includes('DELETE')) return 'bg-[#EF4444]/10 text-[#EF4444]';
    return 'bg-[#6B7280]/10 text-[#6B7280]';
  };

  const getStatusIcon = (status: string) => {
    return status === 'SUCCESS' ? (
      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
    ) : (
      <AlertCircle className="w-4 h-4 text-[#EF4444]" />
    );
  };

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#F97316]" />
          Auditoría
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Historial completo de acciones y cambios
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#6B7280] mb-1">Total de Acciones</p>
            <p className="text-2xl font-bold text-white">{stats.totalActions}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#6B7280] mb-1">Usuarios Activos</p>
            <p className="text-2xl font-bold text-white">
              {Object.keys(stats.byUser || {}).length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#6B7280] mb-1">Tasa de Error</p>
            <p className="text-2xl font-bold text-[#EF4444]">
              {stats.failureRate.toFixed(1)}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Action Filter */}
      {!resourceId && (
        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelectedAction(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              !selectedAction
                ? 'bg-[#F97316] text-white'
                : 'bg-[#2D2D2D] text-[#6B7280] hover:bg-[#3D3D3D]'
            }`}
          >
            Todas
          </motion.button>
          {uniqueActions.slice(0, 5).map((action) => (
            <motion.button
              key={action}
              whileHover={{ scale: 1.05 }}
              onClick={() => setSelectedAction(action)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedAction === action
                  ? 'bg-[#F97316] text-white'
                  : 'bg-[#2D2D2D] text-[#6B7280] hover:bg-[#3D3D3D]'
              }`}
            >
              {action.replace(/_/g, ' ')}
            </motion.button>
          ))}
        </div>
      )}

      {/* Audit Log Timeline */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
            <p className="text-[#6B7280]">Cargando auditoría...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg">
            <AlertCircle className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
            <p className="text-[#6B7280]">No hay registros de auditoría</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] hover:border-[#F97316]/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-[#6B7280]">
                      {log.resourceType}
                    </span>
                    {getStatusIcon(log.status)}
                    <span
                      className={`text-xs font-medium ${
                        log.status === 'SUCCESS'
                          ? 'text-[#22C55E]'
                          : 'text-[#EF4444]'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>

                  <div className="flex gap-4 text-xs text-[#6B7280]">
                    <div>
                      <span className="font-medium text-white">Usuario:</span>{' '}
                      {log.userEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {log.ipAddress}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString('es-ES')}
                    </div>
                  </div>

                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 p-2 bg-[#0F0F0F] rounded text-xs text-[#6B7280]">
                      <p className="font-medium text-white mb-1">Cambios:</p>
                      {Object.entries(log.changes).map(([key, value]) => (
                        <p key={key}>
                          <span className="text-[#A0A0A0]">{key}:</span>{' '}
                          {JSON.stringify(value)}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
