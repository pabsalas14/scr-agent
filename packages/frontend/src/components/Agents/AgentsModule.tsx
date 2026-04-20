/**
 * AgentsModule Component
 * Unified agent management module
 * Consolidates: Agentes IA (monitoring) + Agentes (configuration)
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Wand2, Activity, Settings, Pencil, RotateCcw } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import DetailDrawer from '../ui/DetailDrawer';

interface Agent {
  name: string;
  status: 'running' | 'idle' | 'error';
  model: string;
  avgResponseTime: number;
  processingSpeed: number;
  lastActivity: string;
}

export default function AgentsModule() {
  const [activeTab, setActiveTab] = useState<'status' | 'config'>('status');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch agents
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiService.get('/agents');
      return response.data?.data || [];
    },
  });

  // Note: AGENT_LIST removed - agents now fetched from real API via useQuery below

  const handleConfigureAgent = (agentName: string) => {
    const agent = agents?.find((a: any) => a.name === agentName);
    if (agent) {
      setEditingAgent(agent);
      setEditFormData({
        model: agent.model,
        prompt: agent.prompt || `System prompt for ${agent.name} agent...`,
      });
      setShowConfigDrawer(true);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!editingAgent || !editFormData) return;

    setIsSaving(true);
    try {
      // Save agent configuration via API
      // This would typically be: PATCH /agents/{agentName}
      await apiService.patch(`/agents/${editingAgent.name}`, editFormData);

      // Close drawer and refresh agents list
      setShowConfigDrawer(false);
      setEditingAgent(null);
      setEditFormData(null);

      // Optionally refetch agents here if needed
    } catch (error) {
      console.error('Error saving agent configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Agentes IA</h1>
        <p className="text-[#888] mt-1">Monitoreo y configuración de agentes de análisis</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-[#2D2D2D]">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'status'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-[#888] hover:text-white'
          }`}
        >
          <Activity size={18} />
          <span>Estado</span>
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'config'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-[#888] hover:text-white'
          }`}
        >
          <Settings size={18} />
          <span>Configuración</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="grid grid-cols-3 gap-4">
              {(agents || []).map((agent: any) => (
                <div
                  key={agent.name}
                  className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                      <p className="text-xs text-[#666] mt-1">{agent.description}</p>
                    </div>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        agent.status === 'running'
                          ? 'bg-green-500'
                          : agent.status === 'idle'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>

                  {/* Status */}
                  <div className="py-3 px-4 bg-[#111] border border-[#2D2D2D] rounded">
                    <p className="text-xs text-[#888] mb-1">Status</p>
                    <p className="text-white font-semibold capitalize">{agent.status}</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="py-3 px-4 bg-[#111] border border-[#2D2D2D] rounded">
                      <p className="text-xs text-[#888]">Avg Response</p>
                      <p className="text-white font-semibold">{agent.avgResponseTime}ms</p>
                    </div>
                    <div className="py-3 px-4 bg-[#111] border border-[#2D2D2D] rounded">
                      <p className="text-xs text-[#888]">Speed</p>
                      <p className="text-white font-semibold">{agent.processingSpeed}m/s</p>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div>
                    <p className="text-xs text-[#888] mb-1">Last Activity</p>
                    <p className="text-white text-sm">{agent.lastActivity}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="secondary" className="flex-1">
                      View Logs
                    </Button>
                    {agent.status === 'running' && (
                      <Button size="sm" variant="secondary" className="flex-1">
                        Restart
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              {(agents || []).map((agent: any) => (
                <div
                  key={agent.name}
                  className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                    <p className="text-sm text-[#888] mt-1">{agent.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div>
                        <p className="text-xs text-[#666] mb-1">Model</p>
                        <p className="text-white font-semibold text-sm">{agent.model}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleConfigureAgent(agent.name)}
                    >
                      <Pencil size={16} className="mr-2" />
                      Edit Prompt
                    </Button>
                    <Button size="sm" variant="secondary">
                      <RotateCcw size={16} className="mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Config Drawer */}
      {editingAgent && editFormData && (
        <DetailDrawer
          isOpen={showConfigDrawer}
          onClose={() => {
            setShowConfigDrawer(false);
            setTimeout(() => setEditingAgent(null), 300);
          }}
          title={`Configurar ${editingAgent.name}`}
          subtitle="Edita el modelo y prompt del agente"
          width="lg"
        >
          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">Modelo</label>
              <select
                value={editFormData.model}
                onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm focus:border-blue-500 focus:outline-none"
              >
                <optgroup label="Anthropic (API)">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-opus-4-7">Claude Opus 4.7</option>
                  <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                </optgroup>
                <optgroup label="Open Source (LM Studio)">
                  <option value="qwen2.5-coder-7b-instruct">Qwen 2.5 Coder (7B)</option>
                  <option value="mistral-7b">Mistral 7B</option>
                  <option value="llama2-13b">Llama 2 (13B)</option>
                </optgroup>
              </select>
              <p className="text-xs text-[#666] mt-2">💡 Modelos disponibles: Anthropic (API) y LM Studio (local). Cambia aquí el modelo que usará este agente.</p>
            </div>

            {/* Prompt Editor */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">System Prompt</label>
              <textarea
                value={editFormData.prompt}
                onChange={(e) => setEditFormData({ ...editFormData, prompt: e.target.value })}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm font-mono h-48 resize-none focus:border-blue-500 focus:outline-none"
                placeholder={`System prompt for ${editingAgent.name} agent...`}
              />
              <p className="text-xs text-[#666] mt-2">Instrucciones del sistema que guiarán al agente en sus análisis.</p>
            </div>

            {/* Agent Info */}
            <div className="bg-[#111] border border-[#2D2D2D] rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold text-white">Información del Agente</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#888]">Nombre</p>
                  <p className="text-white font-mono">{editingAgent.name}</p>
                </div>
                <div>
                  <p className="text-[#888]">Estado</p>
                  <p className="text-green-400 font-semibold capitalize">{editingAgent.status || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-[#2D2D2D]">
              <Button
                onClick={handleSaveConfiguration}
                disabled={isSaving}
                variant="primary"
                className="flex-1"
              >
                {isSaving ? '💾 Guardando...' : '✓ Guardar Cambios'}
              </Button>
              <Button
                onClick={() => {
                  setShowConfigDrawer(false);
                  setTimeout(() => setEditingAgent(null), 300);
                }}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
