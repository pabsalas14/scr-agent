import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileSearch, AlertCircle, CheckCircle2, Clock, Code2, Shield } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Hallazgo } from '../../types/api';

interface IncidentResponseViewerProps {
  analysisId: string;
}

export default function IncidentResponseViewer({ analysisId }: IncidentResponseViewerProps) {
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const { data: hallazgos, isLoading } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280]">Analizando archivos...</span>
      </div>
    );
  }

  if (!hallazgos || hallazgos.length === 0) {
    return (
      <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/5 p-12 text-center flex flex-col items-center space-y-4">
        <div className="w-14 h-14 rounded-xl bg-[#22C55E]/10 flex items-center justify-center border border-[#22C55E]/20">
          <CheckCircle2 className="text-[#22C55E] w-7 h-7" />
        </div>
        <h3 className="text-white text-lg font-semibold">Análisis completado sin incidentes</h3>
        <p className="text-[#6B7280] text-sm max-w-sm mx-auto">
          No se detectaron vulnerabilidades o archivos sospechosos en el análisis de respuesta a incidentes.
        </p>
      </div>
    );
  }

  // Group findings by file
  const findingsByFile = hallazgos.reduce((acc, f) => {
    const file = f.file || 'Sin archivo';
    if (!acc[file]) {
      acc[file] = [];
    }
    acc[file].push(f);
    return acc;
  }, {} as Record<string, Hallazgo[]>);

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <FileSearch className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Archivos Escaneados</span>
          </div>
          <p className="text-3xl font-bold text-white">{Object.keys(findingsByFile).length}</p>
        </div>

        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Total de Hallazgos</span>
          </div>
          <p className="text-3xl font-bold text-white">{hallazgos.length}</p>
        </div>

        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Severidad Crítica</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {hallazgos.filter(h => h.severity === 'CRITICAL').length}
          </p>
        </div>
      </div>

      {/* Files and Findings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          Análisis por Archivo
        </h3>

        <div className="space-y-3">
          {Object.entries(findingsByFile).map(([file, findings]) => (
            <motion.div
              key={file}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-lg border border-[#2D2D2D] overflow-hidden hover:border-[#F97316]/40 transition-all group"
            >
              <button
                onClick={() => setExpandedFinding(expandedFinding === file ? null : file)}
                className="w-full px-6 py-4 bg-[#1E1E20] hover:bg-[#242424] transition-colors text-left flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{file}</p>
                  <p className="text-xs text-[#6B7280] mt-1">
                    {findings.length} hallazgo{findings.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {findings.some(f => f.severity === 'CRITICAL') && (
                    <span className="px-2 py-1 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-semibold rounded">
                      CRÍTICO
                    </span>
                  )}
                  <svg
                    className={`w-5 h-5 text-[#6B7280] transition-transform ${
                      expandedFinding === file ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </button>

              {expandedFinding === file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-[#2D2D2D] bg-[#242424]/50 px-6 py-4 space-y-3"
                >
                  {findings.map((finding, idx) => (
                    <div key={finding.id} className="space-y-2 pb-3 last:pb-0 border-b border-[#2D2D2D] last:border-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {idx + 1}. {finding.riskType}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            Línea: {finding.lineRange || 'N/A'} · Confidencia: {Math.round(finding.confidence * 100)}%
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
                            finding.severity === 'CRITICAL'
                              ? 'bg-[#EF4444]/10 text-[#EF4444]'
                              : finding.severity === 'HIGH'
                              ? 'bg-[#F97316]/10 text-[#F97316]'
                              : finding.severity === 'MEDIUM'
                              ? 'bg-[#EAB308]/10 text-[#EAB308]'
                              : 'bg-[#22C55E]/10 text-[#22C55E]'
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>

                      {finding.whySuspicious && (
                        <p className="text-xs text-[#94A3B8] leading-relaxed">
                          {finding.whySuspicious}
                        </p>
                      )}

                      {finding.codeSnippet && (
                        <pre className="bg-[#1C1C1E] p-3 rounded border border-[#2D2D2D] overflow-x-auto font-mono text-[10px] text-[#94A3B8] leading-relaxed">
                          <code>{finding.codeSnippet}</code>
                        </pre>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
