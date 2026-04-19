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

  // Fetch agents
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiService.get('/agents');
      return response.data?.data || [];
    },
  });

  const AGENT_LIST = [
    {
      name: 'Inspector',
      description: 'Detección de malware y patrones maliciosos',
      status: 'running' as const,
      model: 'Claude Sonnet 4.6',
      avgResponseTime: 18,
      processingSpeed: 2300,
      lastActivity: '2 min ago',
    },
    {
      name: 'Detective',
      description: 'Análisis forense y línea de tiempo',
      status: 'running' as const,
      model: 'LM Studio (Local)',
      avgResponseTime: 23,
      processingSpeed: 1800,
      lastActivity: '5 min ago',
    },
    {
      name: 'Fiscal',
      description: 'Evaluación de riesgos empresariales',
      status: 'idle' as const,
      model: 'Claude Opus 4.7',
      avgResponseTime: 15,
      processingSpeed: 3200,
      lastActivity: '1 hour ago',
    },
  ];

  const handleConfigureAgent = (agentName: string) => {
    const agent = AGENT_LIST.find(a => a.name === agentName);
    setEditingAgent(agent);
    setShowConfigDrawer(true);
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
              {AGENT_LIST.map(agent => (
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
              {AGENT_LIST.map(agent => (
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
      {editingAgent && (
        <DetailDrawer
          isOpen={showConfigDrawer}
          onClose={() => {
            setShowConfigDrawer(false);
            setTimeout(() => setEditingAgent(null), 300);
          }}
          title={`Configure ${editingAgent.name}`}
          subtitle="Edit agent prompt and settings"
          width="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#888] mb-2">Model</label>
              <select className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white">
                <option>{editingAgent.model}</option>
                <option>Claude Sonnet 4.6</option>
                <option>Claude Opus 4.7</option>
                <option>Claude Haiku 4.5</option>
                <option>LM Studio (Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#888] mb-2">Prompt</label>
              <textarea
                defaultValue={`System prompt for ${editingAgent.name} agent...`}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm font-mono h-64 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-[#888] mb-2">Version History</label>
              <select className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm">
                <option>v1.0 (Current)</option>
                <option>v0.9</option>
                <option>v0.8</option>
              </select>
            </div>
          </div>
        </DetailDrawer>
      )}
    </div>
  );
}
