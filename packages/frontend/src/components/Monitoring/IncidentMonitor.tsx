import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ShieldAlert, AlertOctagon, Terminal, Radio, Clock, ShieldX } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';
import type { Proyecto, Analisis, Hallazgo } from '../../types/api';

export default function IncidentMonitor() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiService.obtenerProyectos(),
    refetchInterval: 10000,
  });

  const proyectos = projectsData?.data || [];

  const allAnalyses = proyectos.flatMap((p: Proyecto) =>
    (p.analyses || []).map((a: Analisis) => ({
      ...a,
      projectName: p.name,
      projectId: p.id,
      highSeverityFindings: (a.findings || []).filter((f: Hallazgo) => f.severity === 'HIGH' || f.severity === 'CRITICAL').length
    }))
  );

  type EnrichedAnalysis = Analisis & { projectName: string; projectId: string; highSeverityFindings: number; error?: string };

  const incidentes = allAnalyses.filter((a: EnrichedAnalysis) =>
    a.status === 'ERROR' ||
    a.status === 'FAILED' ||
    (a.report?.riskScore != null && a.report.riskScore > 70) ||
    a.highSeverityFindings > 0
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Radio className="w-8 h-8 text-[#EF4444] animate-pulse" />
        <p className="text-sm text-[#6B7280]">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              <span className="text-xs text-[#EF4444]">Transmisión crítica activa</span>
            </div>
            <h1 className="text-2xl font-semibold text-white">Incidentes</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Monitoreo de desvíos críticos, fallos y vectores de riesgo.
            </p>
          </div>
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-[#6B7280] mb-0.5">Alertas activas</p>
            <p className="text-2xl font-semibold text-[#EF4444]">{incidentes.length}</p>
          </div>
        </div>
      </div>

      {/* Incidents */}
      {incidentes.length > 0 ? (
        <div className="space-y-3">
          {incidentes.map((inc: EnrichedAnalysis, idx: number) => (
            <motion.div
              key={inc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div
                className={`bg-[#1E1E20] border rounded-xl p-4 flex gap-4 items-start ${
                  inc.status === 'ERROR' ? 'border-l-2 border-l-[#EF4444] border-[#2D2D2D]' : 'border-l-2 border-l-[#FB923C] border-[#2D2D2D]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    inc.status === 'ERROR' ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#FB923C]/10 text-[#FB923C]'
                  }`}
                >
                  {inc.status === 'ERROR' ? <ShieldX className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{inc.projectName}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                        inc.status === 'ERROR'
                          ? 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]'
                          : 'bg-[#FB923C]/10 border-[#FB923C]/20 text-[#FB923C]'
                      }`}
                    >
                      {inc.status === 'ERROR' ? 'Sistema caído' : 'Riesgo crítico'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#6B7280]">
                    <span className="flex items-center gap-1"><Terminal className="w-3 h-3" /> ID: {inc.id.slice(0, 8)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(inc.createdAt).toLocaleString()}</span>
                  </div>
                  {inc.status === 'ERROR' && (
                    <p className="text-xs font-mono text-[#EF4444]/70 mt-2 bg-[#EF4444]/5 px-3 py-1.5 rounded-lg border border-[#EF4444]/10">
                      {inc.error || 'Fallo inesperado del motor de análisis'}
                    </p>
                  )}
                </div>

                {inc.status !== 'ERROR' && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#6B7280]">Puntuación</p>
                    <p className="text-xl font-semibold text-[#FB923C]">{inc.report?.riskScore ?? '—'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-[#2D2D2D] bg-transparent h-48 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-white">Sin incidentes críticos</p>
            <p className="text-xs text-[#6B7280] mt-1">Perímetro de seguridad estable.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
