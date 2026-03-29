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
  Activity,
  ChevronRight
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

type Tab = 'projects' | 'analyses' | 'agents' | 'system' | 'costs' | 'analytics' | 'settings' | 'incidents';
type AgentView = 'list' | 'detail';

const TABS: Array<{ id: Tab; label: string; icon: any; color: string; description: string }> = [
  { id: 'projects', label: 'Monitor Central', icon: Shield, color: '#0EA5E9', description: 'Vista general' },
  { id: 'incidents', label: 'Incidentes', icon: Radio, color: '#FF3B3B', description: 'Alertas críticas' },
  { id: 'analyses', label: 'Reportes', icon: FileText, color: '#10B981', description: 'Histórico' },
  { id: 'agents', label: 'Agentes IA', icon: Wand2, color: '#EC4899', description: 'Autómatas' },
  { id: 'system', label: 'Sistema', icon: Zap, color: '#F59E0B', description: 'Estado HW' },
  { id: 'costs', label: 'Costos', icon: DollarSign, color: '#8B5CF6', description: 'Gasto Real' },
  { id: 'analytics', label: 'Estadísticas', icon: TrendingUp, color: '#00D1FF', description: 'Deep Analytics' },
  { id: 'settings', label: 'Ajustes', icon: Cog, color: '#64748B', description: 'Configuraciones' },
];

export default function MainDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'projects');
  const [agentView, setAgentView] = useState<AgentView>('list');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Sync state with URL
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
        return <Dashboard onVerAnalisis={(projectId: string, analysisId: string) => navigate(`/projects/${projectId}/analyses/${analysisId}`)} />;
      case 'incidents':
        return <IncidentMonitor />;
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
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'settings':
        return <SettingsModule />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Premium Tab Navigation */}
      <div className="sticky top-0 z-40 bg-[#050505]/60 backdrop-blur-2xl -mx-6 px-6 pt-2 pb-6 border-b border-[#1F2937]/30">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 pt-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className={`
                  relative min-w-[150px] p-4 rounded-3xl transition-all duration-300 flex flex-col gap-3 group
                  border border-transparent
                  ${isActive 
                    ? 'bg-gradient-to-br from-white/[0.05] to-transparent shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-white/[0.05]' 
                    : 'hover:bg-white/[0.02]'
                  }
                `}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-bg"
                    className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none"
                    style={{ borderColor: `${tab.color}40`, boxShadow: `0 0 15px ${tab.color}10` }}
                  />
                )}
                
                <div className="flex items-center justify-between">
                  <div 
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'text-white' : 'text-[#475569] group-hover:text-[#94A3B8]'
                    }`}
                    style={{ 
                      backgroundColor: isActive ? tab.color : 'rgba(255,255,255,0.03)',
                      boxShadow: isActive ? `0 0 20px ${tab.color}40` : 'none'
                    }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: tab.color }} />
                  )}
                </div>
                
                <div className="text-left space-y-0.5">
                  <p className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-[#64748B]'}`}>
                    {tab.label}
                  </p>
                  <p className="text-[9px] font-bold text-[#3D4A5C] uppercase tracking-tighter truncate opacity-60">
                    {tab.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + agentView + selectedAgentId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
