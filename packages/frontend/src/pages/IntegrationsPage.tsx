import { useState } from 'react';
import { GitBranch, Key, Eye, EyeOff, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import { useToast } from '../hooks/useToast';

const INTEGRATIONS = [
  {
    name: 'GitHub',
    icon: GitBranch,
    description: 'Integra repositorios de GitHub para análisis automatizado',
    status: 'connected',
    color: 'text-gray-400',
  },
];

const LLM_PROVIDERS = ['Claude', 'OpenAI', 'Google'];

export default function IntegrationsPage() {
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; provider: string; key: string }>>([]);
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);
  const [newApiKeyProvider, setNewApiKeyProvider] = useState('Claude');
  const [newApiKey, setNewApiKey] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const toast = useToast();

  const handleConfigure = (integrationName: string) => {
    setConfiguring(integrationName);
    toast.info(`Configurando ${integrationName}... Esta funcionalidad será añadida en la siguiente versión.`);
    setTimeout(() => setConfiguring(null), 2000);
  };

  const handleConnect = (integrationName: string) => {
    toast.info(`Conectando ${integrationName}... Redirigiendo a página de autorización...`);
  };

  const addAPIKey = () => {
    if (!newApiKey.trim()) {
      toast.error('Por favor ingresa una clave API');
      return;
    }

    const newKey = {
      id: Date.now().toString(),
      provider: newApiKeyProvider,
      key: newApiKey,
    };

    setApiKeys([...apiKeys, newKey]);
    setNewApiKey('');
    setShowNewApiKeyForm(false);
    toast.success(`Clave API de ${newApiKeyProvider} agregada correctamente`);
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const deleteAPIKey = (keyId: string) => {
    setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    toast.info('Clave API eliminada');
  };

  const maskKey = (key: string) => {
    if (key.length <= 11) return key;
    return `${key.substring(0, 7)}${'*'.repeat(key.length - 11)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Integraciones</h1>
        <p className="text-sm text-[#A0A0A0]">
          Conecta con tus herramientas favoritas para automatizar flujos de trabajo
        </p>
      </div>

      {/* Herramientas Externas */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Herramientas Externas</h2>
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
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={configuring === integration.name}
                    onClick={() => {
                      if (integration.status === 'connected') {
                        handleConfigure(integration.name);
                      } else {
                        handleConnect(integration.name);
                      }
                    }}
                  >
                    {configuring === integration.name ? 'Cargando...' : (integration.status === 'connected' ? 'Configurar' : 'Conectar')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claves API para LLM */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Key size={20} />
              Claves API de LLM
            </h2>
            <p className="text-xs text-[#A0A0A0] mt-1">Configura tus claves de API para usar modelos de lenguaje</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewApiKeyForm(true)}
          >
            Agregar Clave
          </Button>
        </div>

        {showNewApiKeyForm && (
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-[#A0A0A0]">Proveedor</label>
              <select
                value={newApiKeyProvider}
                onChange={(e) => setNewApiKeyProvider(e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white focus:outline-none focus:border-[#4B5563]"
              >
                {LLM_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[#A0A0A0]">Clave API</label>
              <input
                type="password"
                placeholder="Pega tu clave API aquí"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] border border-[#2D2D2D] rounded text-white placeholder-[#4B5563] focus:outline-none focus:border-[#4B5563]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowNewApiKeyForm(false);
                  setNewApiKey('');
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={addAPIKey}
              >
                Guardar
              </Button>
            </div>
          </div>
        )}

        {apiKeys.length === 0 && !showNewApiKeyForm && (
          <div className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-4 text-center">
            <p className="text-sm text-[#A0A0A0]">No hay claves API configuradas aún</p>
          </div>
        )}

        {apiKeys.length > 0 && (
          <div className="space-y-2">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-[#2D2D2D] p-2 rounded">
                    <Key size={16} className="text-[#A0A0A0]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{apiKey.provider}</p>
                    <p className="text-xs text-[#6B7280] font-mono truncate">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleKeyVisibility(apiKey.id)}
                    className="text-[#A0A0A0] hover:text-white transition-colors"
                    title={visibleKeys.has(apiKey.id) ? 'Ocultar' : 'Mostrar'}
                  >
                    {visibleKeys.has(apiKey.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => deleteAPIKey(apiKey.id)}
                    className="text-[#A0A0A0] hover:text-red-500 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
