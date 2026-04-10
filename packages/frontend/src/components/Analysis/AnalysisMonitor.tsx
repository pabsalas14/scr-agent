/**
 * AnalysisMonitor - Monitor active analyses in real-time
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play } from 'lucide-react';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { analysesService, Analysis } from '../../services/analyses.service';
import { useToast } from '../../hooks/useToast';
import AnalysisProgress from './AnalysisProgress';

interface AnalysisMonitorProps {
  projectId?: string;
  onAnalysisComplete?: (analysis: Analysis) => void;
  onAnalysisError?: (analysis: Analysis) => void;
}

export default function AnalysisMonitor({
  projectId,
  onAnalysisComplete,
  onAnalysisError,
}: AnalysisMonitorProps) {
  const [activeAnalyses, setActiveAnalyses] = useState<Map<string, Analysis>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // Load initial active analyses
  useEffect(() => {
    loadActiveAnalyses();
    const interval = setInterval(loadActiveAnalyses, 10000); // Poll every 10 seconds as fallback
    return () => clearInterval(interval);
  }, [projectId]);

  const loadActiveAnalyses = async () => {
    try {
      const analyses = await analysesService.getActiveAnalyses();
      const map = new Map<string, Analysis>();
      analyses.forEach((analysis) => {
        // Only include analyses that are running or in a terminal state (not PENDING)
        if (
          (analysis.status === 'RUNNING' ||
            analysis.status === 'COMPLETED' ||
            analysis.status === 'FAILED' ||
            analysis.status === 'CANCELLED') &&
          (!projectId || analysis.projectId === projectId)
        ) {
          map.set(analysis.id, analysis);
        }
      });
      setActiveAnalyses(map);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading active analyses:', error);
      setIsLoading(false);
    }
  };

  // Listen to real-time analysis events
  useSocketEvents({
    onAnalysisStatusChanged: (data) => {
      setActiveAnalyses((prev) => {
        const updated = new Map(prev);
        if (updated.has(data.analysisId)) {
          const analysis = updated.get(data.analysisId)!;
          updated.set(data.analysisId, {
            ...analysis,
            status: data.newStatus as any,
            progress: data.progress,
            updatedAt: data.timestamp,
          });
        }
        return updated;
      });
    },
    onAnalysisFindingsDiscovered: (data) => {
      setActiveAnalyses((prev) => {
        const updated = new Map(prev);
        if (updated.has(data.analysisId)) {
          const analysis = updated.get(data.analysisId)!;
          updated.set(data.analysisId, {
            ...analysis,
            findingCount: data.findingCount,
            updatedAt: data.timestamp,
          });
        }
        return updated;
      });
    },
    onAnalysisCompleted: (data) => {
      const analysis = activeAnalyses.get(data.analysisId);
      if (analysis) {
        setActiveAnalyses((prev) => {
          const updated = new Map(prev);
          const completed = {
            ...analysis,
            status: 'COMPLETED' as const,
            progress: 100,
            endTime: data.timestamp,
            updatedAt: data.timestamp,
          };
          updated.set(data.analysisId, completed);
          return updated;
        });

        toast.success(`✓ Análisis completado: ${analysis.projectName}`);
        onAnalysisComplete?.(analysis);
      }
    },
    onAnalysisError: (data) => {
      const analysis = activeAnalyses.get(data.analysisId);
      if (analysis) {
        setActiveAnalyses((prev) => {
          const updated = new Map(prev);
          const failed = {
            ...analysis,
            status: 'FAILED' as const,
            errorMessage: data.errorMessage,
            endTime: data.timestamp,
            updatedAt: data.timestamp,
          };
          updated.set(data.analysisId, failed);
          return updated;
        });

        toast.error(`✗ Análisis fallido: ${analysis.projectName} - ${data.errorMessage}`);
        onAnalysisError?.(analysis);
      }
    },
  });

  const handleCancel = async (analysisId: string) => {
    try {
      await analysesService.cancelAnalysis(analysisId);
      setActiveAnalyses((prev) => {
        const updated = new Map(prev);
        const analysis = updated.get(analysisId);
        if (analysis) {
          updated.set(analysisId, {
            ...analysis,
            status: 'CANCELLED' as const,
          });
        }
        return updated;
      });
      toast.info('Análisis cancelado');
    } catch (error) {
      toast.error('Error al cancelar análisis');
      console.error('Error cancelling analysis:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-5 h-5 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
      </div>
    );
  }

  if (activeAnalyses.size === 0) {
    return (
      <div className="p-8 text-center rounded-lg border border-dashed border-[#2D2D2D]">
        <Zap className="w-8 h-8 text-[#6B7280] mx-auto mb-2 opacity-50" />
        <p className="text-sm text-[#6B7280]">Sin análisis en progreso</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-4 h-4 text-[#F97316]" />
        <h3 className="text-sm font-semibold text-white">
          Análisis en Progreso ({activeAnalyses.size})
        </h3>
      </div>

      <AnimatePresence mode="popLayout">
        {Array.from(activeAnalyses.values()).map((analysis) => (
          <motion.div
            key={analysis.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AnalysisProgress
              analysisId={analysis.id}
              projectName={analysis.projectName || 'Análisis'}
              isActive={analysis.status === 'RUNNING'}
              progress={analysis.progress}
              status={
                analysis.status === 'PENDING'
                  ? 'RUNNING'
                  : (analysis.status as 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED')
              }
              startTime={analysis.startTime ? new Date(analysis.startTime) : undefined}
              estimatedTime={analysis.estimatedDuration}
              onCancel={handleCancel}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
