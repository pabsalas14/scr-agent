/**
 * FindingsCenter Module
 * Unified module for all security findings, incidents, alerts, and investigations
 * Consolidates: Incidentes, Hallazgos, Alertas, Investigaciones
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertOctagon,
  Clock,
  Radio,
  Terminal,
  Bell,
  Zap,
} from 'lucide-react';
import FindingsList, { FindingsFilter } from './FindingsList';
import FindingDetailPanel from './FindingDetailPanel';
import Button from '../ui/Button';
import { apiService } from '../../services/api.service';

export default function FindingsCenter() {
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [filters, setFilters] = useState<FindingsFilter>({});
  const [showIncidentsOnly, setShowIncidentsOnly] = useState(false);
  const [showAlertRulesModal, setShowAlertRulesModal] = useState(false);

  // Get incident count
  const { data: incidentCount } = useQuery({
    queryKey: ['incident-count'],
    queryFn: async () => {
      const response = await apiService.get('/findings/stats');
      return response.data?.data?.critical || 0;
    },
  });

  const handleSelectFinding = (finding: any) => {
    setSelectedFinding(finding);
    setShowDetailPanel(true);
  };

  const handleCloseDetail = () => {
    setShowDetailPanel(false);
    setTimeout(() => setSelectedFinding(null), 300);
  };

  const handleToggleIncidents = () => {
    if (showIncidentsOnly) {
      setFilters({});
    } else {
      setFilters({
        severity: 'CRITICAL',
        status: 'DETECTED',
        assignedTo: 'UNASSIGNED',
      });
    }
    setShowIncidentsOnly(!showIncidentsOnly);
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Hallazgos</h1>
          <p className="text-[#888] mt-1">Gestión unificada de hallazgos, incidentes y alertas</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggleIncidents}
            className={showIncidentsOnly ? 'bg-red-500/20 border-red-500/30 text-red-300' : ''}
          >
            <Radio size={16} className="mr-2" />
            Ver incidentes ({incidentCount || 0})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAlertRulesModal(true)}
          >
            <Bell size={16} className="mr-2" />
            Gestionar Reglas
          </Button>
        </div>
      </div>

      {/* Info banner */}
      {showIncidentsOnly && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertOctagon size={20} className="text-red-400" />
            <span className="text-red-300">Mostrando solo hallazgos críticos sin asignar</span>
          </div>
          <button
            onClick={handleToggleIncidents}
            className="text-red-300 hover:text-red-200 text-sm font-medium"
          >
            Ver todos
          </button>
        </div>
      )}

      {/* Findings List */}
      <FindingsList
        filters={showIncidentsOnly ? filters : {}}
        onSelectFinding={handleSelectFinding}
        onFiltersChange={setFilters}
        hideFilters={showIncidentsOnly}
      />

      {/* Detail Panel */}
      {selectedFinding && (
        <FindingDetailPanel
          isOpen={showDetailPanel}
          finding={selectedFinding}
          onClose={handleCloseDetail}
        />
      )}

      {/* Alert Rules Modal (placeholder - would be implemented) */}
      {showAlertRulesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Gestionar Reglas de Alertas</h2>
              <button
                onClick={() => setShowAlertRulesModal(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                ×
              </button>
            </div>
            <p className="text-[#888] mb-4">Alert rules management interface (coming soon)</p>
            <Button onClick={() => setShowAlertRulesModal(false)}>Cerrar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
