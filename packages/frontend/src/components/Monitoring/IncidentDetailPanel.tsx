import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Check, Clock, User, MessageSquare, Zap } from 'lucide-react';
import { apiService } from '../../services/api.service';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { useAsyncOperation } from '../../hooks/useAsyncOperation';
import type { Hallazgo } from '../../types/api';

interface IncidentDetailPanelProps {
  incident: Hallazgo | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

const STATUS_CONFIG = {
  OPEN: { label: 'Abierto', color: 'bg-[#EF4444]', icon: AlertCircle },
  IN_PROGRESS: { label: 'En Curso', color: 'bg-[#F97316]', icon: Zap },
  RESOLVED: { label: 'Resuelto', color: 'bg-[#22C55E]', icon: Check },
  CLOSED: { label: 'Cerrado', color: 'bg-[#6B7280]', icon: X },
};

type StatusKey = keyof typeof STATUS_CONFIG;

export default function IncidentDetailPanel({
  incident,
  isOpen,
  onClose,
  onStatusChange,
}: IncidentDetailPanelProps) {
  const [status, setStatus] = useState<StatusKey>(
    (incident?.status as StatusKey) || 'OPEN'
  );
  const [assignedTo, setAssignedTo] = useState(incident?.assignedTo || '');
  const [notes, setNotes] = useState(incident?.notes || '');
  const [activeTab, setActiveTab] = useState<'status' | 'assignment' | 'timeline'>('status');
  const { confirm } = useConfirm();
  const toast = useToast();

  const saveOperation = useAsyncOperation({
    loadingMessage: 'Guardando cambios...',
    successMessage: 'Cambios guardados exitosamente',
    errorMessage: 'Error al guardar los cambios',
  });

  if (!incident) return null;

  const handleSave = async () => {
    try {
      // If changing to CLOSED, require confirmation
      if (status === 'CLOSED' && incident.status !== 'CLOSED') {
        await confirm({
          title: 'Cerrar Incidente',
          message: '¿Estás seguro de que deseas cerrar este incidente? Esta acción marcará el incidente como completamente resuelto y verificado.',
          confirmText: 'Cerrar',
          cancelText: 'Cancelar',
          isDangerous: true,
          onConfirm: async () => {
            try {
              await apiService.cambiarEstadoHallazgo(incident.id, {
                status,
                notes,
                assignedTo: assignedTo || undefined,
              });
              toast.success('Incidente cerrado correctamente');
              onStatusChange?.();
              onClose();
            } catch (error) {
              console.error('Error cerrando incidente:', error);
              toast.error('Error al cerrar el incidente');
            }
          },
        });
      } else {
        // For other status changes, save directly
        await apiService.cambiarEstadoHallazgo(incident.id, {
          status,
          notes,
          assignedTo: assignedTo || undefined,
        });
        toast.success('Cambios guardados correctamente');
        onStatusChange?.();
        onClose();
      }
    } catch (error) {
      console.error('Error guardando cambios:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[#111111] border-l border-[#2D2D2D] overflow-y-auto z-50"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-[#2D2D2D] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{incident.riskType}</h2>
                <p className="text-xs text-[#6B7280] mt-1">{incident.file}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#1E1E20] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Severity Badge */}
              <div className="flex items-center justify-between p-3 bg-[#1E1E20] rounded-lg border border-[#2D2D2D]">
                <span className="text-sm text-[#6B7280]">Severidad</span>
                <span
                  className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    incident.severity === 'CRITICAL'
                      ? 'bg-[#EF4444]/10 text-[#EF4444]'
                      : incident.severity === 'HIGH'
                        ? 'bg-[#F97316]/10 text-[#F97316]'
                        : 'bg-[#EAB308]/10 text-[#EAB308]'
                  }`}
                >
                  {incident.severity}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-[#2D2D2D]">
                {[
                  { id: 'status' as const, label: '📊 Estado' },
                  { id: 'assignment' as const, label: '👤 Asignación' },
                  { id: 'timeline' as const, label: '📝 Seguimiento' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-[#F97316] text-[#F97316]'
                        : 'border-transparent text-[#6B7280] hover:text-[#A0A0A0]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Status Tab */}
              {activeTab === 'status' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-[#6B7280] uppercase block mb-3">
                      Cambiar Estado
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <button
                            key={key}
                            onClick={() => setStatus(key as StatusKey)}
                            className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 text-sm font-semibold ${
                              status === key
                                ? `${config.color} border-current text-white`
                                : 'bg-[#1E1E20] border-[#2D2D2D] text-[#6B7280] hover:border-[#404040]'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description of current status */}
                  <div className="p-3 bg-[#1E1E20] rounded-lg border border-[#2D2D2D]">
                    <p className="text-xs text-[#6B7280] mb-2">Estado Actual</p>
                    <p className="text-sm text-white">
                      {status === 'OPEN' && 'Incidente abierto, requiere atención inmediata'}
                      {status === 'IN_PROGRESS' && 'Se están tomando medidas correctivas'}
                      {status === 'RESOLVED' && 'Problema solucionado, pendiente de verificación'}
                      {status === 'CLOSED' && 'Incidente cerrado y verificado'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Assignment Tab */}
              {activeTab === 'assignment' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-[#6B7280] uppercase block mb-2">
                      Asignar A
                    </label>
                    <input
                      type="text"
                      placeholder="Email o nombre..."
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
                    />
                  </div>

                  {assignedTo && (
                    <div className="p-3 bg-[#1E1E20] rounded-lg border border-[#2D2D2D] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#F97316]" />
                      <div>
                        <p className="text-xs text-[#6B7280]">Asignado a</p>
                        <p className="text-sm text-white font-semibold">{assignedTo}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-[#6B7280]">
                    Se enviará una notificación a la persona asignada
                  </p>
                </motion.div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-[#6B7280] uppercase block mb-2">
                      Notas y Seguimiento
                    </label>
                    <textarea
                      placeholder="Agregar notas sobre el progreso, acciones tomadas, próximos pasos..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm resize-none h-24"
                    />
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button className="flex items-center gap-2 p-2 bg-[#1E1E20] rounded-lg border border-[#2D2D2D] text-xs text-[#6B7280] hover:border-[#404040] transition-all">
                      <MessageSquare className="w-4 h-4" />
                      Comentar
                    </button>
                    <button className="flex items-center gap-2 p-2 bg-[#1E1E20] rounded-lg border border-[#2D2D2D] text-xs text-[#6B7280] hover:border-[#404040] transition-all">
                      <Clock className="w-4 h-4" />
                      Historial
                    </button>
                  </div>

                  {/* Context info */}
                  <div className="p-3 bg-[#1E1E20] rounded-lg border border-[#2D2D2D] space-y-2">
                    <div>
                      <p className="text-xs text-[#6B7280]">Detectado el</p>
                      <p className="text-sm text-white">
                        {new Date(incident.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {incident.updatedAt && (
                      <div>
                        <p className="text-xs text-[#6B7280]">Última actualización</p>
                        <p className="text-sm text-white">
                          {new Date(incident.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Remediación Info */}
              {incident.remediationSteps && incident.remediationSteps.length > 0 && (
                <div className="border-t border-[#2D2D2D] pt-6">
                  <h3 className="text-sm font-semibold text-white mb-3">Pasos de Remediación</h3>
                  <div className="space-y-2">
                    {incident.remediationSteps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 text-xs">
                        <span className="text-[#F97316] font-bold">{idx + 1}.</span>
                        <span className="text-[#94A3B8]">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Save Button */}
            <div className="sticky bottom-0 bg-[#111111] border-t border-[#2D2D2D] p-6 space-y-2">
              <button
                onClick={handleSave}
                disabled={saveOperation.isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#F97316] hover:bg-[#EA8F1B] disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {saveOperation.isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 bg-[#1E1E20] hover:bg-[#242424] text-[#6B7280] font-semibold rounded-lg transition-colors border border-[#2D2D2D]"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
