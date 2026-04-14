/**
 * FindingsTracker — Rediseño Premium Dark
 * Glassmorphism, sistema de colores coherente, cards compactas y densas.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, Eye, Edit2, Zap,
  Shield, Search, SlidersHorizontal, ChevronDown,
  User, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { findingsService } from '../../services/findings.service';
import { usersService } from '../../services/users.service';
import { Finding, FindingStatus, Severity } from '../../types/findings';
import FindingDetailModal from './FindingDetailModal';
import RemediationModal from './RemediationModal';
import { useSocketEvents } from '../../hooks/useSocketEvents';

interface FindingsTrackerProps {
  analysisId: string;
}

// ── Configs ───────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<FindingStatus, {
  label: string; color: string; bg: string; dot: string;
  icon: React.ElementType;
}> = {
  DETECTED:      { label: 'Detectado',      color: '#EF4444', bg: 'rgba(239,68,68,0.08)',    dot: '#EF4444', icon: AlertCircle },
  IN_REVIEW:     { label: 'En Revisión',    color: '#6366F1', bg: 'rgba(99,102,241,0.08)',   dot: '#6366F1', icon: Eye },
  IN_CORRECTION: { label: 'En Corrección',  color: '#EAB308', bg: 'rgba(234,179,8,0.08)',    dot: '#EAB308', icon: Edit2 },
  CORRECTED:     { label: 'Corregido',      color: '#F97316', bg: 'rgba(249,115,22,0.08)',   dot: '#F97316', icon: CheckCircle2 },
  VERIFIED:      { label: 'Verificado',     color: '#22C55E', bg: 'rgba(34,197,94,0.08)',    dot: '#22C55E', icon: CheckCircle2 },
  FALSE_POSITIVE:{ label: 'Falso Positivo', color: '#475569', bg: 'rgba(71,85,105,0.08)',    dot: '#475569', icon: AlertCircle },
  CLOSED:        { label: 'Cerrado',        color: '#334155', bg: 'rgba(51,65,85,0.08)',     dot: '#334155', icon: CheckCircle2 },
};

const SEV_CONFIG: Record<Severity, { label: string; color: string; border: string; bg: string }> = {
  CRITICAL: { label: 'CRÍTICO', color: '#EF4444', border: '#EF444460', bg: 'rgba(239,68,68,0.10)' },
  HIGH:     { label: 'ALTO',    color: '#FB923C', border: '#FB923C60', bg: 'rgba(251,146,60,0.10)' },
  MEDIUM:   { label: 'MEDIO',   color: '#EAB308', border: '#EAB30860', bg: 'rgba(234,179,8,0.08)' },
  LOW:      { label: 'BAJO',    color: '#22C55E', border: '#22C55E60', bg: 'rgba(34,197,94,0.08)' },
};

// ── Componente principal ──────────────────────────────────────────────────
export default function FindingsTracker({ analysisId }: FindingsTrackerProps) {
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterStatus, setFilterStatus]   = useState<FindingStatus | 'ALL'>('ALL');
  const [filterSeverity, setFilterSev]    = useState<Severity | 'ALL'>('ALL');
  const [selectedFinding, setSelected]    = useState<Finding | null>(null);
  const [remediationFinding, setRemediation] = useState<Finding | null>(null);
  const [page, setPage]                   = useState(1);
  const PAGE_SIZE = 15;

  const { data: findings = [], isLoading, refetch } = useQuery({
    queryKey: ['findings', analysisId],
    queryFn: () => findingsService.getFindings(analysisId),
    refetchInterval: 5000,
  });

  const { data: analysts = [] } = useQuery({
    queryKey: ['analysts'],
    queryFn: () => usersService.getUsersByRole('ANALYST'),
  });

  useSocketEvents({
    onFindingUpdated:     () => refetch(),
    onFindingAssigned:    () => refetch(),
    onRemediationUpdated: () => refetch(),
    onRemediationVerified:() => refetch(),
  });

  // Filtros
  const filtered = findings.filter((f) => {
    const latest = f.statusHistory?.[0]?.status || 'DETECTED';
    return (
      (searchTerm === '' || f.file.toLowerCase().includes(searchTerm.toLowerCase()) || f.whySuspicious.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterStatus   === 'ALL' || latest === filterStatus) &&
      (filterSeverity === 'ALL' || f.severity === filterSeverity)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedFiltered = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Stats
  const total    = filtered.length;
  const critical = filtered.filter((f) => f.severity === 'CRITICAL').length;
  const inProg   = filtered.filter((f) => ['IN_REVIEW','IN_CORRECTION'].includes(f.statusHistory?.[0]?.status || '')).length;
  const remedied = filtered.filter((f) => ['VERIFIED','CLOSED'].includes(f.statusHistory?.[0]?.status || '')).length;

  const STATS = [
    { label: 'Total',       value: total,    color: '#F97316', Icon: Shield },
    { label: 'Críticos',    value: critical, color: '#EF4444', Icon: AlertCircle },
    { label: 'En Progreso', value: inProg,   color: '#EAB308', Icon: Clock },
    { label: 'Remediados',  value: remedied, color: '#22C55E', Icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6 p-2">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div
          style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Zap size={20} color="#F97316" />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', letterSpacing: '-0.03em', margin: 0 }}>
            Visor IR
          </h2>
          <p style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Ciclo de vida de vulnerabilidades
          </p>
        </div>
      </div>

      {/* ── Mini KPIs ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATS.map(({ label, value, color, Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: `linear-gradient(135deg, ${color}0D, transparent)`,
              border: `1px solid ${color}28`,
              borderRadius: 16,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: `${color}18`,
              border: `1px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={15} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 900, color: '#F1F5F9', margin: 0, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>{label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filtros ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
          background: '#1E1E20', border: '1px solid #2D2D2D',
          borderRadius: 16, padding: '12px 14px',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#3D4A5C" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar archivo o descripción..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              background: '#242424', border: '1px solid #2D2D2D',
              borderRadius: 10, fontSize: 11, color: '#CBD5E1',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Status */}
        <div style={{ position: 'relative' }}>
          <SlidersHorizontal size={13} color="#3D4A5C" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value as FindingStatus | 'ALL'); setPage(1); }}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 30, paddingTop: 9, paddingBottom: 9,
              background: '#242424', border: '1px solid #2D2D2D',
              borderRadius: 10, fontSize: 11, color: '#CBD5E1',
              outline: 'none', appearance: 'none', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{ background: '#1C1C1E' }}>Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([k, c]) => (
              <option key={k} value={k} style={{ background: '#1C1C1E' }}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={12} color="#3D4A5C" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>

        {/* Severity */}
        <div style={{ position: 'relative' }}>
          <AlertCircle size={13} color="#3D4A5C" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSev(e.target.value as Severity | 'ALL'); setPage(1); }}
            style={{
              width: '100%', paddingLeft: 34, paddingRight: 30, paddingTop: 9, paddingBottom: 9,
              background: '#242424', border: '1px solid #2D2D2D',
              borderRadius: 10, fontSize: 11, color: '#CBD5E1',
              outline: 'none', appearance: 'none', fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{ background: '#1C1C1E' }}>Todas las severidades</option>
            {Object.entries(SEV_CONFIG).map(([k, c]) => (
              <option key={k} value={k} style={{ background: '#1C1C1E' }}>{c.label}</option>
            ))}
          </select>
          <ChevronDown size={12} color="#3D4A5C" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {/* ── Active Filters Chips ──────────────────────────────────── */}
      {(filterStatus !== 'ALL' || filterSeverity !== 'ALL' || searchTerm !== '') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Filtros activos:
          </span>
          <AnimatePresence>
            {searchTerm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
                  borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#F97316',
                }}
              >
                Búsqueda: "{searchTerm}"
                <button
                  onClick={() => { setSearchTerm(''); setPage(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#F97316', fontSize: 14 }}
                >
                  ×
                </button>
              </motion.div>
            )}
            {filterStatus !== 'ALL' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: `${STATUS_CONFIG[filterStatus as FindingStatus].color}20`,
                  border: `1px solid ${STATUS_CONFIG[filterStatus as FindingStatus].color}40`,
                  borderRadius: 8, padding: '4px 10px', fontSize: 11,
                  color: STATUS_CONFIG[filterStatus as FindingStatus].color,
                }}
              >
                Estado: {STATUS_CONFIG[filterStatus as FindingStatus].label}
                <button
                  onClick={() => { setFilterStatus('ALL'); setPage(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: 14 }}
                >
                  ×
                </button>
              </motion.div>
            )}
            {filterSeverity !== 'ALL' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: `${SEV_CONFIG[filterSeverity as Severity].color}20`,
                  border: `1px solid ${SEV_CONFIG[filterSeverity as Severity].color}40`,
                  borderRadius: 8, padding: '4px 10px', fontSize: 11,
                  color: SEV_CONFIG[filterSeverity as Severity].color,
                }}
              >
                Severidad: {SEV_CONFIG[filterSeverity as Severity].label}
                <button
                  onClick={() => { setFilterSev('ALL'); setPage(1); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', fontSize: 14 }}
                >
                  ×
                </button>
              </motion.div>
            )}
            {(filterStatus !== 'ALL' || filterSeverity !== 'ALL' || searchTerm !== '') && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => { setFilterStatus('ALL'); setFilterSev('ALL'); setSearchTerm(''); setPage(1); }}
                style={{
                  background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.3)',
                  borderRadius: 8, padding: '4px 10px', fontSize: 11, color: '#6B7280',
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                Limpiar todo
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Findings list ────────────────────────────────────────── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Zap size={32} color="#FFD600" style={{ margin: '0 auto 12px', opacity: 0.5 }} className="animate-pulse" />
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Cargando hallazgos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Shield size={32} color="#1F2937" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#475569', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Sin resultados</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => {
            const group = paginatedFiltered.filter(
              (f) => (f.statusHistory?.[0]?.status || 'DETECTED') === (statusKey as FindingStatus)
            );
            if (group.length === 0) return null;
            const StatusIcon = cfg.icon;

            return (
              <motion.div key={statusKey} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                {/* Group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 6, paddingLeft: 2,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }} />
                  <span style={{ fontSize: 10, fontWeight: 900, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    {cfg.label}
                  </span>
                  <div style={{
                    fontSize: 9, fontWeight: 900, color: cfg.color,
                    background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`,
                    borderRadius: 6, padding: '1px 7px', letterSpacing: '0.1em',
                  }}>
                    {group.length}
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.map((finding, idx) => {
                    const sev = SEV_CONFIG[finding.severity];
                    return (
                      <motion.div
                        key={finding.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        onClick={() => setSelected(finding)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px',
                          background: '#1E1E20',
                          border: '1px solid #2D2D2D',
                          borderLeft: `3px solid ${sev.color}`,
                          borderRadius: 12,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        whileHover={{
                          background: '#242424',
                          borderColor: `${sev.color}50`,
                          x: 2,
                        }}
                      >
                        {/* Severity badge */}
                        <div style={{
                          flexShrink: 0, padding: '2px 7px',
                          background: sev.bg, border: `1px solid ${sev.border}`,
                          borderRadius: 6,
                          fontSize: 8, fontWeight: 900, color: sev.color,
                          letterSpacing: '0.12em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>
                          {sev.label}
                        </div>

                        {/* Main info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace' }}>
                              {finding.file.split('/').pop()}
                            </span>
                            {finding.function && (
                              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>
                                {finding.function}()
                              </span>
                            )}
                          </div>
                          <p style={{
                            fontSize: 11, color: '#64748B', margin: '2px 0 0',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}>
                            {finding.whySuspicious}
                          </p>
                        </div>

                        {/* Right side */}
                        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {finding.assignment && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={10} color="#475569" />
                              <span style={{ fontSize: 10, color: '#475569' }}>
                                {finding.assignment.assignedUser?.name?.split(' ')[0] || '—'}
                              </span>
                            </div>
                          )}
                          <Eye size={13} color="#1F2937" style={{ transition: 'color 0.15s' }} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-[#2D2D2D]">
          <span className="text-xs text-[#6B7280]">
            Página {page} de {totalPages} — {filtered.length} hallazgos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-xs text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-xs text-[#A0A0A0] hover:border-[#F97316]/40 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          analysts={analysts}
          onClose={() => setSelected(null)}
          onStatusChange={() => { setSelected(null); refetch(); }}
        />
      )}
      {remediationFinding && (
        <RemediationModal
          finding={remediationFinding}
          onClose={() => setRemediation(null)}
          onSave={() => { setRemediation(null); refetch(); }}
        />
      )}
    </div>
  );
}
