/**
 * TimelineVisualization - Visualización interactiva de timeline
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { timelineService } from '../../services/timeline.service';

interface TimelineVisualizationProps {
  analysisId?: string;
  userId?: string;
  type?: 'analysis' | 'user' | 'remediation';
}

export default function TimelineVisualization({
  analysisId,
  userId,
  type = 'analysis',
}: TimelineVisualizationProps) {
  const [timeline, setTimeline] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, [analysisId, userId, type]);

  const loadTimeline = async () => {
    try {
      setIsLoading(true);
      let data;

      if (type === 'analysis' && analysisId) {
        data = await timelineService.getAnalysisTimeline(analysisId);
      } else if (type === 'user' && userId) {
        data = await timelineService.getUserActivityTimeline(userId, { limit: 100 });
      } else if (type === 'remediation') {
        data = await timelineService.getRemediationTimeline({ limit: 50 });
      }

      setTimeline(data);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-[#EF4444] text-white';
      case 'HIGH':
        return 'bg-[#F97316] text-white';
      case 'MEDIUM':
        return 'bg-[#EAB308] text-black';
      case 'LOW':
        return 'bg-[#22C55E] text-white';
      default:
        return 'bg-[#6B7280] text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
        <p className="text-[#6B7280]">Cargando timeline...</p>
      </div>
    );
  }

  if (!timeline) {
    return (
      <div className="text-center py-10 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg">
        <AlertCircle className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
        <p className="text-[#6B7280]">Sin datos de timeline</p>
      </div>
    );
  }

  const timelineData = timeline.timeline || timeline.data || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#F97316]" />
          Timeline
        </h3>
        {timeline.summary && (
          <div className="flex gap-4 text-xs text-[#6B7280]">
            <span>
              Eventos: <span className="text-white font-medium">{timeline.summary.totalEvents}</span>
            </span>
            <span>
              Críticos: <span className="text-[#EF4444] font-medium">{timeline.summary.criticalCount}</span>
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {timelineData.map((group: any, idx: number) => (
          <motion.div
            key={group.date || idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            {/* Date Header */}
            <button
              onClick={() =>
                setExpandedDate(expandedDate === group.date ? null : group.date)
              }
              className="w-full p-3 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] hover:border-[#F97316]/50 transition-all text-left"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-white">
                  {new Date(group.date).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className="flex gap-2 items-center">
                  <span className="text-xs text-[#6B7280]">
                    {group.eventCount || group.events?.length} evento
                    {(group.eventCount || group.events?.length) !== 1 ? 's' : ''}
                  </span>
                  <Clock className="w-4 h-4 text-[#6B7280]" />
                </div>
              </div>
            </button>

            {/* Expanded Events */}
            {expandedDate === group.date && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 ml-4 pl-4 border-l border-[#F97316]/30 space-y-2"
              >
                {(group.events || []).map((event: any, eventIdx: number) => (
                  <motion.div
                    key={event.id || eventIdx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: eventIdx * 0.05 }}
                    className="p-3 rounded bg-[#0F0F0F] border border-[#2D2D2D]"
                  >
                    <div className="flex gap-2 items-start">
                      {event.severity ? (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getSeverityColor(
                            event.severity
                          )}`}
                        >
                          {event.severity}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{event.title}</p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {event.description}
                        </p>
                        {event.metadata?.file && (
                          <p className="text-xs text-[#6B7280] mt-1">
                            📄 {event.metadata.file}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
