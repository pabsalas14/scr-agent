/**
 * ============================================================================
 * CODE DIFF VIEWER - Visualizador de diferencias de código
 * ============================================================================
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Download } from 'lucide-react';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
  highlighted?: boolean;
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface CodeDiffViewerProps {
  file: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
  riskLevel: string;
  severity: string;
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  file,
  additions,
  deletions,
  hunks,
  riskLevel,
  severity,
}) => {
  const [expandedHunks, setExpandedHunks] = useState<number[]>([0]);

  const toggleHunk = (idx: number) => {
    if (expandedHunks.includes(idx)) {
      setExpandedHunks(expandedHunks.filter(i => i !== idx));
    } else {
      setExpandedHunks([...expandedHunks, idx]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'add':
        return 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500';
      case 'remove':
        return 'bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500';
      default:
        return 'bg-gray-50 dark:bg-gray-700 border-l-4 border-gray-300 dark:border-gray-600';
    }
  };

  const getLinePrefix = (type: string) => {
    switch (type) {
      case 'add':
        return '+';
      case 'remove':
        return '-';
      default:
        return ' ';
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${getSeverityColor(severity)}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">{file}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Risk Level: {riskLevel} • Severity: {severity}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(file)}
            className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy filename"
          >
            <Copy size={16} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded"></span>
            <span className="text-gray-700 dark:text-gray-300">
              {additions} additions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded"></span>
            <span className="text-gray-700 dark:text-gray-300">
              {deletions} deletions
            </span>
          </div>
        </div>
      </div>

      {/* Hunks */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {hunks.map((hunk, hunkIdx) => (
          <div key={hunkIdx} className="border-l-4 border-blue-400 dark:border-blue-600">
            {/* Hunk Header */}
            <button
              onClick={() => toggleHunk(hunkIdx)}
              className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 font-medium"
            >
              {expandedHunks.includes(hunkIdx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
            </button>

            {/* Lines */}
            {expandedHunks.includes(hunkIdx) && (
              <div className="bg-gray-50 dark:bg-gray-900 font-mono text-xs">
                {hunk.lines.map((line, lineIdx) => (
                  <motion.div
                    key={lineIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: lineIdx * 0.01 }}
                    className={`flex ${getLineColor(line.type)} hover:bg-opacity-75 transition-colors`}
                  >
                    <span className="w-8 text-center text-gray-500 dark:text-gray-600 bg-gray-100 dark:bg-gray-950 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
                      {line.lineNumber}
                    </span>
                    <span
                      className={`w-6 text-center flex-shrink-0 select-none ${
                        line.type === 'add'
                          ? 'text-green-600 dark:text-green-400'
                          : line.type === 'remove'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-600'
                      }`}
                    >
                      {getLinePrefix(line.type)}
                    </span>
                    <span
                      className={`flex-1 px-4 py-1 overflow-x-auto text-gray-900 dark:text-gray-100 ${
                        line.highlighted ? 'bg-yellow-200 dark:bg-yellow-900' : ''
                      }`}
                    >
                      {line.content}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {hunks.length} {hunks.length === 1 ? 'change' : 'changes'} shown
        </p>
        <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
          <Download size={14} />
          Download diff
        </button>
      </div>
    </motion.div>
  );
};
