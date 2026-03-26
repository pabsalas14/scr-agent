/**
 * Dashboard Principal de Monitoreo
 * Integra Proyectos, Agentes, Sistema y Costos
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Zap, DollarSign, Boxes } from 'lucide-react';
import Dashboard from '../Dashboard/Dashboard';
import AgentsMonitor from './AgentsMonitor';
import AgentDetail from './AgentDetail';
import SystemMonitor from './SystemMonitor';
import CostsMonitor from './CostsMonitor';

type Tab = 'projects' | 'agents' | 'system' | 'costs';
type AgentView = 'list' | 'detail';

interface MainDashboardProps {
  onVerAnalisis?: (analysisId: string) => void;
}

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'projects', label: 'Proyectos', icon: <Boxes className="w-5 h-5" /> },
  { id: 'agents', label: 'Agentes', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'system', label: 'Sistema', icon: <Zap className="w-5 h-5" /> },
  { id: 'costs', label: 'Costos', icon: <DollarSign className="w-5 h-5" /> },
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
      case 'agents':
        if (agentView === 'detail' && selectedAgentId) {
          return <AgentDetail agentId={selectedAgentId} onBack={handleBackFromDetail} />;
        }
        return <AgentsMonitor onSelectAgent={handleSelectAgent} />;
      case 'system':
        return <SystemMonitor />;
      case 'costs':
        return <CostsMonitor />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2
                ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
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
