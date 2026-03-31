/**
 * FindingDetailModal - Modal profesional para detalles de hallazgo
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronDown,
  User,
  Clock,
  AlertCircle,
  Code,
  BookOpen,
  Copy,
  Check,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Finding, FindingStatus, User as IUser } from '../../types/findings';
import { findingsService } from '../../services/findings.service';
import { useToast } from '../../hooks/useToast';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import CommentThread from './CommentThread';

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
  { color: string; icon: string; label: string }
> = {
  DETECTED: { color: '#EC4899', icon: '🔴', label: 'Detectado' },
  IN_REVIEW: { color: '#6366F1', icon: '🔵', label: 'En Revisión' },
  IN_CORRECTION: { color: '#F59E0B', icon: '🟡', label: 'En Corrección' },
  CORRECTED: { color: '#8B5CF6', icon: '🟣', label: 'Corregido' },
  VERIFIED: { color: '#10B981', icon: '✓', label: 'Verificado' },
  FALSE_POSITIVE: { color: '#6B7280', icon: '⊘', label: 'Falso Positivo' },
  CLOSED: { color: '#4B5563', icon: '✓✓', label: 'Cerrado' },
};

export default function FindingDetailModal({
  finding,
  analysts,
  onClose,
  onStatusChange,
}: FindingDetailModalProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [selectedStatus, setSelectedStatus] = useState<FindingStatus | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [selectedAnalyst, setSelectedAnalyst] = useState<string | null>(
    finding.assignment?.assignedTo || null
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const toast = useToast();

  // Listen to socket events for this specific finding
  useSocketEvents({
    onFindingUpdated: (data) => {
      if (data.findingId === finding.id) {
        console.log('📢 This finding was updated via socket');
        onStatusChange(); // Trigger parent refetch
      }
    },
    onFindingAssigned: (data) => {
      if (data.findingId === finding.id) {
        console.log('📢 This finding was assigned via socket');
        onStatusChange();
      }
    },
    onRemediationUpdated: (data) => {
      if (data.findingId === finding.id) {
        console.log('📢 Remediation updated for this finding via socket');
        onStatusChange();
      }
    },
    onRemediationVerified: (data) => {
      if (data.findingId === finding.id) {
        console.log('📢 Remediation verified for this finding via socket');
        onStatusChange();
      }
    },
  });

  const currentStatus: FindingStatus = finding.statusHistory?.[0]?.status || 'DETECTED';
  const availableTransitions = STATUS_WORKFLOW[currentStatus];

  const handleStatusChange = async () => {
    if (!selectedStatus) return;
    try {
      setIsUpdating(true);
      await findingsService.updateFindingStatus(finding.id, selectedStatus, statusNote);
      toast.success(`Estado actualizado a ${STATUS_COLORS[selectedStatus].label}`);
      setSelectedStatus(null);
      setStatusNote('');
      onStatusChange();
    } catch (error) {
      toast.error('Error al actualizar el estado');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAnalyst) return;
    try {
      setIsUpdating(true);
      await findingsService.assignFinding(finding.id, selectedAnalyst);
      toast.success('Hallazgo asignado');
      onStatusChange();
    } catch (error) {
      toast.error('Error al asignar');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const ExpandableSection = ({
    title,
    icon: Icon,
    children,
    id,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    id: string;
  }) => (
    <motion.div className="border border-[#2D2D2D] rounded-lg overflow-hidden" initial={false}>
      <button
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#242424] transition-colors"
      >
        <Icon className="w-5 h-5 text-[#F97316]" />
        <span className="flex-1 text-left font-semibold text-white text-sm">{title}</span>
        <motion.div animate={{ rotate: expandedSection === id ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-[#6B7280]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expandedSection === id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 border-t border-[#2D2D2D] bg-[#1C1C1E] space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Detalles del Hallazgo" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-4">
        {/* Current Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border border-[#2D2D2D] bg-[#1E1E20]"
          style={{ borderLeftColor: STATUS_COLORS[currentStatus].color, borderLeftWidth: '4px' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{STATUS_COLORS[currentStatus].icon}</span>
              <div>
                <p className="text-xs text-gray-400">Estado Actual</p>
                <p className="text-lg font-bold" style={{ color: STATUS_COLORS[currentStatus].color }}>
                  {STATUS_COLORS[currentStatus].label}
                </p>
              </div>
            </div>
            {finding.statusHistory?.[0]?.changedByUser && (
              <p className="text-xs text-gray-500">
                por {finding.statusHistory[0].changedByUser.name}
              </p>
            )}
          </div>
        </motion.div>

        {/* Overview */}
        <ExpandableSection title="Detalles Técnicos" icon={Code} id="overview">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Archivo</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-mono text-[#F97316] break-all">{finding.file}</p>
                <button
                  onClick={() => copyToClipboard(finding.file)}
                  className="p-1 rounded hover:bg-gray-700/50"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {finding.function && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Función</p>
                <p className="text-sm font-mono text-[#6366F1]">{finding.function}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Líneas</p>
              <p className="text-sm font-mono text-gray-300">{finding.lineRange}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Confianza</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${finding.confidence * 100}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                  />
                </div>
                <span className="text-xs font-bold text-gray-300 w-10 text-right">
                  {Math.round(finding.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>
        </ExpandableSection>

        {/* Analysis */}
        <ExpandableSection title="Análisis de Seguridad" icon={AlertCircle} id="analysis">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">¿Por qué es sospechoso?</p>
              <p className="text-sm text-gray-300 leading-relaxed">{finding.whySuspicious}</p>
            </div>

            {finding.codeSnippet && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Fragmento de Código</p>
                <div className="bg-[#1C1C1E] p-3 rounded border border-[#2D2D2D] relative">
                  <pre className="text-xs text-gray-300 font-mono overflow-x-auto">
                    <code>{finding.codeSnippet}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(finding.codeSnippet || '')}
                    className="absolute top-2 right-2 p-1.5 rounded bg-[#242424] hover:bg-[#2D2D2D]"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </ExpandableSection>

        {/* Remediation */}
        <ExpandableSection title="Pasos de Remediación" icon={BookOpen} id="remediation">
          <ol className="space-y-2 list-decimal list-inside">
            {finding.remediationSteps.map((step, idx) => (
              <li key={idx} className="text-sm text-gray-300">
                {step}
              </li>
            ))}
          </ol>
        </ExpandableSection>

        {/* History */}
        <ExpandableSection title="Historial de Cambios" icon={Clock} id="history">
          <div className="space-y-3">
            {finding.statusHistory && finding.statusHistory.length > 0 ? (
              finding.statusHistory.map((change, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-3 pb-3 border-b border-gray-700/30 last:border-0"
                >
                  <div className="flex-shrink-0 pt-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[change.status].color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {STATUS_COLORS[change.status].label}
                    </p>
                    {change.note && (
                      <p className="text-xs text-gray-400 mt-1">{change.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(change.createdAt).toLocaleString('es-ES')} por{' '}
                      {change.changedByUser?.name || 'Sistema'}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Sin historial</p>
            )}
          </div>
        </ExpandableSection>

        {/* Assignment */}
        <ExpandableSection title="Asignación" icon={User} id="assignment">
          <div className="space-y-3">
            <select
              value={selectedAnalyst || ''}
              onChange={(e) => setSelectedAnalyst(e.target.value || null)}
              className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-sm text-white focus:outline-none focus:border-[#F97316]/50"
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
              className="w-full"
            >
              Asignar
            </Button>
          </div>
        </ExpandableSection>

        {/* Status Transition */}
        {availableTransitions.length > 0 && (
          <ExpandableSection title="Cambiar Estado" icon={AlertCircle} id="transition">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded text-xs font-semibold transition-all border ${
                      selectedStatus === status
                        ? 'ring-2 ring-offset-2 ring-offset-gray-900'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: `${STATUS_COLORS[status].color}20`,
                      color: STATUS_COLORS[status].color,
                      borderColor:
                        selectedStatus === status ? STATUS_COLORS[status].color : 'transparent',
                      boxShadow: selectedStatus === status ? `0 0 0 2px ${STATUS_COLORS[status].color}40` : 'none',
                    }}
                  >
                    {STATUS_COLORS[status].label}
                  </button>
                ))}
              </div>

              {selectedStatus && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <textarea
                    placeholder="Nota del cambio (opcional)..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#F97316]/50 text-sm"
                    rows={2}
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

        {/* Comments Section */}
        <ExpandableSection title="Discusión" icon={AlertCircle} id="comments">
          <CommentThread findingId={finding.id} />
        </ExpandableSection>
      </div>
    </Modal>
  );
}
