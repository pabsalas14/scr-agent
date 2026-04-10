/**
 * ============================================================================
 * COMPARISON PANEL - Panel de comparación de análisis/usuarios
 * ============================================================================
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { comparisonService } from '../../services/comparison.service';

type ComparisonType = 'users' | 'analyses' | 'periods' | 'projects';

interface ComparisonPanelProps {
  type: ComparisonType;
  id1: string;
  id2?: string;
}

export const ComparisonPanel: React.FC<ComparisonPanelProps> = ({ type, id1, id2 }) => {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    loadComparison();
  }, [type, id1, id2]);

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (type) {
        case 'users':
          if (id2) result = await comparisonService.compareUsers(id1, id2);
          break;
        case 'analyses':
          if (id2) result = await comparisonService.compareAnalyses(id1, id2);
          break;
        case 'periods':
          result = await comparisonService.comparePeriods(id1);
          break;
        case 'projects':
          if (id2) result = await comparisonService.compareProjects(id1, id2);
          break;
      }
      setComparison(result);
    } catch (err: any) {
      setError(err.message || 'Error loading comparison');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (diff: number) => {
    if (diff > 0) {
      return <TrendingUp size={16} className="text-red-600" />;
    } else if (diff < 0) {
      return <TrendingDown size={16} className="text-green-600" />;
    }
    return null;
  };

  const renderUserComparison = () => {
    if (!comparison?.stats || comparison.stats.length < 2) return null;

    const [user1Stats, user2Stats] = comparison.stats;
    const { riskScoreDiff, commitsDiff, suspiciousDiff } = comparison.differences;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* User 1 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-200 mb-3">
              {comparison.users[0].name}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 ml-2">{user1Stats.riskScore}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Commits:</span>
                <span className="font-bold ml-2">{user1Stats.totalCommits}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Suspicious:</span>
                <span className="font-bold text-red-600 ml-2">{user1Stats.suspiciousCommits}</span>
              </p>
            </div>
          </div>

          {/* User 2 */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
            <h4 className="font-medium text-sm text-orange-900 dark:text-orange-200 mb-3">
              {comparison.users[1].name}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Risk Score:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 ml-2">{user2Stats.riskScore}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Commits:</span>
                <span className="font-bold ml-2">{user2Stats.totalCommits}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Suspicious:</span>
                <span className="font-bold text-red-600 ml-2">{user2Stats.suspiciousCommits}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Differences */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-sm text-gray-900 dark:text-white mb-3">Differences</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Risk Score Difference</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(riskScoreDiff)}
                <span className={riskScoreDiff > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {riskScoreDiff > 0 ? '+' : ''}{riskScoreDiff}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Commits Difference</span>
              <span className="font-bold">{commitsDiff > 0 ? '+' : ''}{commitsDiff}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Suspicious Commits Difference</span>
              <span className="font-bold text-red-600">{suspiciousDiff > 0 ? '+' : ''}{suspiciousDiff}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysisComparison = () => {
    if (!comparison?.stats || comparison.stats.length < 2) return null;

    const [analysis1Stats, analysis2Stats] = comparison.stats;
    const { findingsDiff, criticalDiff, highDiff } = comparison.differences;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Analysis 1 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-200 mb-3">
              {comparison.analyses[0].projectName}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Findings:</span>
                <span className="font-bold ml-2">{analysis1Stats.totalFindings}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Critical:</span>
                <span className="font-bold text-red-600 ml-2">{analysis1Stats.criticalFindings}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">High:</span>
                <span className="font-bold text-orange-600 ml-2">{analysis1Stats.highFindings}</span>
              </p>
            </div>
          </div>

          {/* Analysis 2 */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
            <h4 className="font-medium text-sm text-orange-900 dark:text-orange-200 mb-3">
              {comparison.analyses[1].projectName}
            </h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Findings:</span>
                <span className="font-bold ml-2">{analysis2Stats.totalFindings}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">Critical:</span>
                <span className="font-bold text-red-600 ml-2">{analysis2Stats.criticalFindings}</span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="text-gray-600 dark:text-gray-400">High:</span>
                <span className="font-bold text-orange-600 ml-2">{analysis2Stats.highFindings}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Differences */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-sm text-gray-900 dark:text-white mb-3">Differences</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Findings</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(findingsDiff)}
                <span className={findingsDiff > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                  {findingsDiff > 0 ? '+' : ''}{findingsDiff}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Critical Findings</span>
              <span className="font-bold text-red-600">{criticalDiff > 0 ? '+' : ''}{criticalDiff}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">High Findings</span>
              <span className="font-bold text-orange-600">{highDiff > 0 ? '+' : ''}{highDiff}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ArrowRight size={20} />
        {type.charAt(0).toUpperCase() + type.slice(1)} Comparison
      </h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <>
          {type === 'users' && renderUserComparison()}
          {type === 'analyses' && renderAnalysisComparison()}
          {type === 'periods' && <p className="text-gray-600 dark:text-gray-400 text-sm">Period comparison data</p>}
          {type === 'projects' && <p className="text-gray-600 dark:text-gray-400 text-sm">Project comparison data</p>}
        </>
      )}
    </motion.div>
  );
};
