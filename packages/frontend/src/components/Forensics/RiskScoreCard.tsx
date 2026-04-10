/**
 * RiskScoreCard - Tarjeta de risk score avanzado
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react';
import { userSearchService } from '../../services/user-search.service';

interface RiskScoreCardProps {
  userId: string;
}

export default function RiskScoreCard({ userId }: RiskScoreCardProps) {
  const [score, setScore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRiskScore();
  }, [userId]);

  const loadRiskScore = async () => {
    try {
      setIsLoading(true);
      const data = await userSearchService.getAdvancedRiskScore(userId);
      setScore(data);
    } catch (error) {
      console.error('Error loading risk score:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#F97316] mx-auto" />
      </div>
    );
  }

  if (!score) return null;

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing')
      return <TrendingUp className="w-4 h-4 text-[#EF4444]" />;
    if (trend === 'decreasing')
      return <TrendingDown className="w-4 h-4 text-[#22C55E]" />;
    return <Minus className="w-4 h-4 text-[#6B7280]" />;
  };

  const getScoreColor = (s: number) => {
    if (s < 25) return 'text-[#22C55E]';
    if (s < 50) return 'text-[#EAB308]';
    if (s < 75) return 'text-[#F97316]';
    return 'text-[#EF4444]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-6 rounded-lg border ${
        score.score > 75
          ? 'bg-[#EF4444]/5 border-[#EF4444]/20'
          : 'bg-[#1C1C1E] border-[#2D2D2D]'
      }`}
    >
      <h3 className="text-lg font-bold text-white mb-4">Risk Score Avanzado</h3>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm text-[#6B7280] mb-2">Score</p>
          <p className={`text-4xl font-bold ${getScoreColor(score.score)}`}>
            {score.score}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">{score.level}</p>
        </div>

        <div>
          <p className="text-sm text-[#6B7280] mb-2">Tendencia</p>
          <div className="flex items-center gap-2">
            {getTrendIcon(score.trend)}
            <span className="text-white font-medium">
              {score.trend === 'increasing'
                ? 'Aumentando'
                : score.trend === 'decreasing'
                  ? 'Disminuyendo'
                  : 'Estable'}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1">
            {score.trendChange > 0 ? '+' : ''}{score.trendChange}%
          </p>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-2">
        <p className="text-xs text-[#6B7280] font-medium mb-3">Factores</p>

        {Object.entries(score.factors).map(([key, value]: [string, any]) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-[#6B7280] capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="text-xs text-white font-medium">{value}</span>
            </div>
            <div className="w-full h-1.5 bg-[#0F0F0F] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-[#F97316]"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 rounded bg-[#0F0F0F] border border-[#2D2D2D]">
        <p className="text-xs text-[#6B7280]">
          Percentil: <span className="text-white font-medium">{score.percentile}%</span>
        </p>
      </div>
    </motion.div>
  );
}
