import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';
import { useConfirm } from '../../hooks/useConfirm';

type FindingState = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface FindingStatePanelProps {
  hallazgoId: string;
  currentState?: FindingState;
  riskType: string;
  onClose: () => void;
  onStateChange?: (newState: FindingState) => void;
}

const STATE_CONFIG: Record<FindingState, { label: string; icon: React.ElementType; color: string; bgColor: string; description: string }> = {
  'OPEN': {
    label: 'Abierto',
    icon: AlertCircle,
    color: 'text-[#EF4444]',
    bgColor: 'bg-[#EF4444]/10',
    description: 'Hallazgo identificado que requiere atención.',
  },
  'IN_PROGRESS': {
    label: 'En Progreso',
    icon: Zap,
    color: 'text-[#F97316]',
    bgColor: 'bg-[#F97316]/10',
    description: 'Se está remediando esta vulnerabilidad.',
  },
  'RESOLVED': {
    label: 'Resuelto',
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
    bgColor: 'bg-[#22C55E]/10',
    description: 'La vulnerabilidad ha sido corregida o mitigada con éxito.',
  },
  'CLOSED': {
    label: 'Cerrado',
    icon: Clock,
    color: 'text-[#6B7280]',
    bgColor: 'bg-[#6B7280]/10',
    description: 'Este hallazgo fue rechazado o identificado como un falso positivo.',
  },
};

export default function FindingStatePanel({ hallazgoId, currentState, riskType, onClose, onStateChange }: FindingStatePanelProps) {
  const [selectedState, setSelectedState] = useState<FindingState>(currentState || 'OPEN');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const handleSave = async () => {
    // Check if state change requires confirmation
    const needsConfirmation = selectedState === 'CLOSED' || selectedState === 'RESOLVED';

    if (needsConfirmation && selectedState !== currentState) {
      const confirmMessages = {
        CLOSED: {
          title: 'Cerrar Hallazgo',
          message: selectedState === 'CLOSED'
            ? '¿Estás seguro de que deseas cerrar este hallazgo? Esto indica que es un falso positivo o ha sido rechazado.'
            : '¿Estás seguro de que deseas marcar este hallazgo como resuelto? Esta acción indica que la vulnerabilidad ha sido corregida.',
          isDangerous: true,
        },
        RESOLVED: {
          title: 'Marcar como Resuelto',
          message: '¿Estás seguro de que deseas marcar este hallazgo como resuelto? Esta acción indica que la vulnerabilidad ha sido corregida.',
          isDangerous: false,
        },
      };

      const message = confirmMessages[selectedState] || confirmMessages.CLOSED;

      await confirm.confirm({
        title: message.title,
        message: message.message,
        isDangerous: message.isDangerous,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        onConfirm: performSave,
      });
    } else {
      await performSave();
    }
  };

  const performSave = async () => {
    try {
      setIsSaving(true);
      await apiService.cambiarEstadoHallazgo(hallazgoId, {
        status: selectedState,
        notes: notes.trim() || undefined,
      });
      toast.success(`Estado actualizado a: ${STATE_CONFIG[selectedState].label}`);
      onStateChange?.(selectedState);
      onClose();
    } catch (error) {
      console.error('Error updating finding state:', error);
      toast.error('Error al actualizar el estado');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E1E20] border border-[#2D2D2D] w-full max-w-2xl rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-[#2D2D2D] p-6 flex items-center justify-between sticky top-0 bg-[#1E1E20]/95">
          <div>
            <h2 className="text-lg font-semibold text-white">Marcar estado de hallazgo</h2>
            <p className="text-sm text-[#6B7280] mt-1">{riskType}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors text-[#A0A0A0] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* State Selection */}
          <div className="space-y-4">
            <label className="text-sm font-semibold text-white">
              Selecciona el estado actual:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.entries(STATE_CONFIG) as Array<[FindingState, typeof STATE_CONFIG[FindingState]]>).map(
                ([state, config]) => (
                  <button
                    key={state}
                    onClick={() => setSelectedState(state)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedState === state
                        ? `border-[#F97316] ${config.bgColor} ring-2 ring-[#F97316]/30`
                        : 'border-[#2D2D2D] hover:border-[#404040]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <config.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                      <div>
                        <p className="font-medium text-white">{config.label}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{config.description}</p>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white flex items-center gap-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Añade notas sobre este cambio de estado (ej: URL del commit, referencia del ticket, etc.)"
              className="w-full h-24 px-4 py-3 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none resize-none"
            />
          </div>

          {/* State Description */}
          {selectedState && (
            <div className={`p-4 rounded-lg ${STATE_CONFIG[selectedState].bgColor} border border-[#2D2D2D]`}>
              <p className="text-sm text-[#94A3B8]">
                <span className="font-semibold">{STATE_CONFIG[selectedState].label}:</span> {STATE_CONFIG[selectedState].description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#2D2D2D] p-6 flex items-center justify-end gap-3 bg-[#1E1E20]/95 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-[#2D2D2D] text-sm font-medium text-[#A0A0A0] hover:text-white hover:border-[#404040] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA6B1B] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Guardando...' : 'Guardar estado'}
          </button>
        </div>
      </div>
    </div>
  );
}
