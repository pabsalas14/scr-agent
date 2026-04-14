import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Filter, Search, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api.service';
import type { Hallazgo } from '../types/api';

export default function FindingsPanelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const toast = useToast();

  const { data: findingsResponse, isLoading } = useQuery({
    queryKey: ['findings-all'],
    queryFn: async () => {
      return apiService.obtenerHallazgosGlobales({ limit: 200 });
    },
    staleTime: 60 * 1000,
  });

  const findings = findingsResponse?.data || [];

  const filteredFindings = findings?.filter((finding) => {
    const matchesSearch = !searchTerm ||
      finding.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      finding.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = !selectedSeverity || finding.severity === selectedSeverity;

    return matchesSearch && matchesSeverity;
  }) || [];

  const severityCounts = {
    CRITICAL: findings?.filter(f => f.severity === 'CRITICAL').length || 0,
    HIGH: findings?.filter(f => f.severity === 'HIGH').length || 0,
    MEDIUM: findings?.filter(f => f.severity === 'MEDIUM').length || 0,
    LOW: findings?.filter(f => f.severity === 'LOW').length || 0,
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'LOW': return 'text-green-500 bg-green-500/10 border-green-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Hallazgos de Seguridad</h1>
        <p className="text-sm text-[#A0A0A0]">
          Lista completa de hallazgos detectados en tus análisis
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-xs text-red-400 mb-1">Críticos</p>
          <p className="text-2xl font-bold text-red-500">{severityCounts.CRITICAL}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <p className="text-xs text-orange-400 mb-1">Altos</p>
          <p className="text-2xl font-bold text-orange-500">{severityCounts.HIGH}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-xs text-yellow-400 mb-1">Medios</p>
          <p className="text-2xl font-bold text-yellow-500">{severityCounts.MEDIUM}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-xs text-green-400 mb-1">Bajos</p>
          <p className="text-2xl font-bold text-green-500">{severityCounts.LOW}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 space-y-4">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={18} />
            <input
              type="text"
              placeholder="Buscar hallazgos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Severity filter */}
          <div className="flex gap-2">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', ''].map((sev) => (
              <button
                key={sev || 'all'}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSeverity === sev
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#2D2D2D] text-[#A0A0A0] hover:bg-[#3D3D3D]'
                }`}
              >
                {sev || 'Todos'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Findings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : filteredFindings.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
          <p className="text-[#A0A0A0]">No hay hallazgos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4 hover:border-[#4B5563] transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(finding.severity)}`}>
                      {finding.severity || 'UNKNOWN'}
                    </span>
                    <h3 className="font-semibold text-white">{finding.title || 'Sin título'}</h3>
                  </div>
                  {finding.description && (
                    <p className="text-sm text-[#A0A0A0] mt-2">{finding.description}</p>
                  )}
                  {finding.file && (
                    <p className="text-xs text-[#666666] mt-2 font-mono">
                      📁 {finding.file}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right text-xs text-[#666666]">
                    <p>{finding.riskType || 'N/A'}</p>
                  </div>
                  <button
                    onClick={() => {
                      toast.info(`Abriendo detalles de ${finding.title}`);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs rounded-lg flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Ver
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
