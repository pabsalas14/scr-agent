import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, LineChart, PieChart, Download, Filter } from 'lucide-react';
import { apiService } from '../services/api.service';
import { useToast } from '../hooks/useToast';
import Button from '../components/ui/Button';

interface TokenUsageMetrics {
  userId: string;
  userName?: string;
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  analysisCount: number;
  model: string;
  period: string;
}

interface RepositoryActivityMetrics {
  projectId: string;
  projectName: string;
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  analysisCount: number;
  lastAnalysisAt?: string;
}

interface MTTDMetrics {
  severity: string;
  averageMttdHours: number;
  minMttdHours: number;
  maxMttdHours: number;
  sampleCount: number;
}

interface BurndownMetrics {
  date: string;
  detected: number;
  inReview: number;
  inCorrection: number;
  corrected: number;
  verified: number;
  falsePositives: number;
  closed: number;
}

export default function MetricsDashboardPage() {
  const toast = useToast();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [burndownDays, setBurndownDays] = useState(30);

  // Fetch token usage metrics
  const { data: tokenData, isLoading: loadingTokens } = useQuery({
    queryKey: ['metrics-token-usage', period],
    queryFn: async () => {
      const res = await apiService.get(`/analytics/metrics/token-usage?period=${period}`);
      return res.data?.data as TokenUsageMetrics[];
    },
  });

  // Fetch repository activity metrics
  const { data: repoData, isLoading: loadingRepos } = useQuery({
    queryKey: ['metrics-repository-activity'],
    queryFn: async () => {
      const res = await apiService.get('/analytics/metrics/repository-activity');
      return res.data?.data as RepositoryActivityMetrics[];
    },
  });

  // Fetch MTTD metrics
  const { data: mttdData, isLoading: loadingMTTD } = useQuery({
    queryKey: ['metrics-mttd'],
    queryFn: async () => {
      const res = await apiService.get('/analytics/metrics/mttd');
      return res.data?.data as MTTDMetrics[];
    },
  });

  // Fetch burndown metrics
  const { data: burndownData, isLoading: loadingBurndown } = useQuery({
    queryKey: ['metrics-burndown', burndownDays],
    queryFn: async () => {
      const res = await apiService.get(`/analytics/metrics/burndown?days=${burndownDays}`);
      return res.data?.data as BurndownMetrics[];
    },
  });

  const handleExportCSV = () => {
    try {
      const csv = convertToCSV(tokenData || [], repoData || [], mttdData || []);
      downloadCSV(csv, 'metrics-report.csv');
      toast.success('Report exported as CSV');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Metrics Dashboard</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">
            Enterprise analytics & cost tracking
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download size={16} />
          Export Report
        </Button>
      </div>

      {/* Token Usage Section */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <BarChart size={20} />
            Token Usage Metrics
          </h2>
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#2D2D2D] text-[#A0A0A0] hover:bg-[#3D3D3D]'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loadingTokens ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : tokenData && tokenData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D2D2D]">
                  <th className="text-left py-3 px-4 text-[#6B7280] font-medium">
                    User
                  </th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-medium">
                    Total Tokens
                  </th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-medium">
                    Input
                  </th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-medium">
                    Output
                  </th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-medium">
                    Cost (USD)
                  </th>
                  <th className="text-right py-3 px-4 text-[#6B7280] font-medium">
                    Analyses
                  </th>
                  <th className="text-left py-3 px-4 text-[#6B7280] font-medium">
                    Model
                  </th>
                </tr>
              </thead>
              <tbody>
                {tokenData.map((metric) => (
                  <tr
                    key={metric.userId}
                    className="border-b border-[#2D2D2D] hover:bg-[#252525] transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-medium">
                      {metric.userName || 'Unknown'}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {metric.totalTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-[#A0A0A0]">
                      {metric.inputTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-[#A0A0A0]">
                      {metric.outputTokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 font-semibold">
                      ${metric.costUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {metric.analysisCount}
                    </td>
                    <td className="py-3 px-4 text-left text-[#A0A0A0] text-xs">
                      <span className="bg-[#2D2D2D] px-2 py-1 rounded">
                        {metric.model}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#666666] text-center py-8">No token usage data available</p>
        )}
      </div>

      {/* Repository Activity Section */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart size={20} />
          Repository Activity
        </h2>

        {loadingRepos ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : repoData && repoData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repoData.map((repo) => (
              <div
                key={repo.projectId}
                className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-4"
              >
                <h3 className="text-white font-semibold mb-3 truncate">
                  {repo.projectName}
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Total Findings:</span>
                    <span className="text-white font-semibold">
                      {repo.totalFindings}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-red-400 text-xs">Critical:</span>
                    <span className="text-white">
                      {repo.criticalFindings}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-orange-400 text-xs">High:</span>
                    <span className="text-white">{repo.highFindings}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-yellow-400 text-xs">Medium:</span>
                    <span className="text-white">{repo.mediumFindings}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-blue-400 text-xs">Low:</span>
                    <span className="text-white">{repo.lowFindings}</span>
                  </div>

                  <div className="border-t border-[#2D2D2D] pt-2 mt-2 flex justify-between">
                    <span className="text-[#6B7280]">Analyses:</span>
                    <span className="text-white">{repo.analysisCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#666666] text-center py-8">No repository data available</p>
        )}
      </div>

      {/* MTTD Metrics Section */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart size={20} />
          Mean Time To Detection (MTTD)
        </h2>

        {loadingMTTD ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : mttdData && mttdData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mttdData.map((metric) => (
              <div
                key={metric.severity}
                className="bg-[#111111] border border-[#2D2D2D] rounded-lg p-4"
              >
                <h3 className="text-white font-semibold mb-3">
                  {metric.severity} Severity
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Avg MTTD:</span>
                    <span className="text-white font-semibold">
                      {metric.averageMttdHours.toFixed(2)} hours
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Min:</span>
                    <span className="text-white">
                      {metric.minMttdHours.toFixed(2)} hours
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Max:</span>
                    <span className="text-white">
                      {metric.maxMttdHours.toFixed(2)} hours
                    </span>
                  </div>

                  <div className="border-t border-[#2D2D2D] pt-2 mt-2 flex justify-between">
                    <span className="text-[#6B7280]">Sample Count:</span>
                    <span className="text-white">{metric.sampleCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#666666] text-center py-8">No MTTD data available</p>
        )}
      </div>

      {/* Burndown Chart Section */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <LineChart size={20} />
            Finding Status Burndown
          </h2>
          <div className="flex gap-2">
            {[7, 14, 30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setBurndownDays(days)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  burndownDays === days
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#2D2D2D] text-[#A0A0A0] hover:bg-[#3D3D3D]'
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {loadingBurndown ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-3 border-white/10 border-t-white rounded-full animate-spin" />
          </div>
        ) : burndownData && burndownData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2D2D2D]">
                  <th className="text-left py-3 px-4 text-[#6B7280] font-medium">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-blue-400 text-xs font-medium">
                    Detected
                  </th>
                  <th className="text-right py-3 px-4 text-purple-400 text-xs font-medium">
                    In Review
                  </th>
                  <th className="text-right py-3 px-4 text-yellow-400 text-xs font-medium">
                    In Correction
                  </th>
                  <th className="text-right py-3 px-4 text-green-400 text-xs font-medium">
                    Corrected
                  </th>
                  <th className="text-right py-3 px-4 text-emerald-400 text-xs font-medium">
                    Verified
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 text-xs font-medium">
                    False Positives
                  </th>
                  <th className="text-right py-3 px-4 text-slate-400 text-xs font-medium">
                    Closed
                  </th>
                </tr>
              </thead>
              <tbody>
                {burndownData.map((row) => (
                  <tr
                    key={row.date}
                    className="border-b border-[#2D2D2D] hover:bg-[#252525] transition-colors"
                  >
                    <td className="py-3 px-4 text-[#A0A0A0] text-xs">
                      {new Date(row.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.detected}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.inReview}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.inCorrection}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.corrected}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.verified}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.falsePositives}
                    </td>
                    <td className="py-3 px-4 text-right text-white">
                      {row.closed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#666666] text-center py-8">No burndown data available</p>
        )}
      </div>
    </div>
  );
}

// ==================== EXPORT HELPERS ====================

function convertToCSV(
  tokenData: TokenUsageMetrics[],
  repoData: RepositoryActivityMetrics[],
  mttdData: MTTDMetrics[]
): string {
  let csv = '';

  // Token Usage Section
  csv += 'TOKEN USAGE METRICS\n';
  csv += 'User,Total Tokens,Input Tokens,Output Tokens,Cost (USD),Analyses,Model\n';
  tokenData.forEach((metric) => {
    csv += `"${metric.userName || 'Unknown'}",${metric.totalTokens},${metric.inputTokens},${metric.outputTokens},${metric.costUsd.toFixed(2)},${metric.analysisCount},"${metric.model}"\n`;
  });

  csv += '\n\nREPOSITORY ACTIVITY\n';
  csv += 'Repository,Total Findings,Critical,High,Medium,Low,Analyses\n';
  repoData.forEach((repo) => {
    csv += `"${repo.projectName}",${repo.totalFindings},${repo.criticalFindings},${repo.highFindings},${repo.mediumFindings},${repo.lowFindings},${repo.analysisCount}\n`;
  });

  csv += '\n\nMEAN TIME TO DETECTION (Hours)\n';
  csv += 'Severity,Average,Min,Max,Sample Count\n';
  mttdData.forEach((metric) => {
    csv += `${metric.severity},${metric.averageMttdHours.toFixed(2)},${metric.minMttdHours.toFixed(2)},${metric.maxMttdHours.toFixed(2)},${metric.sampleCount}\n`;
  });

  return csv;
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
