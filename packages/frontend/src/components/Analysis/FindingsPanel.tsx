/**
 * ============================================================================
 * FINDINGS PANEL - Mostrar hallazgos de un análisis
 * ============================================================================
 *
 * Componente que muestra la lista de hallazgos (findings) encontrados
 * por los agentes de análisis de seguridad.
 */

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, AlertCircle, AlertOctagon, Info } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Hallazgo } from '../../types/api';

interface FindingsPanelProps {
  analysisId: string;
}

const SEVERITY_CONFIG = {
  CRÍTICO: {
    icon: AlertOctagon,
    color: 'text-red-500',
    bgColor: 'bg-red-900/20',
    borderColor: 'border-red-500/30',
    label: 'Crítico',
  },
  ALTO: {
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-500/30',
    label: 'Alto',
  },
  MEDIO: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-900/20',
    borderColor: 'border-yellow-500/30',
    label: 'Medio',
  },
  BAJO: {
    icon: Info,
    color: 'text-blue-500',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    label: 'Bajo',
  },
};

export default function FindingsPanel({ analysisId }: FindingsPanelProps) {
  const { data: findings, isLoading, error } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => apiService.obtenerHallazgos(analysisId),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-gray-400">⟳</div>
        <span className="ml-3 text-gray-400">Cargando hallazgos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-600/30 p-4">
        <p className="text-red-400 text-sm">
          ⚠️ Error cargando hallazgos
        </p>
      </div>
    );
  }

  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-lg bg-green-900/20 border border-green-600/30 p-6 text-center">
        <p className="text-green-400 text-lg font-semibold">
          ✅ No se encontraron problemas de seguridad
        </p>
        <p className="text-green-400/70 text-sm mt-2">
          El código pasó el análisis de seguridad exitosamente
        </p>
      </div>
    );
  }

  // Agrupar por severidad
  const findingsBySeverity = {
    CRÍTICO: findings.filter((f) => f.severity === 'CRÍTICO'),
    ALTO: findings.filter((f) => f.severity === 'ALTO'),
    MEDIO: findings.filter((f) => f.severity === 'MEDIO'),
    BAJO: findings.filter((f) => f.severity === 'BAJO'),
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(findingsBySeverity).map(([severity, items]) => {
          const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG];
          return (
            <div
              key={severity}
              className={`rounded-lg p-4 border ${config.bgColor} ${config.borderColor}`}
            >
              <p className={`${config.color} text-2xl font-bold`}>
                {items.length}
              </p>
              <p className={`${config.color} text-sm mt-1`}>
                {config.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {Object.entries(findingsBySeverity).map(
          ([severity, items]) =>
            items.length > 0 && (
              <div key={severity} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                  {
                    SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG]
                      .label
                  }
                  ({items.length})
                </h3>

                {items.map((finding: Hallazgo) => {
                  const config =
                    SEVERITY_CONFIG[
                      finding.severity as keyof typeof SEVERITY_CONFIG
                    ];
                  const Icon = config.icon;

                  return (
                    <div
                      key={finding.id}
                      className={`rounded-lg border p-4 ${config.bgColor} ${config.borderColor} hover:border-opacity-100 transition-all`}
                    >
                      <div className="flex gap-3">
                        <Icon className={`${config.color} w-5 h-5 flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm">
                                {finding.riskType}
                              </p>
                              <p className="text-xs text-gray-400">
                                {finding.file}
                                {finding.function && ` → ${finding.function}`}
                                {finding.lineRange && ` (línea ${finding.lineRange})`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                                {Math.round(finding.confidence * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Why Suspicious */}
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-300 mb-1">
                              🔍 Por qué es sospechoso:
                            </p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {finding.whySuspicious}
                            </p>
                          </div>

                          {/* Code Snippet */}
                          {finding.codeSnippet && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-300 mb-1">
                                📝 Código:
                              </p>
                              <pre className="text-xs bg-gray-900/50 p-2 rounded border border-gray-700/50 overflow-x-auto">
                                <code className="text-gray-300">
                                  {finding.codeSnippet.substring(0, 200)}
                                  {finding.codeSnippet.length > 200 && '...'}
                                </code>
                              </pre>
                            </div>
                          )}

                          {/* Remediation */}
                          <div>
                            <p className="text-xs font-medium text-gray-300 mb-1">
                              ✅ Pasos para remediar:
                            </p>
                            <ul className="text-xs text-gray-400 leading-relaxed list-disc list-inside space-y-1">
                              {Array.isArray(finding.remediationSteps) ? (
                                finding.remediationSteps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))
                              ) : (
                                <li>{finding.remediationSteps}</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
        )}
      </div>
    </div>
  );
}
