/**
 * RemediationPanel - UI para gestionar remediaciones
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Filter,
  Loader2,
  Calendar,
  User,
} from 'lucide-react';
import { remediationService } from '../../services/remediation.service';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

interface RemediationPanelProps {
  onCreateNew?: () => void;
}

export default function RemediationPanel({ onCreateNew }: RemediationPanelProps) {
  const [remediations, setRemediations] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const toast = useToast();

  useEffect(() => {
    loadRemediations();
    loadStats();
  }, [filterStatus, showOverdueOnly]);

  const loadRemediations = async () => {
    try {
      setIsLoading(true);
      const result = await remediationService.listRemediations({
        status: filterStatus || undefined,
        overdue: showOverdueOnly,
        limit: 20,
      });
      setRemediations(result.remediations);
    } catch (error) {
      toast.error('Error cargando remediaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await remediationService.getRemediationStats();
      setStats(result);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20';
      case 'IN_PROGRESS':
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
      case 'COMPLETED':
        return 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20';
      case 'VERIFIED':
        return 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20';
      default:
        return 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'IN_PROGRESS':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'VERIFIED':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestión de Remediaciones</h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Seguimiento de correcciones de hallazgos de seguridad
          </p>
        </div>
        <Button
          onClick={onCreateNew}
          icon={Plus}
          className="bg-[#F97316] hover:bg-[#EA6D00]"
        >
          Nueva Remediación
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#6B7280] mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#EAB308] mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-[#EAB308]">
              {stats.byStatus?.PENDING || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#3B82F6] mb-1">En Progreso</p>
            <p className="text-2xl font-bold text-[#3B82F6]">
              {stats.byStatus?.IN_PROGRESS || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
          >
            <p className="text-xs text-[#22C55E] mb-1">Vencidas</p>
            <p className="text-2xl font-bold text-[#EF4444]">{stats.overdue}</p>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setFilterStatus(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !filterStatus
              ? 'bg-[#F97316] text-white'
              : 'bg-[#2D2D2D] text-[#6B7280] hover:bg-[#3D3D3D]'
          }`}
        >
          Todas
        </motion.button>
        {['PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].map((status) => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.05 }}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-[#F97316] text-white'
                : 'bg-[#2D2D2D] text-[#6B7280] hover:bg-[#3D3D3D]'
            }`}
          >
            {status.replace('_', ' ')}
          </motion.button>
        ))}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowOverdueOnly(!showOverdueOnly)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ml-auto ${
            showOverdueOnly
              ? 'bg-[#EF4444] text-white'
              : 'bg-[#2D2D2D] text-[#6B7280] hover:bg-[#3D3D3D]'
          }`}
        >
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Solo Vencidas
        </motion.button>
      </div>

      {/* Remediations List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
            <p className="text-[#6B7280]">Cargando remediaciones...</p>
          </div>
        ) : remediations.length === 0 ? (
          <div className="text-center py-10 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg">
            <AlertCircle className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
            <p className="text-[#6B7280]">No hay remediaciones</p>
          </div>
        ) : (
          remediations.map((rem, idx) => (
            <motion.div
              key={rem.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-[#F97316]/50 ${
                isOverdue(rem.dueDate)
                  ? 'bg-[#EF4444]/5 border-[#EF4444]/20'
                  : 'bg-[#1C1C1E] border-[#2D2D2D]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-white">{rem.title}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                        rem.status
                      )}`}
                    >
                      {getStatusIcon(rem.status)}
                      {rem.status.replace('_', ' ')}
                    </span>
                    {isOverdue(rem.dueDate) && rem.status !== 'VERIFIED' && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/20">
                        Vencida
                      </span>
                    )}
                  </div>

                  {rem.description && (
                    <p className="text-xs text-[#6B7280] mb-3">{rem.description}</p>
                  )}

                  <div className="flex gap-4 text-xs text-[#6B7280]">
                    {rem.finding && (
                      <div>Severidad: <span className="text-white font-medium">{rem.finding.severity}</span></div>
                    )}
                    {rem.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(rem.dueDate).toLocaleDateString('es-ES')}
                      </div>
                    )}
                    {rem.assignee && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {rem.assignee.name}
                      </div>
                    )}
                  </div>
                </div>

                {rem.priority !== undefined && (
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280]">Prioridad</p>
                    <p className="text-lg font-bold text-[#F97316]">{rem.priority}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
