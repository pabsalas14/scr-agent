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
import ForensicsInvestigations from '../Forensics/ForensicsInvestigations';

type Tab = 'projects' | 'analyses' | 'agents' | 'system' | 'costs' | 'analytics' | 'incidents' | 'forensics';
type AgentView = 'list' | 'detail';

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon; description: string }> = [
  { id: 'projects',   label: 'Monitor Central', icon: Shield,    description: 'Vista general' },
  { id: 'incidents',  label: 'Incidentes',      icon: Radio,     description: 'Alertas críticas' },
  { id: 'forensics',  label: 'Investigaciones', icon: FileText,  description: 'Análisis forense' },
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
      case 'forensics':  return <ForensicsInvestigations />;
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
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab + agentView + selectedAgentId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="animate-in fade-in duration-500"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
}
