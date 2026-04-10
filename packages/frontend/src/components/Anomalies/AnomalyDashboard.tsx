import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { DetectedAnomaly } from '../../services/anomaly-detection.service';

interface AnomalyDashboardProps {
  anomalies: DetectedAnomaly[];
  isLoading?: boolean;
  onAnomalySelect?: (anomaly: DetectedAnomaly) => void;
  className?: string;
}

const severityConfig = {
  low: { color: '#22C55E', bgColor: 'bg-[#22C55E]/10', textColor: 'text-[#22C55E]', label: 'Baja' },
  medium: { color: '#EAB308', bgColor: 'bg-[#EAB308]/10', textColor: 'text-[#EAB308]', label: 'Media' },
  high: { color: '#FB923C', bgColor: 'bg-[#FB923C]/10', textColor: 'text-[#FB923C]', label: 'Alta' },
  critical: { color: '#EF4444', bgColor: 'bg-[#EF4444]/10', textColor: 'text-[#EF4444]', label: 'Crítica' },
};

export function AnomalyDashboard({
  anomalies,
  isLoading = false,
  onAnomalySelect,
  className = '',
}: AnomalyDashboardProps) {
  const [selectedAnomaly, setSelectedAnomaly] = useState<DetectedAnomaly | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  const filtered = filterSeverity
    ? anomalies.filter((a) => a.severity === filterSeverity)
    : anomalies;

  const stats = {
    total: anomalies.length,
    critical: anomalies.filter((a) => a.severity === 'critical').length,
    high: anomalies.filter((a) => a.severity === 'high').length,
    avgConfidence:
      anomalies.length > 0
        ? (anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length * 100).toFixed(1)
        : 0,
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-[#242424] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (anomalies.length === 0) {
    return (
      <div className={`p-8 text-center rounded-lg border border-dashed border-[#2D2D2D] ${className}`}>
        <Zap className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-50" />
        <p className="text-sm text-[#6B7280]">No se detectaron anomalías</p>
        <p className="text-xs text-[#6B7280] mt-2">El sistema está funcionando dentro de los parámetros normales</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#EF4444] font-semibold uppercase tracking-wider mb-1">Críticas</p>
          <p className="text-2xl font-bold text-[#EF4444]">{stats.critical}</p>
        </div>
        <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#FB923C] font-semibold uppercase tracking-wider mb-1">Altas</p>
          <p className="text-2xl font-bold text-[#FB923C]">{stats.high}</p>
        </div>
        <div className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D]">
          <p className="text-xs text-[#F97316] font-semibold uppercase tracking-wider mb-1">Confianza Avg</p>
          <p className="text-2xl font-bold text-[#F97316]">{stats.avgConfidence}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSeverity(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === null
              ? 'bg-[#F97316] text-white'
              : 'bg-[#242424] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
          }`}
        >
          Todas ({anomalies.length})
        </button>
        {Object.entries(severityConfig).map(([severity, config]) => {
          const count = anomalies.filter((a) => a.severity === severity).length;
          return (
            <button
              key={severity}
              onClick={() => setFilterSeverity(severity)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterSeverity === severity
                  ? `${config.bgColor} ${config.textColor} border border-[${config.color}]`
                  : 'bg-[#242424] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Anomalies List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((anomaly, index) => {
            const config = severityConfig[anomaly.severity];
            return (
              <motion.div
                key={anomaly.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  setSelectedAnomaly(anomaly);
                  onAnomalySelect?.(anomaly);
                }}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-[#F97316] ${config.bgColor} border-[${config.color}]`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <AlertTriangle className={`w-5 h-5 ${config.textColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white mb-1">{anomaly.metric}</p>
                      <p className="text-xs text-[#A0A0A0]">{anomaly.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${config.textColor}`}>{config.label}</p>
                    <p className="text-xs text-[#6B7280]">{(anomaly.confidence * 100).toFixed(0)}% confianza</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#1E1E20] rounded p-2 border border-[#2D2D2D]">
                    <p className="text-[#6B7280] mb-1">Valor Actual</p>
                    <p className="text-white font-semibold">{anomaly.value.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#1E1E20] rounded p-2 border border-[#2D2D2D]">
                    <p className="text-[#6B7280] mb-1">Rango Esperado</p>
                    <p className="text-white font-semibold">
                      {anomaly.expectedRange[0].toFixed(2)} - {anomaly.expectedRange[1].toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-[#1E1E20] rounded p-2 border border-[#2D2D2D]">
                    <p className="text-[#6B7280] mb-1">Desviación</p>
                    <p className="text-white font-semibold">
                      {(
                        ((anomaly.value - (anomaly.expectedRange[0] + anomaly.expectedRange[1]) / 2) /
                          ((anomaly.expectedRange[1] - anomaly.expectedRange[0]) / 2)) *
                        100
                      ).toFixed(0)}
                      %
                    </p>
                  </div>
                </div>

                {/* Trend Indicator */}
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {anomaly.value > anomaly.expectedRange[1] ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-[#EF4444]" />
                      <span className="text-[#EF4444]">Valor elevado</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-[#22C55E]" />
                      <span className="text-[#22C55E]">Valor bajo</span>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Detail View */}
      {selectedAnomaly && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] space-y-3"
        >
          <p className="text-sm font-semibold text-white">Detalles de la Anomalía</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[#6B7280] mb-1">Métrica</p>
              <p className="text-white font-semibold">{selectedAnomaly.metric}</p>
            </div>
            <div>
              <p className="text-[#6B7280] mb-1">Timestamp</p>
              <p className="text-white font-semibold">{selectedAnomaly.timestamp.toLocaleString('es-ES')}</p>
            </div>
            <div>
              <p className="text-[#6B7280] mb-1">Severidad</p>
              <p className={`font-semibold ${severityConfig[selectedAnomaly.severity].textColor}`}>
                {severityConfig[selectedAnomaly.severity].label}
              </p>
            </div>
            <div>
              <p className="text-[#6B7280] mb-1">Confianza</p>
              <p className="text-white font-semibold">{(selectedAnomaly.confidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
