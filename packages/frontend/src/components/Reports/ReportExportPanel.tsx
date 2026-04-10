/**
 * ============================================================================
 * REPORT EXPORT PANEL - Panel para exportación de reportes
 * ============================================================================
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';
import { reportsService } from '../../services/reports.service';

interface ReportExportPanelProps {
  analysisId: string;
}

export const ReportExportPanel: React.FC<ReportExportPanelProps> = ({ analysisId }) => {
  const [selectedReport, setSelectedReport] = useState<'executive' | 'technical' | 'remediation'>(
    'executive'
  );
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reports = [
    {
      type: 'executive' as const,
      name: 'Executive Report',
      description: 'High-level summary for decision makers',
      icon: <BarChart3 size={20} />,
    },
    {
      type: 'technical' as const,
      name: 'Technical Report',
      description: 'Detailed technical findings and evidence',
      icon: <FileText size={20} />,
    },
    {
      type: 'remediation' as const,
      name: 'Remediation Report',
      description: 'Tracking progress on fixes and remediations',
      icon: <CheckCircle size={20} />,
    },
  ];

  const handleDownload = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await reportsService.downloadReport(analysisId, selectedReport, selectedFormat);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error downloading report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Download size={20} />
        Export Reports
      </h3>

      <div className="space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Report Type
          </label>
          <div className="grid grid-cols-1 gap-3">
            {reports.map(report => (
              <motion.button
                key={report.type}
                onClick={() => setSelectedReport(report.type)}
                whileHover={{ scale: 1.02 }}
                className={`p-4 text-left rounded-lg border-2 transition-all ${
                  selectedReport === report.type
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded ${
                      selectedReport === report.type
                        ? 'bg-blue-200 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {report.icon}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{report.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{report.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Export Format
          </label>
          <div className="flex gap-3">
            {(['json', 'csv'] as const).map(format => (
              <motion.button
                key={format}
                onClick={() => setSelectedFormat(format)}
                whileHover={{ scale: 1.05 }}
                className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium transition-all uppercase text-sm ${
                  selectedFormat === format
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {format}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={16} />
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {selectedFormat === 'csv'
                ? 'CSV format is ideal for data analysis and spreadsheet applications.'
                : 'JSON format includes complete report structure and metadata for programmatic access.'}
            </p>
          </div>
        </div>

        {/* Download Button */}
        <motion.button
          onClick={handleDownload}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            success
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating report...
            </>
          ) : success ? (
            <>
              <CheckCircle size={18} />
              Report downloaded successfully!
            </>
          ) : (
            <>
              <Download size={18} />
              Download {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
            </>
          )}
        </motion.button>

        {/* Preview Info */}
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Analysis ID: <code className="font-mono text-gray-700 dark:text-gray-300">{analysisId}</code>
        </p>
      </div>
    </motion.div>
  );
};
