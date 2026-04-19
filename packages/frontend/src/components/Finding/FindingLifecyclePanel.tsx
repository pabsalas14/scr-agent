import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader,
  Lock,
  Send,
  History,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import ConfirmationModal from '../ui/ConfirmationModal';

interface LifecycleData {
  currentStatus: string;
  history: Array<{
    status: string;
    changedAt: string;
    changedBy: string;
    note?: string;
  }>;
  timestamps: {
    detected: string;
    corrected?: string;
    verified?: string;
    closed?: string;
  };
  mttc?: number;
}

interface AuditEntry {
  id: string;
  action: string;
  changedBy: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  timestamp: string;
}

const STATUS_COLORS: Record<string, string> = {
  DETECTED: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  IN_REVIEW: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IN_CORRECTION: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  CORRECTED: 'bg-green-500/20 text-green-300 border-green-500/30',
  VERIFIED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  FALSE_POSITIVE: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DETECTED: ['IN_REVIEW', 'IN_CORRECTION', 'FALSE_POSITIVE'],
  IN_REVIEW: ['IN_CORRECTION', 'FALSE_POSITIVE'],
  IN_CORRECTION: ['CORRECTED', 'FALSE_POSITIVE'],
  CORRECTED: ['VERIFIED', 'IN_CORRECTION', 'FALSE_POSITIVE'],
  VERIFIED: ['CLOSED', 'IN_CORRECTION'],
  FALSE_POSITIVE: ['DETECTED'],
  CLOSED: ['IN_CORRECTION'],
};

