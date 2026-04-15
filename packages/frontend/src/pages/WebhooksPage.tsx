import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api.service';
import Button from '../components/ui/Button';

export default function WebhooksPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const { confirm } = useConfirm();
  const toast = useToast();

  const { data: webhooks = [], isLoading, refetch } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => apiService.get('/webhooks').then(res => res.data || []),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Webhooks</h1>
          <p className="text-sm text-[#A0A0A0]">
            Recibe notificaciones en tiempo real en tus sistemas
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus size={18} className="mr-2" />
          Nuevo Webhook
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-white">Crear Nuevo Webhook</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">URL del Webhook</label>
              <input
                type="url"
                placeholder="https://api.example.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Eventos</label>
              <div className="space-y-2">
                {['finding.created', 'finding.updated', 'finding.verified', 'incident.created'].map((event) => (
                  <label key={event} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selectedEvents.includes(event)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event]);
                        } else {
                          setSelectedEvents(selectedEvents.filter(e => e !== event));
                        }
                      }}
                    />
                    <span className="text-sm text-[#A0A0A0]">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (!webhookUrl) {
                    toast.error('URL es requerida');
                    return;
                  }
                  try {
                    await apiService.post('/webhooks', {
                      url: webhookUrl,
                      events: selectedEvents,
                    });
                    toast.success('Webhook creado correctamente');
                    setWebhookUrl('');
                    setSelectedEvents([]);
                    setShowCreateForm(false);
                    refetch();
                  } catch (error) {
                    toast.error('Error creando webhook');
                  }
                }}
              >
                Crear
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {webhooks.map((webhook: any) => (
              <div
                key={webhook.id}
                className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-[#111111] px-2 py-1 rounded text-[#A0A0A0]">
                        {webhook.url}
                      </code>
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          webhook.status === 'active'
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}
                      >
                        {webhook.status === 'active' ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}
                        {webhook.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-[#666666]">
                      Eventos: {webhook.events?.join(', ') || 'N/A'}
                    </div>
                    <div className="mt-1 text-xs text-[#666666]">
                      Última entrega: {webhook.lastDelivery ? new Date(webhook.lastDelivery).toLocaleString('es-ES') : 'N/A'}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await confirm({
                        title: 'Eliminar Webhook',
                        message: `¿Estás seguro de que deseas eliminar este webhook? Esta acción no se puede deshacer.`,
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        isDangerous: true,
                        onConfirm: async () => {
                          try {
                            await apiService.delete(`/webhooks/${webhook.id}`);
                            toast.success('Webhook eliminado correctamente');
                            refetch();
                          } catch (error) {
                            toast.error('Error eliminando webhook');
                          }
                        },
                      });
                    }}
                    className="p-2 hover:bg-[#2D2D2D] rounded text-[#A0A0A0] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {webhooks.length === 0 && !showCreateForm && (
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
              <p className="text-[#A0A0A0]">No hay webhooks configurados</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => setShowCreateForm(true)}
              >
                Crear el primero
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
