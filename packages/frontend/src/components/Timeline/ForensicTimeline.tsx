/**
 * ============================================================================
 * COMPONENTE: ForensicTimeline
 * ============================================================================
 *
 * Timeline forense interactivo usando React Flow v12 (@xyflow/react).
 *
 * Layout: X = timestamp normalizado, Y = agrupado por archivo afectado.
 *         Cada archivo forma una "fila" horizontal (tipo Gantt).
 *
 * Características:
 * - Nodos custom (ForensicNode) con glassmorphism y colores por severidad
 * - Edges entre eventos del mismo archivo/función (flujo de cambios)
 * - Filtros de severidad con chips
 * - Mini-mapa integrado
 * - Panel de detalles al hacer click en un nodo
 * - Zoom/Pan nativo de React Flow
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GitCommit, Clock, User, FileCode, AlertCircle } from 'lucide-react';
import type { EventoTimeline, NivelRiesgo } from '../../types/timeline';
import ForensicNode, { type ForensicNodeData } from './ForensicNode';

// ── Tipos ─────────────────────────────────────────────────────────────────
interface ForensicTimelineProps {
  eventos: EventoTimeline[];
}

const NODE_TYPES = { forensicNode: ForensicNode };

const SEVERITY_ORDER: NivelRiesgo[] = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];

const CHIP_COLORS: Record<NivelRiesgo, { bg: string; border: string; text: string }> = {
  CRÍTICO: { bg: 'rgba(239,68,68,0.15)',  border: '#EF4444', text: '#EF4444' },
  ALTO:    { bg: 'rgba(251,146,60,0.15)', border: '#FB923C', text: '#FB923C' },
  MEDIO:   { bg: 'rgba(234,179,8,0.12)',  border: '#EAB308', text: '#EAB308' },
  BAJO:    { bg: 'rgba(34,197,94,0.12)',  border: '#22C55E', text: '#22C55E' },
};

const MINIMAP_COLORS: Record<NivelRiesgo, string> = {
  CRÍTICO: '#EF4444',
  ALTO:    '#FB923C',
  MEDIO:   '#EAB308',
  BAJO:    '#22C55E',
};

// ── Layout ────────────────────────────────────────────────────────────────
const NODE_WIDTH  = 220;
const NODE_HEIGHT = 90;
const X_PADDING   = 60;
const Y_PADDING   = 140;
const X_SPAN      = 2000;

function construirGrafo(
  eventos: EventoTimeline[],
  filtrosSeveridad: Set<NivelRiesgo>
): { nodes: Node[]; edges: Edge[] } {
  const eventosFiltrados = filtrosSeveridad.size === 0
    ? eventos
    : eventos.filter((e) => filtrosSeveridad.has(e.nivel_riesgo));

  if (eventosFiltrados.length === 0) return { nodes: [], edges: [] };

  // Obtener rango de timestamps
  const timestamps = eventosFiltrados.map((e) => new Date(e.timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const tsRange = maxTs - minTs || 1;

  // Asignar fila Y a cada archivo único
  const archivos = [...new Set(eventosFiltrados.map((e) => e.archivo))];
  const archivoFilaIdx = new Map<string, number>(archivos.map((a, i) => [a, i]));

  const nodes: Node[] = eventosFiltrados.map((evento) => {
    const ts = new Date(evento.timestamp).getTime();
    const x  = X_PADDING + ((ts - minTs) / tsRange) * X_SPAN;
    const y  = Y_PADDING + (archivoFilaIdx.get(evento.archivo) ?? 0) * (NODE_HEIGHT + 60);

    return {
      id:   evento.id,
      type: 'forensicNode',
      position: { x, y },
      data: { evento } satisfies ForensicNodeData,
    };
  });

  // Edges: conectar eventos del mismo archivo en orden cronológico
  const edges: Edge[] = [];
  archivos.forEach((archivo) => {
    const del_archivo = eventosFiltrados
      .filter((e) => e.archivo === archivo)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (let i = 0; i < del_archivo.length - 1; i++) {
      const src = del_archivo[i]!;
      const tgt = del_archivo[i + 1]!;
      edges.push({
        id:     `e-${src.id}-${tgt.id}`,
        source: src.id,
        target: tgt.id,
        animated: src.nivel_riesgo === 'CRÍTICO' || src.nivel_riesgo === 'ALTO',
        style: {
          stroke: CHIP_COLORS[src.nivel_riesgo]?.border ?? '#475569',
          strokeWidth: 1.5,
          opacity: 0.6,
        },
      });
    }
  });

  return { nodes, edges };
}

// ── Panel de detalle ──────────────────────────────────────────────────────
function DetailPanel({
  evento,
  onClose,
}: {
  evento: EventoTimeline;
  onClose: () => void;
}) {
  const config = CHIP_COLORS[evento.nivel_riesgo] ?? CHIP_COLORS.BAJO;
  const fecha  = new Date(evento.timestamp).toLocaleString('es-MX', {
    day:    '2-digit',
    month:  'short',
    year:   '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 320,
        background: '#1E1E20',
        border: `1px solid ${config.border}40`,
        borderRadius: 12,
        boxShadow: `0 0 24px ${config.bg}, 0 8px 24px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(8px)',
        padding: '20px 22px',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 900,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: config.text,
            background: config.bg,
            border: `1px solid ${config.border}`,
            borderRadius: 6,
            padding: '3px 8px',
          }}
        >
          {evento.nivel_riesgo}
        </span>
        <button
          onClick={onClose}
          style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Info rows */}
      {[
        { icon: FileCode,   label: 'Archivo', value: evento.archivo },
        { icon: GitCommit,  label: 'Commit',  value: evento.commit?.slice(0, 12) ?? '—' },
        { icon: User,       label: 'Autor',   value: evento.autor },
        { icon: Clock,      label: 'Fecha',   value: fecha },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
          <Icon size={13} color="#475569" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 9, color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
            <p style={{ fontSize: 11, color: '#E2E8F0', margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{value}</p>
          </div>
        </div>
      ))}

      {/* Función */}
      {evento.funcion && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
          <AlertCircle size={13} color="#475569" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 9, color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Función</p>
            <p style={{ fontSize: 11, color: '#E2E8F0', margin: 0, fontFamily: 'monospace' }}>{evento.funcion}()</p>
          </div>
        </div>
      )}

      {/* Mensaje commit */}
      <div
        style={{
          marginTop: 12,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 10,
          borderLeft: `2px solid ${config.border}`,
        }}
      >
        <p style={{ fontSize: 9, color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px 0' }}>Commit</p>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
          {evento.mensaje_commit}
        </p>
      </div>

      {/* Indicadores de sospecha */}
      {evento.indicadores_sospecha && evento.indicadores_sospecha.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 9, color: '#475569', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 0' }}>Indicadores</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {evento.indicadores_sospecha.map((ind) => (
              <span
                key={ind}
                style={{
                  fontSize: 9,
                  padding: '2px 7px',
                  background: 'rgba(255,59,59,0.08)',
                  border: '1px solid rgba(255,59,59,0.2)',
                  borderRadius: 4,
                  color: '#FF6B6B',
                  fontFamily: 'monospace',
                }}
              >
                {ind}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────
export default function ForensicTimeline({ eventos }: ForensicTimelineProps) {
  const [filtrosSeveridad, setFiltrosSeveridad] = useState<Set<NivelRiesgo>>(new Set());
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EventoTimeline | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => construirGrafo(eventos, filtrosSeveridad),
    [eventos, filtrosSeveridad]
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Recompute when filter changes
  const { nodes: computedNodes, edges: computedEdges } = useMemo(
    () => construirGrafo(eventos, filtrosSeveridad),
    [eventos, filtrosSeveridad]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const data = node.data as ForensicNodeData;
      setEventoSeleccionado((prev) =>
        prev?.id === data.evento.id ? null : data.evento
      );
    },
    []
  );

  const toggleSeveridad = (nivel: NivelRiesgo) => {
    setFiltrosSeveridad((prev) => {
      const next = new Set(prev);
      next.has(nivel) ? next.delete(nivel) : next.add(nivel);
      return next;
    });
    setEventoSeleccionado(null);
  };

  // Conteo por severidad para los chips
  const conteos = useMemo(() => {
    const map: Record<NivelRiesgo, number> = { CRÍTICO: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
    eventos.forEach((e) => { map[e.nivel_riesgo] = (map[e.nivel_riesgo] ?? 0) + 1; });
    return map;
  }, [eventos]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 580, position: 'relative' }}>
      <ReactFlow
        nodes={computedNodes}
        edges={computedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={3}
        style={{ background: '#111111' }}
        onPaneClick={() => setEventoSeleccionado(null)}
      >
        {/* Filtros de severidad */}
        <Panel position="top-left">
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 14px',
              background: 'rgba(30,30,32,0.92)',
              border: '1px solid #2D2D2D',
              borderRadius: 12,
              backdropFilter: 'blur(8px)',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                alignSelf: 'center',
                marginRight: 4,
              }}
            >
              Filtro
            </span>
            {SEVERITY_ORDER.map((nivel) => {
              const active = filtrosSeveridad.has(nivel);
              const c = CHIP_COLORS[nivel]!;
              return (
                <button
                  key={nivel}
                  onClick={() => toggleSeveridad(nivel)}
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '4px 10px',
                    borderRadius: 8,
                    border: `1px solid ${active ? c.border : '#374151'}`,
                    background: active ? c.bg : 'transparent',
                    color: active ? c.text : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {nivel} ({conteos[nivel]})
                </button>
              );
            })}
          </div>
        </Panel>

        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1F2937"
        />
        <Controls
          style={{
            background: '#0A0B10',
            border: '1px solid #1F2937',
            borderRadius: 12,
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as ForensicNodeData;
            return MINIMAP_COLORS[data?.evento?.nivel_riesgo] ?? '#475569';
          }}
          style={{
            background: '#0A0B10',
            border: '1px solid #1F2937',
            borderRadius: 12,
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
      </ReactFlow>

      {/* Panel de detalles en overlay */}
      <AnimatePresence>
        {eventoSeleccionado && (
          <DetailPanel
            evento={eventoSeleccionado}
            onClose={() => setEventoSeleccionado(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
