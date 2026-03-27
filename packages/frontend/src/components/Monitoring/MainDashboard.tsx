/**
 * Dashboard Principal de Monitoreo
 * Integra Proyectos, Análisis, Agentes, Sistema, Costos y Configuración
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, Wand2, DollarSign, Cog, Shield } from 'lucide-react';
import Dashboard from '../Dashboard/Dashboard';
import AnalysisMonitor from './AnalysisMonitor';
import AgentsMonitor from './AgentsMonitor';
import AgentDetail from './AgentDetail';
import SystemMonitor from './SystemMonitor';
import CostsMonitor from './CostsMonitor';
import SettingsModule from '../Settings/SettingsModule';

type Tab = 'projects' | 'analyses' | 'agents' | 'system' | 'costs' | 'settings';
type AgentView = 'list' | 'detail';

interface MainDashboardProps {
  onVerAnalisis?: (analysisId: string) => void;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode; color: string }> = [
  { id: 'projects', label: 'Dashboard', icon: <Shield className="w-5 h-5" />, color: '#0EA5E9' },
  { id: 'analyses', label: 'Reportes', icon: <FileText className="w-5 h-5" />, color: '#10B981' },
  { id: 'agents', label: 'Agentes IA', icon: <Wand2 className="w-5 h-5" />, color: '#EC4899' },
  { id: 'system', label: 'Sistema', icon: <Zap className="w-5 h-5" />, color: '#F59E0B' },
  { id: 'costs', label: 'Costos', icon: <DollarSign className="w-5 h-5" />, color: '#8B5CF6' },
  { id: 'settings', label: 'Settings', icon: <Cog className="w-5 h-5" />, color: '#6B7280' },
];

export default function MainDashboard({ onVerAnalisis }: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [agentView, setAgentView] = useState<AgentView>('list');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    setAgentView('detail');
  };

  const handleBackFromDetail = () => {
    setAgentView('list');
    setSelectedAgentId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <Dashboard onVerAnalisis={onVerAnalisis || (() => {})} />;
      case 'analyses':
        return <AnalysisMonitor />;
      case 'agents':
        if (agentView === 'detail' && selectedAgentId) {
          return <AgentDetail agentId={selectedAgentId} onBack={handleBackFromDetail} />;
        }
        return <AgentsMonitor onSelectAgent={handleSelectAgent} />;
      case 'system':
        return <SystemMonitor />;
      case 'costs':
        return <CostsMonitor />;
      case 'settings':
        return <SettingsModule />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation - Rediseñada con colores vibrantes */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-md rounded-lg border border-gray-700/50 p-1 shadow-lg">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className={`
                px-4 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 group
                ${
                  activeTab === tab.id
                    ? `text-white border-2 shadow-lg`
                    : 'text-gray-400 border border-transparent hover:text-gray-300'
                }
              `}
              style={{
                borderColor: activeTab === tab.id ? tab.color : 'transparent',
                backgroundColor: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                color: activeTab === tab.id ? tab.color : undefined,
              }}
            >
              <span className={activeTab === tab.id ? 'drop-shadow-lg' : ''}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
}
