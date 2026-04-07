import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';

type FindingState = 'FP' | 'ATENDIDO' | 'EN_CURSO' | 'EN_ANALISIS';

interface FindingStatePanelProps {
  hallazgoId: string;
  currentState?: FindingState;
  riskType: string;
  onClose: () => void;
  onStateChange?: (newState: FindingState) => void;
}

const STATE_CONFIG: Record<FindingState, { label: string; icon: React.ElementType; color: string; bgColor: string; description: string }> = {
  'FP': {
    label: 'Falso Positivo',
    icon: AlertCircle,
    color: 'text-[#6B7280]',
    bgColor: 'bg-[#6B7280]/10',
    description: 'Este hallazgo fue identificado incorrectamente y no representa una vulnerabilidad real.',
  },
  'ATENDIDO': {
    label: 'Atendido',
    icon: CheckCircle2,
    color: 'text-[#22C55E]',
    bgColor: 'bg-[#22C55E]/10',
    description: 'La vulnerabilidad ha sido corregida o mitigada con éxito.',
  },
  'EN_CURSO': {
    label: 'En Curso',
    icon: Zap,
    color: 'text-[#F97316]',
    bgColor: 'bg-[#F97316]/10',
    description: 'Se están implementando cambios para remediar esta vulnerabilidad.',
  },
  'EN_ANALISIS': {
    label: 'En Análisis',
    icon: Clock,
    color: 'text-[#EAB308]',
    bgColor: 'bg-[#EAB308]/10',
    description: 'Se está evaluando el impacto y la mejor forma de remediar.',
  },
};

export default function FindingStatePanel({ hallazgoId, currentState, riskType, onClose, onStateChange }: FindingStatePanelProps) {
  const [selectedState, setSelectedState] = useState<FindingState>(currentState || 'EN_ANALISIS');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
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
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="bg-[#1E1E20] border-t border-[#2D2D2D] w-full max-w-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom">
        {/* Header */}
        <div className="border-b border-[#2D2D2D] p-6 flex items-center justify-between">
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
        <div className="border-t border-[#2D2D2D] p-6 flex items-center justify-end gap-3 bg-[#242424]/50">
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
