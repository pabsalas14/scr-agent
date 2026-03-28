/**
 * FindingsTracker - Panel Profesional de Control de Hallazgos
 * Diseño completamente renovado con interfaz moderna y fluida
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Edit2,
  Zap,
  TrendingUp,
  Shield,
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { findingsService } from '../../services/findings.service';
import { usersService } from '../../services/users.service';
import { notificationsService } from '../../services/notifications.service';
import { Finding, FindingStatus, Severity } from '../../types/findings';
import FindingDetailModal from './FindingDetailModal';
import RemediationModal from './RemediationModal';
import { useSocketEvents } from '../../hooks/useSocketEvents';

interface FindingsTrackerProps {
  analysisId: string;
}

const STATUS_CONFIG: Record<
  FindingStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode; badge: string }
> = {
  DETECTED: {
    label: 'Detectado',
    color: '#EC4899',
    bgColor: 'bg-pink-500/10',
    icon: <AlertCircle className="w-4 h-4" />,
    badge: '🔴',
  },
  IN_REVIEW: {
    label: 'En Revisión',
    color: '#0EA5E9',
    bgColor: 'bg-blue-500/10',
    icon: <Eye className="w-4 h-4" />,
    badge: '🔵',
  },
  IN_CORRECTION: {
    label: 'En Corrección',
    color: '#F59E0B',
    bgColor: 'bg-orange-500/10',
    icon: <Edit2 className="w-4 h-4" />,
    badge: '🟡',
  },
  CORRECTED: {
    label: 'Corregido',
    color: '#8B5CF6',
    bgColor: 'bg-purple-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
    badge: '🟣',
  },
  VERIFIED: {
    label: 'Verificado',
    color: '#10B981',
    bgColor: 'bg-emerald-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
    badge: '✓',
  },
  FALSE_POSITIVE: {
    label: 'Falso Positivo',
    color: '#6B7280',
    bgColor: 'bg-gray-500/10',
    icon: <AlertCircle className="w-4 h-4" />,
    badge: '⊘',
  },
  CLOSED: {
    label: 'Cerrado',
    color: '#4B5563',
    bgColor: 'bg-slate-500/10',
    icon: <CheckCircle2 className="w-4 h-4" />,
    badge: '✓✓',
  },
};

const SEVERITY_CONFIG: Record<
  Severity,
  { label: string; color: string; badge: string }
> = {
  CRITICAL: { label: 'Crítico', color: '#DC2626', badge: '🔴' },
  HIGH: { label: 'Alto', color: '#EA580C', badge: '🟠' },
  MEDIUM: { label: 'Medio', color: '#EAB308', badge: '🟡' },
  LOW: { label: 'Bajo', color: '#22C55E', badge: '🟢' },
};

export default function FindingsTracker({ analysisId }: FindingsTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FindingStatus | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'ALL'>('ALL');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [remediationFinding, setRemediationFinding] = useState<Finding | null>(null);

  const { data: findings = [], isLoading: findingsLoading, refetch } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => findingsService.getFindings(analysisId),
    refetchInterval: 5000,
  });

  const { data: analysts = [] } = useQuery({
    queryKey: ['analysts'],
    queryFn: () => usersService.getUsersByRole('ANALYST'),
  });

  // Listen to socket events and refetch findings when changes occur
  useSocketEvents({
    onFindingUpdated: (data) => {
      console.log('🔄 Refetching findings due to status change:', data);
      refetch();
    },
    onFindingAssigned: (data) => {
      console.log('🔄 Refetching findings due to assignment:', data);
      refetch();
    },
    onRemediationUpdated: (data) => {
      console.log('🔄 Refetching findings due to remediation update:', data);
      refetch();
    },
    onRemediationVerified: (data) => {
      console.log('🔄 Refetching findings due to remediation verification:', data);
      refetch();
    },
  });

  // Filtrar hallazgos
  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      finding.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.whySuspicious.toLowerCase().includes(searchTerm.toLowerCase());

    const latestStatus = finding.statusHistory?.[0]?.status || 'DETECTED';
    const matchesStatus = filterStatus === 'ALL' || latestStatus === filterStatus;
    const matchesSeverity = filterSeverity === 'ALL' || finding.severity === filterSeverity;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Agrupar por status
  const groupedByStatus = Object.values(STATUS_CONFIG).reduce((acc, config) => {
    acc[config.label] = filteredFindings.filter(
      (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === Object.keys(STATUS_CONFIG).find(
        (k) => STATUS_CONFIG[k as FindingStatus].label === config.label
      )
    );
    return acc;
  }, {} as Record<string, Finding[]>);

  // Stats
  const stats = [
    {
      label: 'Total',
      value: filteredFindings.length,
      icon: '📊',
      color: '#0EA5E9',
    },
    {
      label: 'Críticos',
      value: filteredFindings.filter((f) => f.severity === 'CRITICAL').length,
      icon: '🔴',
      color: '#DC2626',
    },
    {
      label: 'En Progreso',
      value: filteredFindings.filter((f) =>
        ['IN_REVIEW', 'IN_CORRECTION'].includes(f.statusHistory?.[0]?.status || 'DETECTED')
      ).length,
      icon: '⚙️',
      color: '#F59E0B',
    },
    {
      label: 'Remediados',
      value: filteredFindings.filter((f) =>
        ['VERIFIED', 'CLOSED'].includes(f.statusHistory?.[0]?.status || 'DETECTED')
      ).length,
      icon: '✓',
      color: '#10B981',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header profesional */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Control de Hallazgos</h1>
              <p className="text-sm text-gray-400 mt-1">Gestión integral del lifecycle de vulnerabilidades</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10" style={{ backgroundColor: stat.color }} />
              <div className="relative">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{stat.label}</p>
                <p className="text-3xl font-black mt-2" style={{ color: stat.color }}>
                  {stat.value}
                </p>
                <div className="text-2xl mt-2">{stat.icon}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters - Modernizado */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Filtros</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por archivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FindingStatus | 'ALL')}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
          >
            <option value="ALL">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as Severity | 'ALL')}
            className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
          >
            <option value="ALL">Todas las severidades</option>
            {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Findings Grid - Diseño profesional */}
      {findingsLoading ? (
        <Card>
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-orange-400 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-400">Cargando hallazgos...</p>
          </div>
        </Card>
      ) : filteredFindings.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold">Sin hallazgos</p>
            <p className="text-gray-500 text-sm mt-1">Ajusta los filtros para ver más resultados</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(STATUS_CONFIG).map(([statusKey, config]) => {
            const statusFindings = filteredFindings.filter(
              (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === (statusKey as FindingStatus)
            );

            if (statusFindings.length === 0) return null;

            return (
              <motion.div key={statusKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  {/* Section Header */}
                  <div className="mb-4 pb-4 border-b border-gray-700 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    <h3 className="text-lg font-bold text-white flex-1">{config.label}</h3>
                    <span className="px-2.5 py-1 bg-gray-800/50 rounded text-xs font-semibold" style={{ color: config.color }}>
                      {statusFindings.length}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {statusFindings.map((finding, idx) => {
                      const severity = SEVERITY_CONFIG[finding.severity];
                      return (
                        <motion.div
                          key={finding.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="group p-3 rounded-lg border border-gray-700/50 hover:border-gray-600 bg-gray-800/20 hover:bg-gray-800/40 transition-all cursor-pointer"
                          onClick={() => setSelectedFinding(finding)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Severity Badge */}
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                              style={{
                                backgroundColor: `${severity.color}20`,
                                color: severity.color,
                              }}
                            >
                              {severity.badge}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm truncate group-hover:text-orange-400 transition-colors">
                                {finding.file.split('/').pop()}
                              </p>
                              {finding.function && (
                                <p className="text-xs text-gray-500 mt-0.5">{finding.function}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{finding.whySuspicious}</p>

                              {/* Tags */}
                              <div className="flex gap-2 mt-2">
                                {finding.assignment && (
                                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                    👤 {finding.assignment.assignedUser?.name || 'Asignado'}
                                  </span>
                                )}
                                {finding.remediation?.status === 'VERIFIED' && (
                                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                                    ✓ Remediado
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFinding(finding);
                                }}
                                className="p-2 rounded hover:bg-blue-500/20 transition-colors"
                                title="Ver detalle"
                              >
                                <Eye className="w-4 h-4 text-blue-400" />
                              </button>
                              {(statusKey === 'IN_CORRECTION' || statusKey === 'CORRECTED') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRemediationFinding(finding);
                                  }}
                                  className="p-2 rounded hover:bg-green-500/20 transition-colors"
                                  title="Remediación"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
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
        </div>
      )}

      {/* Modals */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          analysts={analysts}
          onClose={() => setSelectedFinding(null)}
          onStatusChange={() => {
            setSelectedFinding(null);
            refetch();
          }}
        />
      )}

      {remediationFinding && (
        <RemediationModal
          finding={remediationFinding}
          onClose={() => setRemediationFinding(null)}
          onSave={() => {
            setRemediationFinding(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
