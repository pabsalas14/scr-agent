/**
 * FindingsTracker - Panel de Control de Hallazgos
 * Gestión completa del lifecycle de hallazgos: DETECTED → CLOSED
 * Con asignaciones, remediaciones, y notificaciones en tiempo real
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  X,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { findingsService } from '../../services/findings.service';
import { usersService } from '../../services/users.service';
import { notificationsService } from '../../services/notifications.service';
import { Finding, FindingStatus, Severity } from '../../types/findings';
import FindingDetailModal from './FindingDetailModal';
import RemediationModal from './RemediationModal';

interface FindingsTrackerProps {
  analysisId: string;
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  DETECTED: {
    label: 'Detectado',
    color: '#EC4899',
    bgColor: 'from-pink-900/20 to-pink-800/10',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  IN_REVIEW: {
    label: 'En Revisión',
    color: '#0EA5E9',
    bgColor: 'from-blue-900/20 to-blue-800/10',
    icon: <Eye className="w-4 h-4" />,
  },
  IN_CORRECTION: {
    label: 'En Corrección',
    color: '#F59E0B',
    bgColor: 'from-orange-900/20 to-orange-800/10',
    icon: <Edit2 className="w-4 h-4" />,
  },
  CORRECTED: {
    label: 'Corregido',
    color: '#8B5CF6',
    bgColor: 'from-purple-900/20 to-purple-800/10',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  VERIFIED: {
    label: 'Verificado',
    color: '#10B981',
    bgColor: 'from-emerald-900/20 to-emerald-800/10',
    icon: <CheckCircle className="w-4 h-4" />,
  },
  FALSE_POSITIVE: {
    label: 'Falso Positivo',
    color: '#6B7280',
    bgColor: 'from-gray-900/20 to-gray-800/10',
    icon: <X className="w-4 h-4" />,
  },
  CLOSED: {
    label: 'Cerrado',
    color: '#4B5563',
    bgColor: 'from-slate-900/20 to-slate-800/10',
    icon: <CheckCircle className="w-4 h-4" />,
  },
};

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; bgColor: string }
> = {
  CRITICAL: {
    label: 'Crítico',
    color: '#DC2626',
    bgColor: 'from-red-600/20 to-red-500/20',
  },
  HIGH: {
    label: 'Alto',
    color: '#EA580C',
    bgColor: 'from-orange-600/20 to-orange-500/20',
  },
  MEDIUM: {
    label: 'Medio',
    color: '#EAB308',
    bgColor: 'from-yellow-600/20 to-yellow-500/20',
  },
  LOW: {
    label: 'Bajo',
    color: '#22C55E',
    bgColor: 'from-green-600/20 to-green-500/20',
  },
};

export default function FindingsTracker({ analysisId }: FindingsTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FindingStatus | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'ALL'>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [remediationFinding, setRemediationFinding] = useState<Finding | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch findings
  const { data: findings = [], isLoading: findingsLoading } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => findingsService.getFindings(analysisId),
    refetchInterval: 5000,
  });

  // Fetch users for assignment
  const { data: analysts = [] } = useQuery({
    queryKey: ['analysts'],
    queryFn: () => usersService.getUsersByRole('ANALYST'),
  });

  // Check unread notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const count = await notificationsService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Error checking notifications:', error);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter findings
  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      finding.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.whySuspicious.toLowerCase().includes(searchTerm.toLowerCase());

    const latestStatus =
      finding.statusHistory?.[0]?.status ||
      'DETECTED';

    const matchesStatus = filterStatus === 'ALL' || latestStatus === filterStatus;
    const matchesSeverity =
      filterSeverity === 'ALL' || finding.severity === filterSeverity;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Group findings by status
  const groupedFindings = {
    DETECTED: filteredFindings.filter(
      (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === 'DETECTED'
    ),
    IN_REVIEW: filteredFindings.filter(
      (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === 'IN_REVIEW'
    ),
    IN_CORRECTION: filteredFindings.filter(
      (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === 'IN_CORRECTION'
    ),
    VERIFIED: filteredFindings.filter(
      (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === 'VERIFIED'
    ),
    CLOSED: filteredFindings.filter(
      (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === 'CLOSED'
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">
              🔍 Gestor de Hallazgos
            </h1>
            <p className="text-gray-400">
              Tracabilidad completa del lifecycle de hallazgos y remediaciones
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="relative">
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </div>
              <Bell className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col gap-4 md:flex-row md:items-center"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por archivo o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FindingStatus | 'ALL')}
          className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>

        {/* Severity Filter */}
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as Severity | 'ALL')}
          className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todas las severidades</option>
          {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        {[
          {
            label: 'Total',
            count: filteredFindings.length,
            color: '#0EA5E9',
            icon: '📊',
          },
          {
            label: 'Críticos',
            count: filteredFindings.filter((f) => f.severity === 'CRITICAL').length,
            color: '#DC2626',
            icon: '🔴',
          },
          {
            label: 'En Corrección',
            count: groupedFindings.IN_CORRECTION.length,
            color: '#F59E0B',
            icon: '⚠️',
          },
          {
            label: 'Verificados',
            count: groupedFindings.VERIFIED.length,
            color: '#10B981',
            icon: '✓',
          },
          {
            label: 'Cerrados',
            count: groupedFindings.CLOSED.length,
            color: '#6B7280',
            icon: '✓✓',
          },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="text-center">
                <p className="text-3xl mb-1">{stat.icon}</p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.count}
                </p>
                <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Loading State */}
      {findingsLoading && (
        <Card>
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-3">⚙️</div>
            <p className="text-gray-400">Cargando hallazgos...</p>
          </div>
        </Card>
      )}

      {/* Findings by Status */}
      {!findingsLoading && filteredFindings.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold">No hay hallazgos</p>
            <p className="text-gray-400 text-sm mt-1">
              Ajusta los filtros o espera análisis nuevos
            </p>
          </div>
        </Card>
      )}

      {!findingsLoading &&
        Object.entries(groupedFindings)
          .filter(([_, items]) => items.length > 0)
          .map(([status, items]) => {
            const config = STATUS_CONFIG[status as FindingStatus];
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="mb-4 flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <h3 className="text-lg font-bold text-white">
                      {config.label} ({items.length})
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {items.map((finding, idx) => {
                      const severity = SEVERITY_CONFIG[finding.severity];
                      return (
                        <motion.div
                          key={finding.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 transition-all hover:shadow-lg"
                        >
                          <div className="flex items-start gap-3">
                            {/* Severity Badge */}
                            <div
                              className="px-2 py-1 rounded text-xs font-bold flex-shrink-0"
                              style={{
                                backgroundColor: severity.bgColor.split(' ')[0],
                                color: severity.color,
                              }}
                            >
                              {severity.label}
                            </div>

                            {/* File and Description */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold truncate">
                                {finding.file}
                                {finding.function && ` → ${finding.function}`}
                              </p>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {finding.whySuspicious}
                              </p>
                              <div className="flex gap-2 mt-2">
                                {finding.assignment && (
                                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                    👤 {finding.assignment.assignedUser?.name || 'Asignado'}
                                  </span>
                                )}
                                {finding.remediation && (
                                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                                    ✓ En remediación
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 flex-shrink-0">
                              <button
                                onClick={() => setSelectedFinding(finding)}
                                className="p-2 rounded hover:bg-blue-500/20 transition-colors"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4 text-blue-400" />
                              </button>
                              {(status === 'CORRECTED' || status === 'IN_CORRECTION') && (
                                <button
                                  onClick={() => setRemediationFinding(finding)}
                                  className="p-2 rounded hover:bg-green-500/20 transition-colors"
                                  title="Remediación"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            );
          })}

      {/* Finding Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          analysts={analysts}
          onClose={() => setSelectedFinding(null)}
          onStatusChange={() => {
            setSelectedFinding(null);
          }}
        />
      )}

      {/* Remediation Modal */}
      {remediationFinding && (
        <RemediationModal
          finding={remediationFinding}
          onClose={() => setRemediationFinding(null)}
          onSave={() => {
            setRemediationFinding(null);
          }}
        />
      )}
    </div>
  );
}

// Helper icon component (placeholder, will use actual icon)
function Bell(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
