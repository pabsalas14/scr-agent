import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bell, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

export interface AlertRule {
  id: string;
  name: string;
  severity: string[];
  threshold: number;
  notificationChannels: string[];
  isActive: boolean;
}

interface AlertRuleBuilderProps {
  rules?: AlertRule[];
  onAddRule?: (rule: AlertRule) => Promise<void>;
  onDeleteRule?: (id: string) => Promise<void>;
  onToggleRule?: (id: string, active: boolean) => Promise<void>;
}

const severityOptions = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
const channelOptions = ['Email', 'Slack', 'Teams', 'PagerDuty', 'Webhook'];

export default function AlertRuleBuilder({
  rules = [],
  onAddRule,
  onDeleteRule,
  onToggleRule,
}: AlertRuleBuilderProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    severity: [],
    notificationChannels: [],
    threshold: 3,
  });
  const toast = useToast();

  const handleAddRule = async () => {
    if (!newRule.name?.trim()) {
      toast.error('Nombre de regla requerido');
      return;
    }
    if (newRule.severity?.length === 0) {
      toast.error('Selecciona al menos una severidad');
      return;
    }
    if (newRule.notificationChannels?.length === 0) {
      toast.error('Selecciona al menos un canal de notificación');
      return;
    }

    const rule: AlertRule = {
      id: Date.now().toString(),
      name: newRule.name,
      severity: newRule.severity || [],
      threshold: newRule.threshold || 3,
      notificationChannels: newRule.notificationChannels || [],
      isActive: true,
    };

    try {
      await onAddRule?.(rule);
      setNewRule({ severity: [], notificationChannels: [], threshold: 3 });
      setIsAdding(false);
      toast.success('Regla de alerta creada');
    } catch (error) {
      toast.error('Error al crear regla');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Rule Form */}
      <AnimatePresence>
        {isAdding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-lg bg-[#242424] border border-[#2D2D2D] space-y-4"
          >
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Nombre de la Regla
              </label>
              <input
                type="text"
                value={newRule.name || ''}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Ej: Alertas de críticos"
                className="w-full px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-3 block">
                Severidades
              </label>
              <div className="grid grid-cols-2 gap-2">
                {severityOptions.map((severity) => (
                  <button
                    key={severity}
                    onClick={() => {
                      const severities = newRule.severity || [];
                      const updated = severities.includes(severity)
                        ? severities.filter((s) => s !== severity)
                        : [...severities, severity];
                      setNewRule({ ...newRule, severity: updated });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newRule.severity?.includes(severity)
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#1E1E20] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
                    }`}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                Umbral (número de hallazgos para alertar)
              </label>
              <input
                type="number"
                min="1"
                value={newRule.threshold || 3}
                onChange={(e) => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white focus:border-[#F97316] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-3 block">
                Canales de Notificación
              </label>
              <div className="grid grid-cols-2 gap-2">
                {channelOptions.map((channel) => (
                  <button
                    key={channel}
                    onClick={() => {
                      const channels = newRule.notificationChannels || [];
                      const updated = channels.includes(channel)
                        ? channels.filter((c) => c !== channel)
                        : [...channels, channel];
                      setNewRule({ ...newRule, notificationChannels: updated });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newRule.notificationChannels?.includes(channel)
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#1E1E20] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
                    }`}
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddRule}
                className="flex-1 px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors font-medium text-sm"
              >
                Crear Regla
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewRule({ severity: [], notificationChannels: [], threshold: 3 });
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-[#A0A0A0] hover:border-[#404040] transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full px-4 py-3 rounded-lg bg-[#1E1E20] border border-dashed border-[#2D2D2D] hover:border-[#F97316] transition-colors flex items-center justify-center gap-2 text-sm font-medium text-[#A0A0A0] hover:text-white"
          >
            <Plus className="w-4 h-4" />
            Nueva Regla de Alerta
          </button>
        )}
      </AnimatePresence>

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Reglas Activas ({rules.filter((r) => r.isActive).length}/{rules.length})
          </p>
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-all ${
                rule.isActive ? 'bg-[#242424] border-[#2D2D2D]' : 'bg-[#1E1E20] border-[#2D2D2D] opacity-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#F97316]" />
                    {rule.name}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Umbral: {rule.threshold} hallazgos
                  </p>
                </div>
                <button
                  onClick={() => onDeleteRule?.(rule.id)}
                  className="p-2 rounded-lg hover:bg-[#EF4444]/20 transition-colors text-[#6B7280] hover:text-[#EF4444]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {rule.severity.map((s) => (
                  <span key={s} className="px-2 py-1 rounded text-xs bg-[#F97316]/10 text-[#F97316]">
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {rule.notificationChannels.map((c) => (
                  <span key={c} className="px-2 py-1 rounded text-xs bg-[#6366F1]/10 text-[#6366F1]">
                    {c}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="p-8 text-center rounded-lg border border-dashed border-[#2D2D2D]">
            <AlertCircle className="w-8 h-8 text-[#6B7280] mx-auto mb-2 opacity-50" />
            <p className="text-sm text-[#6B7280]">Sin reglas de alerta configuradas</p>
          </div>
        )
      )}
    </div>
  );
}
