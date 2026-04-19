import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calendar, GitBranch } from 'lucide-react';
import { apiService } from '../services/api.service';
import { ComparisonPanel } from '../components/Comparison/ComparisonPanel';
import Button from '../components/ui/Button';
import type { Proyecto, Analisis } from '../types/api';

export default function AnalysisComparisonPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedId1, setSelectedId1] = useState<string>('');
  const [selectedId2, setSelectedId2] = useState<string>('');

  // Fetch projects
  const { data: projectsResponse } = useQuery({
    queryKey: ['projects-list'],
    queryFn: () => apiService.obtenerProyectos(),
    staleTime: 5 * 60 * 1000,
  });

  const projects = projectsResponse?.data || [];

  // Fetch analyses for selected project
  const { data: analysesResponse } = useQuery({
    queryKey: ['project-analyses', selectedProjectId],
    queryFn: () => {
      if (!selectedProjectId) return null;
      return apiService.obtenerAnalisisDelProyecto(selectedProjectId, { limit: 10 });
    },
    enabled: !!selectedProjectId,
    staleTime: 5 * 60 * 1000,
  });

  const analyses = (analysesResponse?.data || []).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA; // Newest first
  });

  const canCompare = selectedId1 && selectedId2 && selectedId1 !== selectedId2;
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Análisis Comparativo</h1>
        <p className="text-sm text-[#A0A0A0]">
          Compara dos escaneos del mismo repositorio para ver la evolución de hallazgos
        </p>
      </div>

      {/* Step 1: Project Selection */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-semibold text-blue-400">
            1
          </div>
          <h3 className="text-lg font-semibold text-white">Seleccionar Repositorio</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#A0A0A0] mb-3">
            Elige el repositorio
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {projects.length === 0 ? (
              <p className="col-span-full text-sm text-[#666666] py-4">
                No hay repositorios disponibles
              </p>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setSelectedId1('');
                    setSelectedId2('');
                  }}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedProjectId === project.id
                      ? 'bg-blue-500/10 border-blue-500 text-white'
                      : 'bg-[#111111] border-[#2D2D2D] text-[#A0A0A0] hover:border-[#3D3D3D]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <GitBranch size={18} className={selectedProjectId === project.id ? 'text-blue-400' : 'text-[#666666]'} />
                    <div>
                      <p className="font-semibold">{project.name}</p>
                      <p className="text-xs opacity-70">{project.repositoryUrl || 'Local'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Analyses Selection */}
      {selectedProjectId && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-semibold text-purple-400">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">Seleccionar Escaneos</h3>
          </div>

          {analyses.length === 0 ? (
            <p className="text-sm text-[#666666] py-4">
              No hay escaneos disponibles para este repositorio
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* First Scan */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A0A0A0]">
                  Primer Escaneo
                </label>
                <select
                  value={selectedId1}
                  onChange={(e) => setSelectedId1(e.target.value)}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-purple-500 text-sm"
                >
                  <option value="">Seleccionar escaneo...</option>
                  {analyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.createdAt || 0).toLocaleDateString('es-ES')} - {a.status}
                    </option>
                  ))}
                </select>
              </div>

              {/* Second Scan */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#A0A0A0]">
                  Segundo Escaneo
                </label>
                <select
                  value={selectedId2}
                  onChange={(e) => setSelectedId2(e.target.value)}
                  className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-purple-500 text-sm"
                >
                  <option value="">Seleccionar escaneo...</option>
                  {analyses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {new Date(a.createdAt || 0).toLocaleDateString('es-ES')} - {a.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedProjectId && !canCompare && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-300">
                Selecciona dos escaneos diferentes para ver la comparación
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Comparison Results */}
      {canCompare && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-sm font-semibold text-green-400">
              3
            </div>
            <div>
              <p className="font-semibold text-green-300">Comparación Lista</p>
              <p className="text-xs text-green-300/70">Mostrando diferencias entre escaneos</p>
            </div>
          </div>
          <ComparisonPanel type="analyses" id1={selectedId1} id2={selectedId2} />
        </div>
      )}
    </div>
  );
}
