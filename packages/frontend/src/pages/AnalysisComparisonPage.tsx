import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api.service';
import { ComparisonPanel } from '../components/Comparison/ComparisonPanel';
import Button from '../components/ui/Button';
import type { Analisis } from '../types/api';

export default function AnalysisComparisonPage() {
  const [selectedId1, setSelectedId1] = useState<string>('');
  const [selectedId2, setSelectedId2] = useState<string>('');

  const { data: analyses } = useQuery<Analisis[]>({
    queryKey: ['analyses-list'],
    queryFn: () => apiService.obtenerAnalisis(),
    staleTime: 5 * 60 * 1000,
  });

  const canCompare = selectedId1 && selectedId2 && selectedId1 !== selectedId2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Análisis Comparativo</h1>
        <p className="text-sm text-[#A0A0A0]">
          Compara dos análisis para ver la evolución de hallazgos y riesgos
        </p>
      </div>

      {/* Selection UI */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Left Analysis */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Primer Análisis
            </label>
            <select
              value={selectedId1}
              onChange={(e) => setSelectedId1(e.target.value)}
              className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar análisis...</option>
              {analyses?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.projectName || `Análisis ${a.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Right Analysis */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white">
              Segundo Análisis
            </label>
            <select
              value={selectedId2}
              onChange={(e) => setSelectedId2(e.target.value)}
              className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
            >
              <option value="">Seleccionar análisis...</option>
              {analyses?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.projectName || `Análisis ${a.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!canCompare && (
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-300">
              Selecciona dos análisis diferentes para ver la comparación
            </p>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {canCompare && (
        <div className="space-y-4">
          <ComparisonPanel type="analyses" id1={selectedId1} id2={selectedId2} />
        </div>
      )}
    </div>
  );
}
