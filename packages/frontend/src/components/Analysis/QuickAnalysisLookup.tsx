/**
 * Quick Analysis Lookup
 * Button to quickly open any analysis by ID
 *
 * Usage:
 * <QuickAnalysisLookup />
 */

import React, { useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import { useAnalysisViewer } from '../../context/AnalysisViewerContext';
import Button from '../ui/Button';

export default function QuickAnalysisLookup() {
  const [isOpen, setIsOpen] = useState(false);
  const [analysisId, setAnalysisId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState('');
  const { openAnalysisViewer } = useAnalysisViewer();

  const handleOpen = () => {
    setError('');
    if (!analysisId.trim()) {
      setError('Ingresa el ID del análisis');
      return;
    }

    // If projectId is not provided, we can try to fetch it
    openAnalysisViewer(analysisId, projectId || 'unknown');
    setIsOpen(false);
    setAnalysisId('');
    setProjectId('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-[#2D2D2D] rounded-lg transition-colors text-gray-400 hover:text-white"
        title="Ver análisis en progreso"
      >
        <Eye className="w-5 h-5" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] rounded-lg border border-[#2D2D2D] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">
                  Ver Análisis en Progreso
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#2D2D2D] rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">
              Ingresa el ID del análisis para ver su progreso en tiempo real
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ID del Análisis *
                </label>
                <input
                  type="text"
                  value={analysisId}
                  onChange={(e) => {
                    setAnalysisId(e.target.value);
                    setError('');
                  }}
                  placeholder="ej: abc123def456..."
                  className="w-full bg-[#252525] border border-[#2D2D2D] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOpen();
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  ID del Proyecto (Opcional)
                </label>
                <input
                  type="text"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  placeholder="ej: proj123..."
                  className="w-full bg-[#252525] border border-[#2D2D2D] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleOpen}
                  className="flex-1"
                  variant="primary"
                >
                  Abrir Análisis
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                  variant="secondary"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
