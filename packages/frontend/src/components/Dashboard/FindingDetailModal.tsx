/**
 * FindingDetailModal - Modal detallado de un hallazgo
 * Muestra: historial de estado, detalles técnicos, asignación, recomendaciones
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  ChevronDown,
  User,
  Clock,
  AlertCircle,
  Code,
  BookOpen,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Finding, FindingStatus, User as IUser } from '../../types/findings';
import { findingsService } from '../../services/findings.service';
import { useToast } from '../../hooks/useToast';

interface FindingDetailModalProps {
  finding: Finding;
  analysts: IUser[];
  onClose: () => void;
  onStatusChange: () => void;
}

const STATUS_WORKFLOW: Record<FindingStatus, FindingStatus[]> = {
  DETECTED: ['IN_REVIEW', 'FALSE_POSITIVE'],
  IN_REVIEW: ['IN_CORRECTION', 'DETECTED', 'FALSE_POSITIVE'],
  IN_CORRECTION: ['CORRECTED', 'IN_REVIEW'],
  CORRECTED: ['VERIFIED', 'IN_CORRECTION'],
  VERIFIED: ['CLOSED'],
  FALSE_POSITIVE: ['DETECTED'],
  CLOSED: [],
};

const STATUS_COLORS: Record<
  FindingStatus,
  { color: string; bgColor: string; label: string }
> = {
  DETECTED: {
    color: '#EC4899',
    bgColor: 'from-pink-900/30 to-pink-800/20',
    label: 'Detectado',
  },
  IN_REVIEW: {
    color: '#0EA5E9',
    bgColor: 'from-blue-900/30 to-blue-800/20',
    label: 'En Revisión',
  },
  IN_CORRECTION: {
    color: '#F59E0B',
    bgColor: 'from-orange-900/30 to-orange-800/20',
    label: 'En Corrección',
  },
  CORRECTED: {
    color: '#8B5CF6',
    bgColor: 'from-purple-900/30 to-purple-800/20',
    label: 'Corregido',
  },
  VERIFIED: {
    color: '#10B981',
    bgColor: 'from-emerald-900/30 to-emerald-800/20',
    label: 'Verificado',
  },
  FALSE_POSITIVE: {
    color: '#6B7280',
    bgColor: 'from-gray-900/30 to-gray-800/20',
    label: 'Falso Positivo',
  },
  CLOSED: {
    color: '#4B5563',
    bgColor: 'from-slate-900/30 to-slate-800/20',
    label: 'Cerrado',
  },
};

export default function FindingDetailModal({
  finding,
  analysts,
  onClose,
  onStatusChange,
}: FindingDetailModalProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    'overview'
  );
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(
    finding.assignment?.assignedTo || null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const currentStatus: FindingStatus =
    finding.statusHistory?.[0]?.status || 'DETECTED';
  const availableTransitions = STATUS_WORKFLOW[currentStatus];

  const handleStatusChange = async () => {
    if (!selectedStatus) return;

    try {
      setIsUpdating(true);
      await findingsService.updateFindingStatus(
        finding.id,
        selectedStatus,
        statusNote
      );
      toast.success(`Estado actualizado a ${selectedStatus}`);
      setSelectedStatus(null);
      setStatusNote('');
      onStatusChange();
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAnalyst) return;

    try {
      setIsUpdating(true);
      await findingsService.assignFinding(finding.id, selectedAnalyst);
      toast.success('Hallazgo asignado exitosamente');
      onStatusChange();
    } catch (error) {
      toast.error('Error al asignar hallazgo');
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const ExpandableSection = ({
    title,
    icon: Icon,
    children,
    id,
  }: {
    title: string;
    icon: any;
    children: React.ReactNode;
    id: string;
  }) => (
    <motion.div
      className="border border-gray-700/50 rounded-lg overflow-hidden"
      initial={false}
    >
      <button
        onClick={() =>
          setExpandedSection(expandedSection === id ? null : id)
        }
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors"
      >
        <Icon className="w-5 h-5 text-blue-400" />
        <span className="flex-1 text-left font-semibold text-white">
          {title}
        </span>
        <motion.div
          animate={{ rotate: expandedSection === id ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: expandedSection === id ? 'auto' : 0,
          opacity: expandedSection === id ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-4 py-4 border-t border-gray-700/30 bg-gray-900/50">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Hallazgo en ${finding.file}`}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Current Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border border-opacity-30 bg-gradient-to-r ${
            STATUS_COLORS[currentStatus].bgColor
          }`}
          style={{
            borderColor: STATUS_COLORS[currentStatus].color,
            borderOpacity: 0.3,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Estado Actual</p>
              <p
                className="text-xl font-bold"
                style={{ color: STATUS_COLORS[currentStatus].color }}
              >
                {STATUS_COLORS[currentStatus].label}
              </p>
            </div>
            {finding.statusHistory?.[0]?.changedByUser && (
              <p className="text-xs text-gray-400">
                Actualizado por: {finding.statusHistory[0].changedByUser.name}
              </p>
            )}
          </div>
        </motion.div>

        {/* Overview Section */}
        <ExpandableSection title="Detalles del Hallazgo" icon={AlertCircle} id="overview">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400">Archivo</p>
              <p className="text-white font-mono text-sm">{finding.file}</p>
            </div>
            {finding.function && (
              <div>
                <p className="text-xs text-gray-400">Función</p>
                <p className="text-white font-mono text-sm">{finding.function}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400">Líneas</p>
              <p className="text-white font-mono text-sm">{finding.lineRange}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Confianza</p>
              <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${finding.confidence * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Math.round(finding.confidence * 100)}%
              </p>
            </div>
          </div>
        </ExpandableSection>

        {/* Why Suspicious Section */}
        <ExpandableSection title="Análisis Técnico" icon={Code} id="analysis">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-2">¿Por qué es sospechoso?</p>
              <p className="text-white text-sm leading-relaxed">
                {finding.whySuspicious}
              </p>
            </div>
            {finding.codeSnippet && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Fragmento de código</p>
                <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                  <code>{finding.codeSnippet}</code>
                </pre>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Remediation Steps */}
        <ExpandableSection
          title="Pasos de Remediación"
          icon={BookOpen}
          id="remediation"
        >
          <ol className="space-y-2 list-decimal list-inside">
            {finding.remediationSteps.map((step, idx) => (
              <li key={idx} className="text-white text-sm">
                {step}
              </li>
            ))}
          </ol>
        </ExpandableSection>

        {/* Status History */}
        <ExpandableSection title="Historial de Estados" icon={Clock} id="history">
          <div className="space-y-3">
            {finding.statusHistory && finding.statusHistory.length > 0 ? (
              finding.statusHistory.map((change, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-3 text-sm"
                >
                  <div className="flex-shrink-0">
                    <div
                      className="w-3 h-3 rounded-full mt-1"
                      style={{
                        backgroundColor: STATUS_COLORS[change.status].color,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {STATUS_COLORS[change.status].label}
                    </p>
                    {change.note && (
                      <p className="text-gray-400 text-xs mt-1">{change.note}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(change.createdAt).toLocaleString()} por{' '}
                      {change.changedByUser?.name || 'Sistema'}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">Sin historial</p>
            )}
          </div>
        </ExpandableSection>

        {/* Assignment Section */}
        <ExpandableSection title="Asignación" icon={User} id="assignment">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-2">Asignar a Analista</p>
              <select
                value={selectedAnalyst || ''}
                onChange={(e) => setSelectedAnalyst(e.target.value || null)}
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Sin asignar</option>
                {analysts.map((analyst) => (
                  <option key={analyst.id} value={analyst.id}>
                    {analyst.name || analyst.email}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAssign}
                disabled={isUpdating || !selectedAnalyst}
                isLoading={isUpdating}
                className="w-full mt-2"
              >
                Asignar
              </Button>
            </div>
          </div>
        </ExpandableSection>

        {/* Status Transition Section */}
        {availableTransitions.length > 0 && (
          <ExpandableSection
            title="Cambiar Estado"
            icon={AlertCircle}
            id="transition"
          >
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                Estados disponibles para transición:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                      selectedStatus === status
                        ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${STATUS_COLORS[status].color}30`,
                      color: STATUS_COLORS[status].color,
                      ringColor: STATUS_COLORS[status].color,
                    }}
                  >
                    {STATUS_COLORS[status].label}
                  </button>
                ))}
              </div>

              {selectedStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <textarea
                    placeholder="Nota de cambio (opcional)..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
                    rows={3}
                  />
                  <Button
                    onClick={handleStatusChange}
                    disabled={isUpdating}
                    isLoading={isUpdating}
                    className="w-full mt-2"
                  >
                    Confirmar Cambio
                  </Button>
                </motion.div>
              )}
            </div>
          </ExpandableSection>
        )}
      </div>
    </Modal>
  );
}
