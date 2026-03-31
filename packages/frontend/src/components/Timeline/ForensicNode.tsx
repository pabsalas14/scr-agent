/**
 * ============================================================================
 * COMPONENTE: ForensicNode
 * ============================================================================
 * Nodo custom para React Flow que representa un evento forense.
 * Visual: glassmorphism oscuro con indicador de severidad.
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitCommit, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import type { EventoTimeline } from '../../types/timeline';

const SEVERITY_CONFIG = {
  CRÍTICO: {
    border: '#EF4444',
    glow: 'rgba(239,68,68,0.25)',
    bg: 'rgba(239,68,68,0.08)',
    text: '#EF4444',
    icon: AlertCircle,
  },
  ALTO: {
    border: '#FB923C',
    glow: 'rgba(251,146,60,0.25)',
    bg: 'rgba(251,146,60,0.08)',
    text: '#FB923C',
    icon: AlertTriangle,
  },
  MEDIO: {
    border: '#EAB308',
    glow: 'rgba(234,179,8,0.2)',
    bg: 'rgba(234,179,8,0.06)',
    text: '#EAB308',
    icon: Info,
  },
  BAJO: {
    border: '#22C55E',
    glow: 'rgba(34,197,94,0.2)',
    bg: 'rgba(34,197,94,0.06)',
    text: '#22C55E',
    icon: CheckCircle,
  },
};

export interface ForensicNodeData extends Record<string, unknown> {
  evento: EventoTimeline;
  isSelected?: boolean;
}

function ForensicNode({ data, selected }: NodeProps) {
  const nodeData = data as ForensicNodeData;
  const { evento } = nodeData;
  const config = SEVERITY_CONFIG[evento.nivel_riesgo] ?? SEVERITY_CONFIG.BAJO;
  const Icon = config.icon;

  const fecha = new Date(evento.timestamp).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });

  const shortHash = evento.commit?.slice(0, 7) ?? '-------';
  const shortFile = evento.archivo?.split('/').pop() ?? evento.archivo ?? '';
  const shortFunc = (evento.funcion?.length ?? 0) > 20
    ? evento.funcion!.slice(0, 18) + '…'
    : evento.funcion ?? '';

  return (
    <div
      style={{
        background: selected
          ? `linear-gradient(135deg, ${config.bg}, rgba(255,255,255,0.05))`
          : config.bg,
        border: `1px solid ${selected ? config.border : config.border + '80'}`,
        boxShadow: selected
          ? `0 0 20px ${config.glow}, 0 4px 20px rgba(0,0,0,0.5)`
          : `0 0 8px ${config.glow}, 0 2px 10px rgba(0,0,0,0.4)`,
        backdropFilter: 'blur(12px)',
        borderRadius: '12px',
        padding: '10px 14px',
        minWidth: '180px',
        maxWidth: '220px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Handle izquierdo (entrada) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: config.border,
          width: 8,
          height: 8,
          border: '2px solid #111111',
        }}
      />

      {/* Header con severity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={13} color={config.text} />
        <span
          style={{
            fontSize: '9px',
            fontWeight: 900,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: config.text,
          }}
        >
          {evento.nivel_riesgo}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '8px',
            color: '#475569',
            fontFamily: 'monospace',
          }}
        >
          {fecha}
        </span>
      </div>

      {/* Archivo y función */}
      <div style={{ marginBottom: 4 }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#E2E8F0',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {shortFile}
        </p>
        {shortFunc && (
          <p
            style={{
              fontSize: '9px',
              color: '#64748B',
              margin: 0,
              fontFamily: 'monospace',
            }}
          >
            {shortFunc}()
          </p>
        )}
      </div>

      {/* Footer con commit + autor */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 5,
          marginTop: 2,
        }}
      >
        <GitCommit size={10} color="#475569" />
        <span
          style={{
            fontSize: '9px',
            color: '#475569',
            fontFamily: 'monospace',
            flex: 1,
          }}
        >
          {shortHash}
        </span>
        <span
          style={{
            fontSize: '9px',
            color: '#64748B',
            maxWidth: 70,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {evento.autor?.split(' ')[0] ?? ''}
        </span>
      </div>

      {/* Handle derecho (salida) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: config.border,
          width: 8,
          height: 8,
          border: '2px solid #111111',
        }}
      />
    </div>
  );
}

export default memo(ForensicNode);
