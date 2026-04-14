import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api.service';

export default function ForensicsInvestigations() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(null);

  const { data: analysesData } = useQuery({
    queryKey: ['analyses-list-forensics'],
    queryFn: () => apiService.obtenerAnalisisGlobales({ limit: 20 }),
  });

  const completedAnalyses = (analysesData?.data || []).filter((a: any) => a.status === 'COMPLETED');

  useEffect(() => {
    if (!selectedAnalysisId && completedAnalyses.length > 0) {
      setSelectedAnalysisId(completedAnalyses[0].id);
    }
  }, [completedAnalyses, selectedAnalysisId]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Investigaciones Forenses</h2>
          <p className="text-sm text-[#6B7280]">
            Analiza la línea de tiempo completa, investiga usuarios y repositorios por análisis
          </p>
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#475569]">Sessión:</span>
          <select 
            className="bg-[#1E1E20] border border-[#2D2D2D] text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-[#F97316]/50 transition-all min-w-[220px] mt-2"
            value={selectedAnalysisId || ''}
            onChange={(e) => setSelectedAnalysisId(e.target.value)}
          >
            {completedAnalyses.length === 0 ? (
              <option value="">Sin registros completados</option>
            ) : completedAnalyses.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.projectName || 'Análisis'} - {new Date(a.createdAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-dashed border-[#2D2D2D] rounded-lg p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-[#2D2D2D] mx-auto mb-3" />
        <p className="text-white text-sm font-medium">Componente en construcción</p>
        <p className="text-[#475569] text-xs mt-1">Esta sección está siendo optimizada. Por favor, intenta más tarde.</p>
      </div>
    </div>
  );
}
