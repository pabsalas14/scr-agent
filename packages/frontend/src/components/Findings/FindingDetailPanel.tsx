/**
 * FindingDetailPanel Component
 * Detail drawer with 5 tabs: Details, Lifecycle, Remediation, Investigation, Audit
 * Uses DetailDrawer component for slide-in animation
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Code,
  BookOpen,
  CheckCircle,
  FileText,
} from 'lucide-react';
import DetailDrawer from '../ui/DetailDrawer';
import { apiService } from '../../services/api.service';
import LoadingSpinner from '../ui/LoadingSpinner';

interface Tab {
  id: 'details' | 'lifecycle' | 'remediation' | 'investigation' | 'audit';
  label: string;
  icon: React.ReactNode;
}

interface FindingDetailPanelProps {
  isOpen: boolean;
  finding: any;
  onClose: () => void;
}

const TABS: Tab[] = [
  { id: 'details', label: 'Detalles', icon: <BookOpen size={18} /> },
  { id: 'lifecycle', label: 'Ciclo de Vida', icon: <Clock size={18} /> },
  { id: 'remediation', label: 'Remediación', icon: <CheckCircle size={18} /> },
  { id: 'investigation', label: 'Investigación', icon: <Code size={18} /> },
  { id: 'audit', label: 'Auditoría', icon: <FileText size={18} /> },
];

export default function FindingDetailPanel({
  isOpen,
  finding,
  onClose,
}: FindingDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab['id']>('details');

  // Fetch lifecycle data
  const { data: lifecycleData, isLoading: loadingLifecycle } = useQuery({
    queryKey: ['finding-lifecycle', finding?.id],
    queryFn: async () => {
      if (!finding?.id) return null;
      const res = await apiService.get(`/findings/${finding.id}/lifecycle`);
      return res.data?.data;
    },
    enabled: isOpen && activeTab === 'lifecycle',
  });

  // Fetch audit trail
  const { data: auditTrail, isLoading: loadingAudit } = useQuery({
    queryKey: ['finding-audit', finding?.id],
    queryFn: async () => {
      if (!finding?.id) return null;
      const res = await apiService.get(`/findings/${finding.id}/audit-trail`);
      return res.data?.data || [];
    },
    enabled: isOpen && activeTab === 'audit',
  });

  if (!finding) return null;

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={finding.title || 'Finding Detail'}
      subtitle={`${finding.severity} • ${finding.status}`}
      width="lg"
    >
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-[#2D2D2D] flex gap-1 -mx-6 px-6">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-[#888] hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#888] mb-1">Severity</p>
              <p className="text-white font-semibold">{finding.severity}</p>
            </div>
            <div>
              <p className="text-xs text-[#888] mb-1">Type</p>
              <p className="text-white font-semibold">{finding.type}</p>
            </div>
            <div>
              <p className="text-xs text-[#888] mb-1">File Location</p>
              <p className="text-white font-semibold text-sm break-all">
                {finding.file}
                {finding.lineNumber && <span className="text-[#666]">:{finding.lineNumber}</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#888] mb-1">Detected</p>
              <p className="text-white font-semibold">
                {new Date(finding.detectedAt).toLocaleString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#888] mb-1">Description</p>
              <p className="text-white text-sm">{finding.description || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Lifecycle Tab */}
        {activeTab === 'lifecycle' && (
          <div>
            {loadingLifecycle ? (
              <LoadingSpinner />
            ) : lifecycleData ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#888] mb-2">Current Status</p>
                  <div className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold inline-block">
                    {lifecycleData.currentStatus}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#888] mb-2">Timeline</p>
                  <div className="space-y-2">
                    {lifecycleData.history?.map((entry: any, idx: number) => (
                      <div key={idx} className="flex gap-3">
                        <div className="text-[#666] text-sm min-w-fit">
                          {new Date(entry.changedAt).toLocaleString('es-ES')}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{entry.status}</p>
                          <p className="text-[#666] text-xs">{entry.changedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {lifecycleData.mttc && (
                  <div>
                    <p className="text-xs text-[#888] mb-1">MTTC (Mean Time To Correction)</p>
                    <p className="text-white font-semibold">
                      {Math.round(lifecycleData.mttc / 1000 / 60 / 60)} hours
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[#888]">No lifecycle data available</p>
            )}
          </div>
        )}

        {/* Remediation Tab */}
        {activeTab === 'remediation' && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#888] mb-2">Code Preview</p>
              <pre className="bg-[#111] border border-[#2D2D2D] rounded p-3 text-xs text-[#888] overflow-auto max-h-48">
                {finding.codePreview || 'No code preview available'}
              </pre>
            </div>
            <div>
              <p className="text-xs text-[#888] mb-2">Remediation Suggestion</p>
              <p className="text-white text-sm">{finding.remediationSuggestion || 'No suggestion available'}</p>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm text-white">Mark as verified</span>
              </label>
            </div>
          </div>
        )}

        {/* Investigation Tab */}
        {activeTab === 'investigation' && (
          <div className="space-y-4">
            <p className="text-[#888] text-sm">Forensic investigation timeline</p>
            <div className="space-y-2">
              <div className="flex gap-3 text-sm">
                <span className="text-[#666] min-w-fit">File:</span>
                <span className="text-white">{finding.file}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-[#666] min-w-fit">User:</span>
                <span className="text-white">{finding.author || 'Unknown'}</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-[#666] min-w-fit">Commit:</span>
                <span className="text-white font-mono text-xs">{finding.commitHash || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div>
            {loadingAudit ? (
              <LoadingSpinner />
            ) : auditTrail && auditTrail.length > 0 ? (
              <div className="space-y-3">
                {auditTrail.map((entry: any) => (
                  <div key={entry.id} className="bg-[#111] rounded p-3 border border-[#2D2D2D]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-blue-300 text-sm">{entry.action}</p>
                      <p className="text-[#666] text-xs">
                        {new Date(entry.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                    <p className="text-[#888] text-xs mb-1">By: {entry.changedBy}</p>
                    {entry.comment && (
                      <p className="text-[#A0A0A0] text-xs italic">"{entry.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[#888] text-sm">No audit entries</p>
            )}
          </div>
        )}
      </div>
    </DetailDrawer>
  );
}
