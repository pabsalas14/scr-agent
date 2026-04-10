/**
 * APTThreatsPanel - Visualización de amenazas APT detectadas
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Loader2,
  Shield,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { apiService } from '../../services/api.service';

export default function APTThreatsPanel() {
  const [threats, setThreats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  useEffect(() => {
    loadThreats();
  }, [filterLevel]);

  const loadThreats = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterLevel) params.append('threatLevel', filterLevel);

      const result = await apiService.get(`/detection/apt?${params.toString()}`);
      setThreats(result.data || []);
    } catch (error) {
      console.error('Error loading APT threats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#EF4444]" />
          APT Threats
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Amenazas de Advanced Persistent Threats detectadas
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

      {/* Threats List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
            <p className="text-[#6B7280]">Escaneando amenazas APT...</p>
          </div>
        ) : threats.length === 0 ? (
          <div className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-center">
            <p className="text-[#6B7280]">Sin amenazas APT detectadas</p>
          </div>
        ) : (
          threats.map((threat, idx) => (
            <motion.div
              key={threat.threatId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border ${getLevelColor(threat.threatLevel)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5" />
                    <h3 className="font-bold text-white">{threat.userEmail}</h3>
                  </div>
                  <p className="text-xs opacity-75">
                    Confianza: {threat.confidence}%
                  </p>
                </div>
              </div>

              {/* Indicators */}
              <div className="space-y-2 mb-3">
                {threat.indicators.slice(0, 3).map((ind: any, i: number) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <Eye className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-60" />
                    <div>
                      <p className="font-medium">{ind.type.replace(/_/g, ' ')}</p>
                      <p className="opacity-75">{ind.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Repos & Duration */}
              <div className="flex gap-4 text-xs opacity-75 pt-2 border-t border-current/20">
                <span>Repos: {threat.affectedRepos.length}</span>
                <span>
                  Duración: {threat.timeRange.durationDays}{' '}
                  {threat.timeRange.durationDays === 1 ? 'día' : 'días'}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
