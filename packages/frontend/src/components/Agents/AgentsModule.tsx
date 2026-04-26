/**
 * AgentsModule Component - Modern Horizontal Agent Management
 * Compact card-based layout with inline editing and real-time configuration
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Pencil, RotateCcw, Play, AlertCircle, CheckCircle, Clock, Zap, Gauge, Save, X, Clock3 } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Agent {
  name: string;
  status: 'running' | 'idle' | 'error';
  model: string;
  avgResponseTime: number;
  processingSpeed: number;
  lastActivity: string;
}

interface ConfigChange {
  timestamp: string;
  type: 'model' | 'prompt';
  oldValue: string;
  newValue: string;
}

const AGENT_PROMPTS: Record<string, string> = {
  'Inspector Principal': 'Especializado en detectar vulnerabilidades, malware y patrones sospechosos en código fuente.',
  'Detective Forense': 'Investigador forense que construye timelines Git para rastrear cómo y cuándo se introdujeron problemas.',
  'Fiscal Análisis': 'Auditor senior que sintetiza hallazgos en reportes ejecutivos con recomendaciones de remediación.'
};

const MODELS = [
  { label: '⭐ Claude Sonnet 4.6 - Equilibrio', value: 'claude-sonnet-4-6' },
  { label: '🚀 Claude Opus 4.7 - Máxima potencia', value: 'claude-opus-4-7' },
  { label: '⚡ Claude Haiku 4.5 - Rápido', value: 'claude-haiku-4-5-20251001' },
  { label: '💻 Qwen 2.5 Coder (7B)', value: 'qwen2.5-coder-7b-instruct' },
  { label: '🎯 Mistral 7B', value: 'mistral-7b' },
  { label: '🦙 Llama 2 (13B)', value: 'llama2-13b' }
];

// Modern CSS animations
const styles = `
  @keyframes pulse-glow {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }

  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  .animate-slide-up {
    animation: slide-up 0.5s ease-out;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .agent-card-horizontal {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.95) 100%);
  }

  .agent-card-horizontal:hover {
    transform: translateY(-6px);
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 0 20px 40px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .edit-field {
    background: linear-gradient(135deg, rgba(15, 15, 15, 0.8) 0%, rgba(20, 20, 20, 0.6) 100%);
    border: 1px solid rgba(45, 45, 45, 0.5);
    transition: all 0.3s ease;
  }

  .edit-field:hover {
    border-color: rgba(59, 130, 246, 0.4);
    background: linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(25, 25, 25, 0.7) 100%);
  }

  .edit-field:focus {
    border-color: rgba(59, 130, 246, 0.8);
    outline: none;
  }

  .metric-badge {
    background: linear-gradient(135deg, rgba(15, 15, 15, 0.8) 0%, rgba(20, 20, 20, 0.6) 100%);
    border: 1px solid rgba(45, 45, 45, 0.5);
    transition: all 0.3s ease;
  }

  .metric-badge:hover {
    border-color: rgba(59, 130, 246, 0.4);
  }

  .status-indicator {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .status-dot::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px solid currentColor;
    opacity: 0.3;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.3); opacity: 0; }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function AgentsModule() {
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [changeLog, setChangeLog] = useState<Record<string, ConfigChange[]>>({});

  // Fetch agents with real-time updates and their configurations
  const { data: agents, isLoading, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const response = await apiService.get('/monitoring/agents');
        let agentsList = response.data?.data || [];

        // Load configuration for each agent to get the latest model
        agentsList = await Promise.all(
          agentsList.map(async (agent: any) => {
            try {
              const backendName = agentNameMap[agent.name] || agent.name.toLowerCase();
              const configResponse = await apiService.get(`/agents/${backendName}/prompt`);
              const config = configResponse.data?.data;
              return {
                ...agent,
                model: config?.model || agent.model || ''
              };
            } catch (error) {
              return agent;
            }
          })
        );

        return agentsList;
      } catch (error) {
        console.error('Error fetching agents:', error);
        return [];
      }
    },
    refetchInterval: 5000,
  });

  // Name mapping - moved outside to use in the query
  const agentNameMap: Record<string, string> = {
    'Inspector Principal': 'inspector',
    'Detective Forense': 'detective',
    'Fiscal Análisis': 'fiscal',
  };

  const getBackendAgentName = (displayName: string) => {
    return agentNameMap[displayName] || displayName.toLowerCase();
  };

  const handleEditStart = async (agentName: string) => {
    const agent = agents?.find((a: any) => a.name === agentName);
    if (agent) {
      setEditingAgent(agentName);
      const backendAgentName = getBackendAgentName(agentName);

      try {
        const response = await apiService.get(`/agents/${backendAgentName}/prompt`);
        const agentConfig = response.data?.data;

        setEditFormData({
          [agentName]: {
            model: agentConfig?.model || agent.model || '',
            prompt: agentConfig?.prompt || AGENT_PROMPTS[agentName] || '',
          }
        });
      } catch (error) {
        console.error('Error fetching agent configuration:', error);
        setEditFormData({
          [agentName]: {
            model: agent.model || '',
            prompt: AGENT_PROMPTS[agentName] || '',
          }
        });
      }
    }
  };

  const handleSaveConfiguration = async (agentName: string) => {
    const formData = editFormData[agentName];
    if (!formData) return;

    setIsSaving(true);
    try {
      if (!formData.prompt || formData.prompt.trim().length === 0) {
        alert('El prompt no puede estar vacío');
        setIsSaving(false);
        return;
      }

      const backendAgentName = getBackendAgentName(agentName);
      const response = await apiService.patch(`/agents/${backendAgentName}`, {
        model: formData.model,
        prompt: formData.prompt,
      });

      if (response.data?.success) {
        const agent = agents?.find((a: any) => a.name === agentName);
        const now = new Date().toLocaleString('es-MX');

        const newChange: ConfigChange = {
          timestamp: now,
          type: 'model',
          oldValue: agent?.model || 'Desconocido',
          newValue: formData.model,
        };

        setChangeLog(prev => ({
          ...prev,
          [agentName]: [...(prev[agentName] || []), newChange],
        }));

        alert(`✓ Configuración guardada para ${agentName}`);
        setEditingAgent(null);
        setEditFormData({});
        refetch();
      }
    } catch (error) {
      console.error('Error saving agent configuration:', error);
      alert(`❌ Error al guardar: ${(error as any).message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetConfiguration = async (agentName: string) => {
    if (!window.confirm(`¿Restaurar ${agentName} a configuración original?`)) {
      return;
    }

    try {
      const backendAgentName = getBackendAgentName(agentName);
      await apiService.post(`/agents/${backendAgentName}/reset`, {});

      alert(`✓ ${agentName} restaurado a configuración original`);
      setEditingAgent(null);
      setEditFormData({});
      refetch();
    } catch (error) {
      console.error('Error resetting configuration:', error);
      alert(`❌ Error al restaurar: ${(error as any).message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse-glow" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500 animate-pulse-glow" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      running: 'Activo',
      idle: 'Inactivo',
      error: 'Error',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400';
      case 'idle':
        return 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400';
      case 'error':
        return 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-400';
      default:
        return 'from-slate-500/10 to-slate-500/5 border-slate-500/20 text-slate-400';
    }
  };

  const getModelLabel = (modelValue: string) => {
    const model = MODELS.find(m => m.value === modelValue);
    return model ? model.label : modelValue || 'No configurado';
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="relative overflow-hidden rounded-xl p-8 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-pink-600/10 border border-blue-500/20 backdrop-blur-sm animate-slide-up">
        <div className="relative z-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Agentes IA
          </h1>
          <p className="text-slate-300 mt-2 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Gestión unificada y edición en línea de agentes
          </p>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      {/* Horizontal Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-max">
        {(agents || []).map((agent: any, idx: number) => (
          <div
            key={agent.name}
            className="agent-card-horizontal border border-[#2D2D2D] rounded-xl p-6 space-y-4 flex flex-col h-full"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-lg border border-blue-500/30">
                  <Activity size={18} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                  <p className="text-xs text-slate-400">{AGENT_PROMPTS[agent.name]}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r ${getStatusColor(agent.status)} rounded-full border backdrop-blur-sm w-fit`}>
                {getStatusIcon(agent.status)}
                <span className="text-xs font-semibold">{getStatusText(agent.status)}</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-2">
              <div className="metric-badge rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 size={14} className="text-blue-400" />
                    <span className="text-xs text-slate-400">Respuesta</span>
                  </div>
                  <span className="text-sm font-bold text-white">{agent.avgResponseTime ?? '—'}ms</span>
                </div>
              </div>
              <div className="metric-badge rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge size={14} className="text-emerald-400" />
                    <span className="text-xs text-slate-400">Velocidad</span>
                  </div>
                  <span className="text-sm font-bold text-white">{agent.processingSpeed ?? '—'}m/s</span>
                </div>
              </div>
              <div className="metric-badge rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-amber-400" />
                    <span className="text-xs text-slate-400">Actividad</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300 truncate">{agent.lastActivity ?? 'Sin registros'}</span>
                </div>
              </div>
            </div>

            {/* Configuration Section */}
            {editingAgent === agent.name ? (
              <div className="space-y-3 bg-slate-900/30 p-4 rounded-lg border border-slate-700">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="p-1 bg-blue-500/20 rounded">🤖</span>
                    Modelo
                  </label>
                  <select
                    value={editFormData[agent.name]?.model || agent.model}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      [agent.name]: { ...editFormData[agent.name], model: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all duration-300"
                  >
                    {MODELS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <span className="p-1 bg-purple-500/20 rounded">📝</span>
                    Prompt
                  </label>
                  <textarea
                    value={editFormData[agent.name]?.prompt || AGENT_PROMPTS[agent.name]}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      [agent.name]: { ...editFormData[agent.name], prompt: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white text-xs font-mono h-32 resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all placeholder-slate-600"
                    placeholder="Prompt del agente..."
                  />
                </div>

                {/* Save/Cancel Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveConfiguration(agent.name)}
                    disabled={isSaving}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                      isSaving
                        ? 'bg-slate-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                    }`}
                  >
                    <Save size={14} />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingAgent(null);
                      setEditFormData({});
                    }}
                    className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all flex items-center justify-center gap-2"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                </div>

                {/* Reset Option */}
                <button
                  onClick={() => handleResetConfiguration(agent.name)}
                  className="w-full px-3 py-2 rounded-lg font-semibold text-sm border border-slate-600 text-slate-300 hover:text-slate-200 hover:border-slate-500 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={14} />
                  Restaurar Original
                </button>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-900/30 p-4 rounded-lg border border-slate-700">
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-2">
                    <span>🤖</span>
                    Modelo Actual
                  </p>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-800">
                    <p className="text-sm text-blue-300 font-mono">
                      {agent.model && agent.model.trim() ? getModelLabel(agent.model) : '⭘ Sin configurar'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold mb-2 flex items-center gap-2">
                    <span>📝</span>
                    Prompt Preview
                  </p>
                  <div className="bg-slate-900/50 p-3 rounded border border-slate-800 max-h-40 overflow-y-auto">
                    <p className="text-xs text-slate-300 italic leading-relaxed whitespace-pre-wrap">
                      {AGENT_PROMPTS[agent.name] || agent.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Change Log */}
            {changeLog[agent.name] && changeLog[agent.name].length > 0 && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-1">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Últimos cambios
                </p>
                {changeLog[agent.name].slice(-2).map((change, idx) => (
                  <p key={idx} className="text-xs text-slate-400">
                    ✓ {change.type === 'model' ? 'Modelo' : 'Prompt'} actualizado
                  </p>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {editingAgent !== agent.name && (
              <div className="flex gap-2 pt-2 border-t border-slate-700 mt-auto">
                <button
                  onClick={() => handleEditStart(agent.name)}
                  className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all flex items-center justify-center gap-2"
                >
                  <Pencil size={14} />
                  Editar
                </button>
                <button
                  className="flex-1 px-3 py-2 rounded-lg font-semibold text-sm border border-slate-600 hover:border-blue-500 hover:bg-blue-600/10 text-slate-300 hover:text-blue-300 transition-all flex items-center justify-center gap-2"
                >
                  <Play size={14} />
                  Probar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
