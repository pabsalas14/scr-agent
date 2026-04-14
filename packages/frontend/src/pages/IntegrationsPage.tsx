import { ExternalLink, Github, Zap, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';

const INTEGRATIONS = [
  {
    name: 'GitHub',
    icon: Github,
    description: 'Integra repositorios de GitHub para análisis automatizado',
    status: 'connected',
    color: 'text-gray-400',
  },
  {
    name: 'Jira',
    icon: ExternalLink,
    description: 'Crea tickets automáticamente en Jira desde hallazgos',
    status: 'not_connected',
    color: 'text-blue-400',
  },
  {
    name: 'Slack',
    icon: MessageSquare,
    description: 'Recibe notificaciones en Slack para hallazgos críticos',
    status: 'not_connected',
    color: 'text-purple-400',
  },
  {
    name: 'Webhooks',
    icon: Zap,
    description: 'Integración personalizada mediante webhooks',
    status: 'not_connected',
    color: 'text-yellow-400',
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Integraciones</h1>
        <p className="text-sm text-[#A0A0A0]">
          Conecta con tus herramientas favoritas para automatizar flujos de trabajo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((integration) => {
          const Icon = integration.icon;
          return (
            <div
              key={integration.name}
              className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 hover:border-[#4B5563] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon className={`${integration.color}`} size={24} />
                  <div>
                    <h3 className="font-semibold text-white">{integration.name}</h3>
                    <p className="text-xs text-[#A0A0A0]">{integration.description}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    integration.status === 'connected'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
                </span>
                <Button variant="secondary" size="sm">
                  {integration.status === 'connected' ? 'Configurar' : 'Conectar'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-400">
          💡 ¿No encuentras la integración que necesitas? Puedes crear webhooks personalizados para
          cualquier servicio.
        </p>
      </div>
    </div>
  );
}