export default function FindingLifecyclePanel({ findingId }: { findingId: string }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [comment, setComment] = useState('');
  const [showAudit, setShowAudit] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fetch lifecycle
  const { data: lifecycle, isLoading: loadingLifecycle } = useQuery<LifecycleData>({
    queryKey: ['finding-lifecycle', findingId],
    queryFn: async () => {
      const res = await apiService.get(`/findings/${findingId}/lifecycle`);
      return res.data?.data;
    },
  });

  // Fetch audit trail
  const { data: auditTrail, isLoading: loadingAudit } = useQuery<AuditEntry[]>({
    queryKey: ['finding-audit-trail', findingId],
    queryFn: async () => {
      const res = await apiService.get(`/findings/${findingId}/audit-trail`);
      return res.data?.data || [];
    },
    enabled: showAudit,
  });

  // Change status mutation
  const changeStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return await apiService.put(`/findings/${findingId}/status`, {
        status: newStatus,
        comment: comment || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Estado actualizado');
      setShowTransitionForm(false);
      setSelectedStatus('');
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['finding-lifecycle', findingId] });
      queryClient.invalidateQueries({ queryKey: ['finding-audit-trail', findingId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    },
  });

  const currentStatus = lifecycle?.currentStatus || 'DETECTED';
  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];

  if (loadingLifecycle) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-3 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Format MTTC
  const mttcHours = lifecycle?.mttc ? Math.round(lifecycle.mttc / 1000 / 60 / 60) : null;

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Estado Actual</h3>

        <div className="flex items-center justify-between mb-4">
          <div className={`px-4 py-2 rounded-full border font-semibold ${STATUS_COLORS[currentStatus]}`}>
            {currentStatus}
          </div>
          {currentStatus === 'CLOSED' && <Lock size={20} className="text-green-400" />}
          {currentStatus === 'VERIFIED' && <CheckCircle size={20} className="text-emerald-400" />}
        </div>

        {allowedStatuses.length > 0 && !showTransitionForm && (
          <Button
            onClick={() => {
              setShowTransitionForm(true);
              setSelectedStatus(allowedStatuses[0]);
            }}
            variant="secondary"
            size="sm"
          >
            Cambiar Estado
          </Button>
        )}
      </div>

      {/* Transition Form */}
      {showTransitionForm && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3 animate-in fade-in">
          <div>
            <label className="block text-xs text-[#6B7280] mb-2 font-medium">
              Cambiar a:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {allowedStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-[#6B7280] mb-2 font-medium">
              Comentario (opcional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe por qué cambias el estado..."
              className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white text-sm focus:outline-none focus:border-blue-500 resize-none h-16"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={changeStatusMutation.isPending}
              size="sm"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Send size={14} />
              {changeStatusMutation.isPending ? 'Actualizando...' : 'Confirmar'}
            </Button>
            <Button
              onClick={() => {
                setShowTransitionForm(false);
                setSelectedStatus('');
                setComment('');
              }}
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={changeStatusMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={18} />
          Línea de Tiempo
        </h3>

        <div className="space-y-3">
          {lifecycle?.history && lifecycle.history.length > 0 ? (
            lifecycle.history.map((entry, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 p-3 rounded-lg border ${STATUS_COLORS[entry.status]}`}
              >
                <div className="flex-1">
                  <p className="font-semibold">{entry.status}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(entry.changedAt).toLocaleString('es-ES')}
                  </p>
                  {entry.note && <p className="text-xs mt-2 italic">{entry.note}</p>}
                </div>
                <p className="text-xs whitespace-nowrap">{entry.changedBy}</p>
              </div>
            ))
          ) : (
            <p className="text-[#666666] text-sm">Sin historial de cambios</p>
          )}
        </div>
      </div>

      {/* Metrics */}
      {lifecycle && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4">Métricas</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#6B7280] mb-1">Detectado</p>
              <p className="text-white font-semibold">
                {new Date(lifecycle.timestamps.detected).toLocaleDateString('es-ES')}
              </p>
            </div>

            {lifecycle.timestamps.corrected && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Corregido</p>
                <p className="text-white font-semibold">
                  {new Date(lifecycle.timestamps.corrected).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}

            {lifecycle.timestamps.verified && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Verificado</p>
                <p className="text-white font-semibold">
                  {new Date(lifecycle.timestamps.verified).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}

            {lifecycle.timestamps.closed && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">Cerrado</p>
                <p className="text-white font-semibold">
                  {new Date(lifecycle.timestamps.closed).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}

            {mttcHours && (
              <div>
                <p className="text-xs text-[#6B7280] mb-1">MTTC</p>
                <p className="text-white font-semibold">{mttcHours} horas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <button
          onClick={() => setShowAudit(!showAudit)}
          className="flex items-center gap-2 w-full text-left font-semibold text-white hover:text-blue-300 transition-colors"
        >
          <History size={18} />
          Registro de Auditoría {showAudit ? '▼' : '▶'}
        </button>

        {showAudit && (
          <div className="mt-4 space-y-3">
            {loadingAudit ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin" />
              </div>
            ) : auditTrail && auditTrail.length > 0 ? (
              auditTrail.map((entry) => (
                <div key={entry.id} className="bg-[#111111] rounded p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-blue-300">{entry.action}</p>
                    <p className="text-[#666666]">
                      {new Date(entry.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <p className="text-[#A0A0A0]">Por: {entry.changedBy}</p>
                  {entry.oldValue && entry.newValue && (
                    <p className="text-[#666666]">
                      {entry.oldValue} → {entry.newValue}
                    </p>
                  )}
                  {entry.comment && (
                    <p className="text-[#A0A0A0] italic">"{entry.comment}"</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-[#666666] text-sm">Sin cambios registrados</p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Status Change"
        description={`Change finding status from ${lifecycle?.currentStatus || 'DETECTED'} to ${selectedStatus}?`}
        type="warning"
        confirmText="Change Status"
        cancelText="Cancel"
        showComment={true}
        defaultComment={comment}
        onCommentChange={setComment}
        onConfirm={() => {
          changeStatusMutation.mutate(selectedStatus);
          setShowConfirmation(false);
        }}
        onCancel={() => setShowConfirmation(false)}
        isLoading={changeStatusMutation.isPending}
      />
    </div>
  );
}
