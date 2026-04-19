/**
 * FindingsList Component
 * Unified findings table component replacing all duplicate findings displays
 * Used by FindingsCenter, IncidentMonitor, AlertsMonitor, Dashboard findings display
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Loader,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';

export interface FindingsFilter {
  severity?: 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status?: string;
  type?: string;
  dateRange?: [Date, Date];
  assignedTo?: 'ALL' | 'ME' | 'UNASSIGNED' | string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface Finding {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  type: string;
  detectedAt: string;
  file?: string;
  lineNumber?: number;
  assignedTo?: string;
  mttc?: number;
}

interface FindingsListProps {
  filters?: FindingsFilter;
  onSelectFinding?: (finding: Finding) => void;
  onBulkAction?: (action: string, findingIds: string[]) => void;
  hideFilters?: boolean;
  onFiltersChange?: (filters: FindingsFilter) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  LOW: 'bg-green-500/20 text-green-300 border-green-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  DETECTED: 'bg-blue-500/20 text-blue-300',
  IN_REVIEW: 'bg-purple-500/20 text-purple-300',
  IN_CORRECTION: 'bg-yellow-500/20 text-yellow-300',
  CORRECTED: 'bg-green-500/20 text-green-300',
  VERIFIED: 'bg-emerald-500/20 text-emerald-300',
  FALSE_POSITIVE: 'bg-gray-500/20 text-gray-300',
  CLOSED: 'bg-slate-500/20 text-slate-300',
};

export default function FindingsList({
  filters = {},
  onSelectFinding,
  hideFilters = false,
  onFiltersChange,
}: FindingsListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [localFilters, setLocalFilters] = useState<FindingsFilter>(filters);
  const [sortBy, setSortBy] = useState<'severity' | 'date'>('severity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch findings
  const { data: findings, isLoading, error } = useQuery({
    queryKey: ['findings', localFilters],
    queryFn: async () => {
      const response = await apiService.get('/findings', { params: localFilters });
      return response.data?.data || [];
    },
  });

  // Sort and filter findings
  const processedFindings = useMemo(() => {
    if (!findings) return [];

    let result = [...findings];

    // Sort
    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (sortBy === 'severity') {
        const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        aVal = severityOrder[a.severity] || 0;
        bVal = severityOrder[b.severity] || 0;
      } else {
        aVal = new Date(a.detectedAt).getTime();
        bVal = new Date(b.detectedAt).getTime();
      }

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [findings, sortBy, sortOrder]);

  const handleFilterChange = (newFilters: Partial<FindingsFilter>) => {
    const updated = { ...localFilters, ...newFilters };
    setLocalFilters(updated);
    onFiltersChange?.(updated);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === processedFindings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(processedFindings.map(f => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <EmptyState title="Error loading findings" description="Try refreshing or contact support" />;
  }

  if (!processedFindings || processedFindings.length === 0) {
    return <EmptyState title="No findings" description="No findings match your filters" />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {!hideFilters && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} className="text-[#888]" />
            <h3 className="font-semibold text-white">Filters</h3>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-[#888] mb-2">Severity</label>
              <select
                value={localFilters.severity || 'ALL'}
                onChange={e => handleFilterChange({ severity: e.target.value as any })}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm"
              >
                <option value="ALL">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#888] mb-2">Status</label>
              <select
                value={localFilters.status || 'ALL'}
                onChange={e => handleFilterChange({ status: e.target.value === 'ALL' ? undefined : e.target.value })}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm"
              >
                <option value="ALL">All</option>
                <option value="DETECTED">Detected</option>
                <option value="IN_CORRECTION">In Correction</option>
                <option value="VERIFIED">Verified</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#888] mb-2">Assignment</label>
              <select
                value={localFilters.assignedTo || 'ALL'}
                onChange={e => handleFilterChange({ assignedTo: e.target.value === 'ALL' ? undefined : e.target.value as any })}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm"
              >
                <option value="ALL">All</option>
                <option value="ME">Assigned to me</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#888] mb-2">Sort</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#111] border border-[#2D2D2D] rounded text-white text-sm"
              >
                <option value="severity">Severity</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#111] border-b border-[#2D2D2D]">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === processedFindings.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#888]">Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#888]">Severity</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#888]">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#888]">File</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-[#888]">Detected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D2D2D]">
            {processedFindings.map(finding => (
              <tr
                key={finding.id}
                onClick={() => onSelectFinding?.(finding)}
                className="hover:bg-[#222] cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(finding.id)}
                    onChange={() => toggleSelect(finding.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium text-white text-sm">{finding.title}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${SEVERITY_COLORS[finding.severity]}`}>
                    {finding.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[finding.status]}`}>
                    {finding.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#888]">
                  {finding.file}
                  {finding.lineNumber && <span className="text-[#666]">:{finding.lineNumber}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-[#888]">
                  {new Date(finding.detectedAt).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected count */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
          {selectedIds.size} finding{selectedIds.size > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
