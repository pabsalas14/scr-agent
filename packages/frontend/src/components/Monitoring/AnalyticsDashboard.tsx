/**
 * Analytics Dashboard
 * Display statistics and analytics about security findings
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, AlertTriangle, Shield, Clock } from 'lucide-react';
import { apiService } from '../../services/api.service';
import Card from '../ui/Card';

interface AnalyticsSummary {
  totalFindings: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  averageResolutionTime: number;
  remediationRate: number;
  totalAnalyses: number;
}

interface TimelineData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

interface FindingsBySeverity {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#eab308',
  low: '#22c55e',
  blue: '#3b82f6'
};

export default function AnalyticsDashboard() {
  // Fetch summary analytics
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await apiService.get('/api/v1/analytics/summary');
      return response.data?.data || response.data as AnalyticsSummary;
    }
  });

  // Fetch timeline data
  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['analytics-timeline'],
    queryFn: async () => {
      const response = await apiService.get('/api/v1/analytics/timeline?days=30');
      return (response.data?.data || response.data || []) as TimelineData[];
    }
  });

  // Calculate severity distribution
  const severityData = useMemo((): FindingsBySeverity[] => {
    if (!summary) return [];
    return [
      { name: 'Critical', value: summary.criticalFindings || 0, color: COLORS.critical },
      { name: 'High', value: summary.highFindings || 0, color: COLORS.high },
      { name: 'Medium', value: summary.mediumFindings || 0, color: COLORS.medium },
      { name: 'Low', value: summary.lowFindings || 0, color: COLORS.low }
    ];
  }, [summary]);

  const isLoading = summaryLoading || timelineLoading;

  if (isLoading) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="inline-block animate-spin text-4xl mb-3">📊</div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-600 dark:text-gray-400">No analytics data available yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Run some analyses to see statistics
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white mb-2">📊 Security Analytics</h1>
        <p className="text-gray-400">Overview of findings and security trends</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Findings */}
        <Card className="border-l-4" style={{ borderLeftColor: COLORS.critical }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Findings</p>
              <p className="text-3xl font-black text-white mt-1">{summary.totalFindings}</p>
              <p className="text-xs text-gray-500 mt-2">Across all analyses</p>
            </div>
            <AlertTriangle className="w-12 h-12 text-red-500/30" />
          </div>
        </Card>

        {/* Critical Count */}
        <Card className="border-l-4" style={{ borderLeftColor: COLORS.critical }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Critical</p>
              <p className="text-3xl font-black text-red-400 mt-1">{summary.criticalFindings}</p>
              <p className="text-xs text-gray-500 mt-2">Immediate action needed</p>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-900/20 text-red-400">
              🔴
            </div>
          </div>
        </Card>

        {/* Avg Resolution Time */}
        <Card className="border-l-4" style={{ borderLeftColor: COLORS.blue }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Resolution</p>
              <p className="text-3xl font-black text-blue-400 mt-1">
                {Math.round(summary.averageResolutionTime / (24 * 60 * 60))}d
              </p>
              <p className="text-xs text-gray-500 mt-2">Time to remediate</p>
            </div>
            <Clock className="w-12 h-12 text-blue-500/30" />
          </div>
        </Card>

        {/* Remediation Rate */}
        <Card className="border-l-4" style={{ borderLeftColor: COLORS.low }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Remediation Rate</p>
              <p className="text-3xl font-black text-green-400 mt-1">
                {Math.round((summary.remediationRate || 0) * 100)}%
              </p>
              <p className="text-xs text-gray-500 mt-2">of findings fixed</p>
            </div>
            <Shield className="w-12 h-12 text-green-500/30" />
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution - Pie Chart */}
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Distribution by Severity
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Statistics Cards */}
        <Card>
          <h3 className="font-semibold text-white mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-800/50">
              <p className="text-xs text-gray-400">Total Analyses</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.totalAnalyses}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/50">
              <p className="text-xs text-gray-400">High Severity</p>
              <p className="text-2xl font-bold text-orange-400 mt-1">{summary.highFindings}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/50">
              <p className="text-xs text-gray-400">Medium Severity</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{summary.mediumFindings}</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/50">
              <p className="text-xs text-gray-400">Low Severity</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{summary.lowFindings}</p>
            </div>
          </div>
        </Card>

        {/* Quick Info */}
        <Card>
          <h3 className="font-semibold text-white mb-4">Quick Info</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50">
              <p className="text-xs text-red-300">Critical Issues</p>
              <p className="text-xl font-bold text-red-300 mt-1">
                {summary.criticalFindings > 0 ? `${summary.criticalFindings} require immediate action` : 'No critical issues'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-900/20 border border-blue-800/50">
              <p className="text-xs text-blue-300">Avg Resolution</p>
              <p className="text-xl font-bold text-blue-300 mt-1">
                {Math.round(summary.averageResolutionTime / (24 * 60))} minutes
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-900/20 border border-green-800/50">
              <p className="text-xs text-green-300">Security Score</p>
              <p className="text-xl font-bold text-green-300 mt-1">
                {100 - Math.round((summary.criticalFindings / (summary.totalFindings || 1)) * 100)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline Chart - Last 30 days */}
      {timeline && timeline.length > 0 && (
        <Card>
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Findings Trend (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="critical" stackId="a" fill={COLORS.critical} />
              <Bar dataKey="high" stackId="a" fill={COLORS.high} />
              <Bar dataKey="medium" stackId="a" fill={COLORS.medium} />
              <Bar dataKey="low" stackId="a" fill={COLORS.low} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Summary Text */}
      <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50">
        <div className="flex gap-3">
          <div className="text-3xl">💡</div>
          <div>
            <h4 className="font-semibold text-white mb-1">Security Summary</h4>
            <p className="text-sm text-gray-300">
              {summary.criticalFindings > 0
                ? `You have ${summary.criticalFindings} critical issues that require immediate attention. `
                : 'No critical issues detected. '}
              Your remediation rate is {Math.round((summary.remediationRate || 0) * 100)}%, and findings take an average of {Math.round(summary.averageResolutionTime / (24 * 60 * 60))} days to resolve.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
