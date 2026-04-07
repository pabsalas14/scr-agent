import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, GitBranch, Code2, AlertCircle, Clock, User } from 'lucide-react';
import type { EventoTimeline } from '../../types/timeline';

interface ForensicTimelineVisualProps {
  eventos: EventoTimeline[];
}

export default function ForensicTimelineVisual({ eventos }: ForensicTimelineVisualProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState<'todos' | 'alto' | 'critico'>('todos');

  // Filtrar eventos
  const filteredEventos = useMemo(() => {
    return eventos.filter((e) => {
      if (filterRisk === 'todos') return true;
      if (filterRisk === 'alto') return ['ALTO', 'CRÍTICO'].includes(e.nivel_riesgo);
      if (filterRisk === 'critico') return e.nivel_riesgo === 'CRÍTICO';
      return true;
    });
  }, [eventos, filterRisk]);

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'CRÍTICO': return { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]', border: 'border-[#EF4444]' };
      case 'ALTO': return { bg: 'bg-[#F97316]', text: 'text-[#F97316]', border: 'border-[#F97316]' };
      case 'MEDIO': return { bg: 'bg-[#EAB308]', text: 'text-[#EAB308]', border: 'border-[#EAB308]' };
      case 'BAJO': return { bg: 'bg-[#22C55E]', text: 'text-[#22C55E]', border: 'border-[#22C55E]' };
      default: return { bg: 'bg-[#6B7280]', text: 'text-[#6B7280]', border: 'border-[#6B7280]' };
    }
  };

  const getActionIcon = (accion: string) => {
    switch (accion) {
      case 'AGREGADO': return <Code2 className="w-4 h-4" />;
      case 'MODIFICADO': return <GitBranch className="w-4 h-4" />;
      case 'ELIMINADO': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (filteredEventos.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-[#6B7280]">No hay eventos que mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-[#6B7280] uppercase">Filtrar:</span>
        {['todos', 'alto', 'critico'].map((filter) => (
          <button
            key={filter}
            onClick={() => setFilterRisk(filter as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterRisk === filter
                ? 'bg-[#F97316]/20 text-[#F97316] border border-[#F97316]/40'
                : 'bg-[#242424] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#404040]'
            }`}
          >
            {filter === 'todos' ? 'Todos' : filter === 'alto' ? 'Alto/Crítico' : 'Crítico'}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-[#F97316] via-[#EAB308] to-[#22C55E]" />

        {/* Events */}
        <div className="space-y-4">
          {filteredEventos.map((evento, idx) => {
            const colors = getRiskColor(evento.nivel_riesgo);
            const isExpanded = expandedId === evento.id;

            return (
              <motion.div
                key={evento.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : evento.id)}
                  className="w-full pl-16 pr-4 py-4 rounded-lg border border-[#2D2D2D] bg-[#1E1E20] hover:bg-[#242424] hover:border-[#404040] transition-all group text-left"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-1 top-6 w-4 h-4 rounded-full border-2 bg-[#111111] ${colors.border} transition-all group-hover:scale-125`} />

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${colors.bg}/10 border border-[#2D2D2D]`}>
                          {getActionIcon(evento.accion)}
                        </div>
                        <span className={`text-sm font-semibold ${colors.text}`}>
                          {evento.accion}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${colors.bg}/20 ${colors.text} border-[#2D2D2D]`}>
                          {evento.nivel_riesgo}
                        </span>
                        <span className="ml-auto text-xs text-[#6B7280] whitespace-nowrap">
                          {new Date(evento.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white truncate">{evento.archivo}</p>
                        {evento.funcion && (
                          <p className="text-xs text-[#94A3B8] font-mono truncate">
                            {evento.funcion}
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-[#6B7280] transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-16 mt-2 space-y-3"
                  >
                    <div className="rounded-lg bg-[#242424]/50 p-4 border border-[#2D2D2D] space-y-3">
                      {/* Commit info */}
                      <div>
                        <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Commit Hash</p>
                        <p className="text-xs font-mono text-[#94A3B8] break-all">
                          {evento.commit}
                        </p>
                      </div>

                      {/* Author */}
                      {evento.autor && (
                        <div>
                          <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Autor
                          </p>
                          <p className="text-xs text-[#94A3B8]">{evento.autor}</p>
                        </div>
                      )}

                      {/* Commit message */}
                      {evento.mensaje_commit && (
                        <div>
                          <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Mensaje</p>
                          <p className="text-xs text-[#94A3B8] leading-relaxed italic">
                            "{evento.mensaje_commit}"
                          </p>
                        </div>
                      )}

                      {/* Changes summary */}
                      {evento.resumen_cambios && (
                        <div>
                          <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Cambios</p>
                          <p className="text-xs text-[#94A3B8] leading-relaxed">
                            {evento.resumen_cambios}
                          </p>
                        </div>
                      )}

                      {/* Suspicion indicators */}
                      {evento.indicadores_sospecha && evento.indicadores_sospecha.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-[#EF4444] uppercase mb-2">⚠️ Indicadores de Sospecha</p>
                          <div className="space-y-1">
                            {evento.indicadores_sospecha.map((indicator, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className="text-[#EF4444] flex-shrink-0 mt-0.5">→</span>
                                <span className="text-[#94A3B8]">{indicator}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related finding */}
                      {evento.hallazgo_id && (
                        <div className="bg-[#1C1C1E] p-2 rounded border border-[#2D2D2D]">
                          <p className="text-xs font-semibold text-[#F97316] flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Relacionado con hallazgo
                          </p>
                          <p className="text-xs text-[#94A3B8] font-mono mt-1">{evento.hallazgo_id}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-8 p-4 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{filteredEventos.length}</p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Eventos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#EF4444]">
              {filteredEventos.filter((e) => e.nivel_riesgo === 'CRÍTICO').length}
            </p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Críticos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#F97316]">
              {filteredEventos.filter((e) => e.indicadores_sospecha?.length).length}
            </p>
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">Sospechosos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
