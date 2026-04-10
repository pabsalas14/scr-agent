/**
 * BusinessLogicAlertsPanel - Alertas de Business Logic Attacks
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  Zap,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { apiService } from '../../services/api.service';

export default function BusinessLogicAlertsPanel() {
  const [attacks, setAttacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  useEffect(() => {
    loadAttacks();
  }, [filterLevel]);

  const loadAttacks = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterLevel) params.append('riskLevel', filterLevel);

      const result = await apiService.get(`/detection/bla?${params.toString()}`);
      setAttacks(result.data || []);
    } catch (error) {
      console.error('Error loading BLA attacks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
      case 'HIGH':
        return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
      case 'MEDIUM':
        return 'bg-[#EAB308]/10 text-[#EAB308] border-[#EAB308]/20';
      default:
        return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
    }
  };

  const getAnomalyIcon = (type: string) => {
    if (type.includes('PERMISSION')) return '🔑';
    if (type.includes('TIMEBOMB')) return '💣';
    if (type.includes('VALIDATION')) return '⚠️';
    if (type.includes('GIT')) return '📝';
    if (type.includes('AUTH')) return '🔐';
    return '⚡';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#F97316]" />
          Business Logic Attacks
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Ataques de lógica de negocio detectados
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterLevel(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            !filterLevel
              ? 'bg-[#F97316] text-white'
              : 'bg-[#2D2D2D] text-[#6B7280]'
          }`}
        >
          Todas
        </button>
        {['CRITICAL', 'HIGH', 'MEDIUM'].map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filterLevel === level
                ? 'bg-[#F97316] text-white'
                : 'bg-[#2D2D2D] text-[#6B7280]'
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
            <p className="text-[#6B7280]">Escaneando ataques de lógica...</p>
          </div>
        ) : attacks.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-center">
            <CheckCircle2 className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
            <p className="text-[#6B7280]">Sin ataques de lógica detectados</p>
          </div>
        ) : (
          attacks.map((attack, idx) => (
            <motion.div
              key={attack.attackId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border ${getRiskColor(attack.riskLevel)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5" />
                    <h3 className="font-bold text-white">{attack.userEmail}</h3>
                  </div>
                  <p className="text-xs opacity-75">
                    Confianza: {attack.confidence}% • {attack.anomalies.length} anomalías
                  </p>
                </div>
              </div>

              {/* Anomalies */}
              <div className="space-y-2 mb-4">
                {attack.anomalies.slice(0, 3).map((anom: any, i: number) => (
                  <div
                    key={i}
                    className="text-xs bg-black/30 rounded p-2 flex gap-2 items-start"
                  >
                    <span className="text-sm flex-shrink-0">
                      {getAnomalyIcon(anom.type)}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{anom.type.replace(/_/g, ' ')}</p>
                      <p className="opacity-75">{anom.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {attack.recommendations && (
                <div className="text-xs border-t border-current/20 pt-2 opacity-75">
                  <p className="font-medium mb-1">Acciones:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {attack.recommendations.slice(0, 2).map((rec: string, i: number) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
