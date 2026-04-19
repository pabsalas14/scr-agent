import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Edit2, RotateCcw, Save, X, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { apiService } from '../services/api.service';
import { useToast } from '../hooks/useToast';

interface AgentPromptData {
  agentName: string;
  label: string;
  prompt: string;
  version: number;
  lastUpdated: string | null;
  updatedBy: string | null;
  isCustom: boolean;
}

interface AgentVersionData {
  agentName: string;
  currentVersion: number;
  versions: Array<{
    version: number;
    updatedAt: string;
    updatedBy: string | null;
  }>;
}

const AGENTS = [
  { id: 'inspector', label: 'Inspector', description: 'Análisis estático de código y patrones de seguridad' },
  { id: 'detective', label: 'Detective', description: 'Detección de anomalías y comportamientos sospechosos' },
  { id: 'fiscal', label: 'Fiscal', description: 'Investigación forense y análisis de impacto' },
];

export default function AgentsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editComment, setEditComment] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [resettingAgent, setResettingAgent] = useState<string | null>(null);

  // Fetch agent prompt
  const { data: agentData, isLoading: loadingAgent } = useQuery<AgentPromptData | null>({
    queryKey: ['agent-prompt', expandedAgent],
    queryFn: async () => {
      if (!expandedAgent) return null;
      const res = await apiService.get(`/agents/${expandedAgent}/prompt`);
      return res.data?.data || null;
    },
    enabled: !!expandedAgent,
  });

  // Fetch agent versions
  const { data: versionData } = useQuery<AgentVersionData | null>({
    queryKey: ['agent-versions', expandedAgent],
    queryFn: async () => {
      if (!expandedAgent) return null;
      const res = await apiService.get(`/agents/${expandedAgent}/versions`);
      return res.data?.data || null;
    },
    enabled: !!expandedAgent,
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async (agentName: string) => {
      const res = await apiService.put(`/agents/${agentName}/prompt`, {
        prompt: editPrompt,
        comment: editComment || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Prompt del agente actualizado correctamente');
      setEditingAgent(null);
      setEditPrompt('');
      setEditComment('');
      queryClient.invalidateQueries({ queryKey: ['agent-prompt'] });
      queryClient.invalidateQueries({ queryKey: ['agent-versions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al actualizar el prompt');
    },
  });

  // Reset prompt mutation
  const resetPromptMutation = useMutation({
    mutationFn: async (agentName: string) => {
      const res = await apiService.post(`/agents/${agentName}/reset`, {});
      return res.data;
    },
    onSuccess: () => {
      toast.success('Prompt restaurado a versión default');
      setResettingAgent(null);
      queryClient.invalidateQueries({ queryKey: ['agent-prompt'] });
      queryClient.invalidateQueries({ queryKey: ['agent-versions'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al restaurar el prompt');
    },
  });

  const handleEditStart = (agent: AgentPromptData) => {
    setOriginalPrompt(agent.prompt);
    setEditPrompt(agent.prompt);
    setEditingAgent(agent.agentName);
    setShowDiff(false);
  };

  const handleEditCancel = () => {
    setEditingAgent(null);
    setEditPrompt('');
    setEditComment('');
    setShowDiff(false);
  };

  const calculateDiff = () => {
    const original = originalPrompt.split('\n');
    const edited = editPrompt.split('\n');
    return {
      added: edited.length - original.length,
      removed: original.length - edited.length,
      linesChanged: original.filter((line, idx) => line !== (edited[idx] || '')).length,
    };
  };

  const diff = showDiff ? calculateDiff() : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Agentes Dinámicos</h1>
        <p className="text-sm text-[#A0A0A0]">
          Ver y editar los prompts que guían el comportamiento de cada agente de análisis
        </p>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {AGENTS.map((agent) => {
          const isExpanded = expandedAgent === agent.id;
          const isLoading = isExpanded && loadingAgent;
          const isEditing = editingAgent === agent.id;

          return (
            <div
              key={agent.id}
              className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg overflow-hidden"
            >
              {/* Agent Header - Clickable to Expand */}
              <button
                onClick={() =>
                  setExpandedAgent(isExpanded ? null : agent.id)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2D2D2D] transition-colors"
              >
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-white">{agent.label}</h3>
                  <p className="text-sm text-[#A0A0A0] mt-1">{agent.description}</p>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-[#666666] transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[#2D2D2D] px-6 py-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-3 border-white/10 border-t-white rounded-full animate-spin" />
                    </div>
                  ) : agentData ? (
                    <>
                      {/* Agent Info */}
                      {!isEditing && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-[#666666] mb-1">Versión Actual</p>
                            <p className="text-white font-semibold">v{agentData.version}</p>
                          </div>
                          <div>
                            <p className="text-[#666666] mb-1">Tipo</p>
                            <p className="text-white font-semibold">
                              {agentData.isCustom ? 'Personalizado' : 'Default'}
                            </p>
                          </div>
                          {agentData.lastUpdated && (
                            <div>
                              <p className="text-[#666666] mb-1">Última Actualización</p>
                              <p className="text-white text-xs">
                                {new Date(agentData.lastUpdated).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          )}
                          {agentData.updatedBy && (
                            <div>
                              <p className="text-[#666666] mb-1">Actualizado Por</p>
                              <p className="text-white text-xs">{agentData.updatedBy}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Prompt Display/Edit */}
                      {!isEditing ? (
                        <div>
                          <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                            Prompt Actual
                          </label>
                          <div className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-4 font-mono text-xs text-[#A0A0A0] max-h-64 overflow-y-auto">
                            {agentData.prompt}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                              Editar Prompt
                            </label>
                            <textarea
                              value={editPrompt}
                              onChange={(e) => {
                                setEditPrompt(e.target.value);
                                setShowDiff(true);
                              }}
                              className="w-full px-4 py-3 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500 resize-none h-64"
                              placeholder="Edita el prompt del agente..."
                            />
                          </div>

                          {/* Comment */}
                          <div>
                            <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                              Comentario (Opcional)
                            </label>
                            <input
                              type="text"
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                              placeholder="Ej: Mejoramiento de precisión..."
                            />
                          </div>

                          {/* Diff Preview */}
                          {showDiff && diff && (
                            <div className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-4">
                              <p className="text-xs text-[#666666] mb-3">Preview de Cambios:</p>
                              <div className="space-y-2 text-xs">
                                {diff.added > 0 && (
                                  <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle size={14} />
                                    <span>+{diff.added} líneas agregadas</span>
                                  </div>
                                )}
                                {diff.removed > 0 && (
                                  <div className="flex items-center gap-2 text-red-400">
                                    <X size={14} />
                                    <span>-{diff.removed} líneas removidas</span>
                                  </div>
                                )}
                                {diff.linesChanged > 0 && (
                                  <div className="flex items-center gap-2 text-yellow-400">
                                    <AlertCircle size={14} />
                                    <span>~{diff.linesChanged} líneas modificadas</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Version History */}
                      {versionData && versionData.versions.length > 0 && !isEditing && (
                        <div>
                          <label className="block text-xs text-[#6B7280] mb-2 font-medium">
                            Historial de Versiones
                          </label>
                          <div className="space-y-2">
                            {versionData.versions.map((v) => (
                              <div
                                key={v.version}
                                className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-3 text-xs"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-white">v{v.version}</span>
                                  <span className="text-[#666666]">
                                    {new Date(v.updatedAt).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                                {v.updatedBy && (
                                  <p className="text-[#666666] mt-1">Por: {v.updatedBy}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        {!isEditing ? (
                          <>
                            <Button
                              onClick={() => handleEditStart(agentData)}
                              size="sm"
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Edit2 size={16} />
                              Editar Prompt
                            </Button>
                            {agentData.isCustom && (
                              <Button
                                onClick={() => setResettingAgent(agent.id)}
                                size="sm"
                                variant="secondary"
                                className="flex-1 flex items-center justify-center gap-2"
                              >
                                <RotateCcw size={16} />
                                Restaurar Default
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() =>
                                updatePromptMutation.mutate(agent.id)
                              }
                              disabled={updatePromptMutation.isPending}
                              size="sm"
                              className="flex-1 flex items-center justify-center gap-2"
                            >
                              <Save size={16} />
                              {updatePromptMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            <Button
                              onClick={handleEditCancel}
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Reset Confirmation Modal */}
                      {resettingAgent === agent.id && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                          <p className="text-sm text-red-400 mb-3">
                            ¿Estás seguro de que deseas restaurar el prompt a la versión default?
                            Esta acción no puede deshacerse.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() =>
                                resetPromptMutation.mutate(agent.id)
                              }
                              disabled={resetPromptMutation.isPending}
                              size="sm"
                              className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                              {resetPromptMutation.isPending ? 'Restaurando...' : 'Confirmar Restauración'}
                            </Button>
                            <Button
                              onClick={() => setResettingAgent(null)}
                              size="sm"
                              variant="secondary"
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#A0A0A0]">No se pudo cargar el prompt del agente</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Puedes editar los prompts de los agentes para personalizar su comportamiento. Los cambios se guardan con control de versiones para auditoría.
        </p>
      </div>
    </div>
  );
}
