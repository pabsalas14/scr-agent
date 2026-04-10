import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, TestTube, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  lastDelivery?: Date;
  deliveryStatus?: 'success' | 'failed' | 'pending';
}

interface WebhookManagerProps {
  webhooks?: Webhook[];
  onAdd?: (webhook: Webhook) => void;
  onDelete?: (id: string) => void;
  onTest?: (id: string) => void;
}

const eventOptions = [
  'analysis.started',
  'analysis.completed',
  'finding.created',
  'finding.resolved',
  'incident.assigned',
  'remediation.verified',
];

export default function WebhookManager({
  webhooks = [],
  onAdd,
  onDelete,
  onTest,
}: WebhookManagerProps) {
  const [isAddingWebhook, setIsAddingWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: [] as string[] });
  const [testingId, setTestingId] = useState<string | null>(null);
  const toast = useToast();

  const handleAddWebhook = () => {
    if (!newWebhook.url.trim()) {
      toast.error('URL del webhook es requerida');
      return;
    }
    if (newWebhook.events.length === 0) {
      toast.error('Selecciona al menos un evento');
      return;
    }

    const webhook: Webhook = {
      id: Date.now().toString(),
      url: newWebhook.url,
      events: newWebhook.events,
      isActive: true,
      createdAt: new Date(),
    };

    onAdd?.(webhook);
    setNewWebhook({ url: '', events: [] });
    setIsAddingWebhook(false);
    toast.success('Webhook agregado correctamente');
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTest?.(id);
      toast.success('Webhook probado exitosamente');
    } catch (error) {
      toast.error('Error al probar webhook');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (id: string) => {
    onDelete?.(id);
    toast.success('Webhook eliminado');
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada al portapapeles');
  };

  return (
    <div className="space-y-6">
      {/* Add Webhook Form */}
      <AnimatePresence>
        {isAddingWebhook ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-6 rounded-lg bg-[#242424] border border-[#2D2D2D] space-y-4"
          >
            <div>
              <label className="text-sm font-semibold text-white mb-2 block">
                URL del Webhook
              </label>
              <input
                type="url"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                placeholder="https://example.com/webhook"
                className="w-full px-4 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-white mb-3 block">
                Eventos a Suscribirse
              </label>
              <div className="grid grid-cols-2 gap-2">
                {eventOptions.map((event) => (
                  <button
                    key={event}
                    onClick={() => {
                      const events = newWebhook.events.includes(event)
                        ? newWebhook.events.filter((e) => e !== event)
                        : [...newWebhook.events, event];
                      setNewWebhook({ ...newWebhook, events });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newWebhook.events.includes(event)
                        ? 'bg-[#F97316] text-white'
                        : 'bg-[#1E1E20] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
                    }`}
                  >
                    {event.split('.')[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddWebhook}
                className="flex-1 px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors font-medium text-sm"
              >
                Agregar Webhook
              </button>
              <button
                onClick={() => setIsAddingWebhook(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-[#A0A0A0] hover:border-[#404040] transition-colors font-medium text-sm"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsAddingWebhook(true)}
            className="w-full px-4 py-3 rounded-lg bg-[#1E1E20] border border-dashed border-[#2D2D2D] hover:border-[#F97316] transition-colors flex items-center justify-center gap-2 text-sm font-medium text-[#A0A0A0] hover:text-white"
          >
            <Plus className="w-4 h-4" />
            Agregar Nuevo Webhook
          </button>
        )}
      </AnimatePresence>

      {/* Webhooks List */}
      {webhooks.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Webhooks Configurados ({webhooks.length})
          </p>
          {webhooks.map((webhook) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] hover:border-[#404040] transition-colors"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {webhook.deliveryStatus === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
                      ) : webhook.deliveryStatus === 'failed' ? (
                        <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                      ) : null}
                      <p className="text-sm font-mono text-white truncate">{webhook.url}</p>
                    </div>
                    <p className="text-xs text-[#6B7280]">
                      Creado hace{' '}
                      {Math.floor((Date.now() - webhook.createdAt.getTime()) / 1000 / 60)} minutos
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopyUrl(webhook.url)}
                      className="p-2 rounded-lg hover:bg-[#2D2D2D] transition-colors text-[#6B7280] hover:text-white"
                      title="Copiar URL"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleTest(webhook.id)}
                      disabled={testingId === webhook.id}
                      className="p-2 rounded-lg hover:bg-[#2D2D2D] transition-colors text-[#6B7280] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Probar webhook"
                    >
                      <TestTube className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      className="p-2 rounded-lg hover:bg-[#EF4444]/20 transition-colors text-[#6B7280] hover:text-[#EF4444]"
                      title="Eliminar webhook"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Events Tags */}
                <div className="flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <span
                      key={event}
                      className="px-2 py-1 rounded text-xs bg-[#1E1E20] text-[#6B7280] border border-[#2D2D2D]"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        !isAddingWebhook && (
          <div className="p-8 text-center rounded-lg border border-dashed border-[#2D2D2D]">
            <p className="text-sm text-[#6B7280]">Sin webhooks configurados</p>
          </div>
        )
      )}

      {/* Documentation */}
      <div className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] space-y-3">
        <p className="text-sm font-semibold text-white">📚 Documentación de Webhooks</p>
        <p className="text-xs text-[#6B7280]">
          Los webhooks se envían como POST requests con un payload JSON. Incluyen un header{' '}
          <code className="bg-[#242424] px-1 rounded text-[#F97316]">X-Signature</code> con HMAC-SHA256 para
          verificar autenticidad.
        </p>
        <p className="text-xs text-[#6B7280] font-mono bg-[#242424] p-2 rounded">
          {JSON.stringify(
            {
              event: 'finding.created',
              timestamp: '2024-04-10T20:45:00Z',
              data: { findingId: '123', severity: 'CRITICAL' },
            },
            null,
            2
          )}
        </p>
      </div>
    </div>
  );
}
