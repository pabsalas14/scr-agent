import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Save, X, Bell, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { apiService } from '../services/api.service';
import { useToast } from '../hooks/useToast';

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  severityThreshold: string;
  findingCountMin: number;
  findingCountMax?: number;
  riskTypeFilter?: string;
  filePatternFilter?: string;
  notificationChannel: string;
  webhookUrl?: string;
  enabled: boolean;
  triggeredCount: number;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

const SEVERITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const CHANNEL_OPTIONS = ['webhook', 'email', 'slack', 'in_app'];

export default function AlertRulesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<AlertRule>>({
    name: '',
    description: '',
    severityThreshold: 'HIGH',
    findingCountMin: 1,
    notificationChannel: 'in_app',
    enabled: true,
  });
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  // Fetch alert rules
  const { data: rulesResponse, isLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: async () => {
      const res = await apiService.get('/alert-rules');
      return res.data?.data || [];
    },
  });

  const rules = (rulesResponse || []) as AlertRule[];

  // Create/Update mutation
  const saveRuleMutation = useMutation({
    mutationFn: async (data: Partial<AlertRule>) => {
      if (editingRule) {
        return await apiService.put(`/alert-rules/${editingRule.id}`, data);
      } else {
        return await apiService.post('/alert-rules', data);
      }
    },
    onSuccess: () => {
      toast.success(editingRule ? 'Regla actualizada' : 'Regla creada');
      setEditingRule(null);
      setShowForm(false);
      setFormData({
        name: '',
        description: '',
        severityThreshold: 'HIGH',
        findingCountMin: 1,
        notificationChannel: 'in_app',
        enabled: true,
      });
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al guardar regla');
    },
  });

  // Delete mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      return await apiService.delete(`/alert-rules/${ruleId}`);
    },
    onSuccess: () => {
      toast.success('Regla eliminada');
      setDeletingRuleId(null);
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al eliminar regla');
    },
  });

  const handleEditStart = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingRule(null);
    setShowForm(false);
    setFormData({
      name: '',
      description: '',
      severityThreshold: 'HIGH',
      findingCountMin: 1,
      notificationChannel: 'in_app',
      enabled: true,
    });
  };

  const handleSave = () => {
    if (!formData.name || !formData.severityThreshold || !formData.notificationChannel) {
      toast.error('Completa los campos requeridos');
      return;
    }
    saveRuleMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Reglas de Alertas</h1>
        <p className="text-sm text-[#A0A0A0]">
          Crea reglas automáticas que disparen alertas cuando se cumplen ciertas condiciones
        </p>
      </div>

      {/* Create Button */}
      {!showForm && (
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingRule(null);
            setFormData({
              name: '',
              description: '',
              severityThreshold: 'HIGH',
              findingCountMin: 1,
              notificationChannel: 'in_app',
              enabled: true,
            });
          }}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Regla
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4 animate-in fade-in">
          <h3 className="text-lg font-semibold text-white">
            {editingRule ? 'Editar Regla' : 'Nueva Regla de Alerta'}
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-2 font-medium">Nombre*</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Hallazgos críticos en producción"
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                Severidad Mínima*
              </label>
              <select
                value={formData.severityThreshold || ''}
                onChange={(e) =>
                  setFormData({ ...formData, severityThreshold: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {SEVERITY_OPTIONS.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#6B7280] mb-2 font-medium">Descripción</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe cuándo esta regla debería dispararse..."
              className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-none h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                Cantidad Mínima de Hallazgos
              </label>
              <input
                type="number"
                min="1"
                value={formData.findingCountMin || 1}
                onChange={(e) =>
                  setFormData({ ...formData, findingCountMin: parseInt(e.target.value) })
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                Cantidad Máxima (opcional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.findingCountMax || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    findingCountMax: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Sin límite si está vacío"
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-2 font-medium">Canal*</label>
              <select
                value={formData.notificationChannel || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notificationChannel: e.target.value })
                }
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                {CHANNEL_OPTIONS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch === 'in_app' ? 'Dentro de la app' : ch.charAt(0).toUpperCase() + ch.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {formData.notificationChannel === 'webhook' && (
              <div>
                <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                  URL del Webhook
                </label>
                <input
                  type="url"
                  value={formData.webhookUrl || ''}
                  onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saveRuleMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saveRuleMutation.isPending
                ? 'Guardando...'
                : editingRule
                  ? 'Actualizar'
                  : 'Crear Regla'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="secondary"
              className="flex-1"
              disabled={saveRuleMutation.isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
          <Bell size={32} className="text-[#666666] mx-auto mb-3" />
          <p className="text-[#A0A0A0]">No hay reglas de alertas configuradas</p>
          <p className="text-xs text-[#666666] mt-2">
            Crea una regla para recibir notificaciones automáticas
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#4B5563] transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        rule.enabled ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                    <h3 className="font-semibold text-white">{rule.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        rule.severityThreshold === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-300'
                          : rule.severityThreshold === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-300'
                            : rule.severityThreshold === 'MEDIUM'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {rule.severityThreshold}+
                    </span>
                  </div>

                  {rule.description && (
                    <p className="text-sm text-[#A0A0A0] mb-2">{rule.description}</p>
                  )}

                  <div className="text-xs text-[#666666] space-y-1">
                    <p>
                      📊 Mínimo de hallazgos:{' '}
                      <span className="text-white font-semibold">{rule.findingCountMin}</span>
                      {rule.findingCountMax && (
                        <>
                          {' '}
                          - Máximo:{' '}
                          <span className="text-white font-semibold">{rule.findingCountMax}</span>
                        </>
                      )}
                    </p>
                    <p>
                      📢 Canal:{' '}
                      <span className="text-white font-semibold capitalize">
                        {rule.notificationChannel === 'in_app' ? 'App' : rule.notificationChannel}
                      </span>
                    </p>
                    {rule.triggeredCount > 0 && (
                      <p>
                        ✅ Disparos: <span className="text-white font-semibold">{rule.triggeredCount}</span>
                        {rule.lastTriggeredAt && (
                          <>
                            {' '}
                            - Último:{' '}
                            <span className="text-white">
                              {new Date(rule.lastTriggeredAt).toLocaleDateString('es-ES')}
                            </span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditStart(rule)}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeletingRuleId(rule.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation */}
              {deletingRuleId === rule.id && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-300 mb-3">
                    ¿Estás seguro de que deseas eliminar esta regla?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      {deleteRuleMutation.isPending ? 'Eliminando...' : 'Confirmar'}
                    </Button>
                    <Button
                      onClick={() => setDeletingRuleId(null)}
                      variant="secondary"
                      className="flex-1"
                      disabled={deleteRuleMutation.isPending}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Nota:</strong> Las reglas de alertas se disparan automáticamente cuando se
          detectan nuevos hallazgos que coinciden con las condiciones especificadas. Las
          notificaciones se envían según el canal configurado.
        </p>
      </div>
    </div>
  );
}
