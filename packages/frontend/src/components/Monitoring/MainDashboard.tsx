import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Zap,
  Wand2,
  DollarSign,
  Cog,
  Shield,
  TrendingUp,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import Dashboard from '../Dashboard/Dashboard';
import AnalysisMonitor from './AnalysisMonitor';
import IncidentMonitor from './IncidentMonitor';
import AgentsMonitor from './AgentsMonitor';
import AgentDetail from './AgentDetail';
import SystemMonitor from './SystemMonitor';
import CostsMonitor from './CostsMonitor';
import AnalyticsDashboard from '../Analytics/AnalyticsDashboard';
import SettingsModule from '../Settings/SettingsModule';

type Tab = 'projects' | 'analyses' | 'agents' | 'system' | 'costs' | 'analytics' | 'incidents';
type AgentView = 'list' | 'detail';

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon; description: string }> = [
  { id: 'projects',   label: 'Monitor Central', icon: Shield,    description: 'Vista general' },
  { id: 'incidents',  label: 'Incidentes',      icon: Radio,     description: 'Alertas críticas' },
  { id: 'analyses',   label: 'Reportes',        icon: FileText,  description: 'Histórico' },
  { id: 'agents',     label: 'Agentes IA',      icon: Wand2,     description: 'Autómatas' },
  { id: 'system',     label: 'Sistema',         icon: Zap,       description: 'Estado HW' },
  { id: 'costs',      label: 'Costos',          icon: DollarSign,description: 'Gasto Real' },
  { id: 'analytics',  label: 'Estadísticas',    icon: TrendingUp,description: 'Deep Analytics' },
];

export default function MainDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'projects');
  const [agentView, setAgentView] = useState<AgentView>('list');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as Tab;
    if (tabFromUrl && tabFromUrl !== activeTab && TABS.some(t => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

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
        return (
          <Dashboard
            onVerAnalisis={(projectId: string, analysisId: string) => navigate(`/projects/${projectId}/analyses/${analysisId}`)}
            onVerLogs={() => handleTabChange('system')}
            onCambiarTab={(tab: string) => handleTabChange(tab as Tab)}
          />
        );
      case 'incidents':  return <IncidentMonitor />;
      case 'analyses':   return <AnalysisMonitor />;
      case 'agents':
        if (agentView === 'detail' && selectedAgentId) {
          return <AgentDetail agentId={selectedAgentId} onBack={handleBackFromDetail} />;
        }
        return <AgentsMonitor onSelectAgent={handleSelectAgent} />;
      case 'system':     return <SystemMonitor />;
      case 'costs':      return <CostsMonitor />;
      case 'analytics':  return <AnalyticsDashboard />;
      default:           return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tab Navigation */}
      <div className="sticky top-0 z-40 bg-[#111111]/95 backdrop-blur-md -mx-6 px-6 pt-4 pb-4 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileTap={{ scale: 0.97 }}
                className={`
                  relative flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/25'
                    : 'text-[#6B7280] hover:text-[#A0A0A0] hover:bg-[#1C1C1E] border border-transparent'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F97316] animate-pulse ml-0.5" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + agentView + selectedAgentId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
