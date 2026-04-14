import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
import AuditLogsView from '../Audit/AuditLogsView';
import ScrManualView from '../Docs/ScrManualView';
import NavigationSidebar from '../Navigation/NavigationSidebar';
import { OnboardingGuide } from '../Help/OnboardingGuide';
import type { TabId } from '../../types/navigation';
import { useAuth } from '../../hooks/useAuth';

type AgentView = 'list' | 'detail';

export default function MainDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, clearToken } = useAuth();

  // Map old tab names to new TabIds for backwards compatibility
  const mapOldTabToNew = (tab: string): TabId => {
    const mapping: Record<string, TabId> = {
      'dashboard': 'monitor-central',
      'projects': 'proyectos',
      'analyses': 'reportes',
      'incidents': 'incidentes',
      'forensics': 'investigaciones',
      'manual': 'biblioteca',
      'agents': 'agentes',
      'system': 'sistema',
      'costs': 'costos',
      'analytics': 'analytics',
      'audit': 'incidentes', // audit merged into incidentes
    };
    return mapping[tab] || 'monitor-central';
  };

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl ? mapOldTabToNew(tabFromUrl) : 'monitor-central');
  const [agentView, setAgentView] = useState<AgentView>('list');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('scr_onboarding_completed'));

  const onboardingSteps = [
    {
      id: 'welcome',
      title: 'Bienvenido a SCR Agent',
      description: 'Tu plataforma de auditoría de código agéntica 24/7. Vamos a darte un tour rápido.',
      tips: ['Puedes cerrar este tour en cualquier momento.']
    },
    {
      id: 'projects',
      title: 'Gestión de Proyectos',
      description: 'Aquí aparecen todos tus repositorios protegidos. Puedes ver el Risk Score y el estado de salud de cada uno.',
      tips: ['Haz clic en el icono del engrane para ver el historial o configurar el proyecto.']
    },
    {
      id: 'audit',
      title: 'Modos de Auditoría',
      description: 'Usa el botón "Auditoría" para escaneos completos, o la flecha lateral para "Auditoría Incremental" (solo cambios nuevos).',
      tips: ['El análisis incremental ahorra tokens y tiempo.']
    },
    {
      id: 'incidents',
      title: 'Monitor de Incidentes',
      description: 'En esta pestaña verás las alertas más críticas detectadas en tiempo real través de todos tus activos.',
    },
    {
      id: 'manual',
      title: 'Manual Completo SCR',
      description: '¿Dudas sobre cómo ponderamos las amenazas? En la Biblioteca tienes la documentación completa sobre la metodología y patrones.',
    }
  ];

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      const mappedTab = mapOldTabToNew(tabFromUrl);
      setActiveTab(mappedTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabId) => {
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
      case 'monitor-central':
        return (
          <Dashboard
            onVerAnalisis={(projectId: string, analysisId: string) => navigate(`/projects/${projectId}/analyses/${analysisId}`)}
            onVerLogs={() => handleTabChange('sistema')}
            onCambiarTab={(tab: string) => {
              const mappedTab = mapOldTabToNew(tab);
              handleTabChange(mappedTab);
            }}
          />
        );
      case 'proyectos':
        return (
          <Dashboard
            onVerAnalisis={(projectId: string, analysisId: string) => navigate(`/projects/${projectId}/analyses/${analysisId}`)}
            onVerLogs={() => handleTabChange('sistema' as TabId)}
            onCambiarTab={(tab: string) => {
              const mappedTab = mapOldTabToNew(tab);
              handleTabChange(mappedTab);
            }}
          />
        );
      case 'reportes':   return <AnalysisMonitor />;
      case 'incidentes': return <IncidentMonitor />;
      case 'investigaciones': return <ForensicsInvestigations />;
      case 'agentes':
        if (agentView === 'detail' && selectedAgentId) {
          return <AgentDetail agentId={selectedAgentId} onBack={handleBackFromDetail} />;
        }
        return <AgentsMonitor onSelectAgent={handleSelectAgent} />;
      case 'sistema':    return <SystemMonitor />;
      case 'biblioteca':   return <ScrManualView />;
      case 'costos':     return <CostsMonitor />;
      case 'analytics':  return <AnalyticsDashboard />;
      case 'hallazgos':  return <IncidentMonitor />; // Use IncidentMonitor for detailed findings
      case 'alertas':    return <AnalyticsDashboard />; // Could be dedicated alerts component
      case 'anomalias':  return <AnalyticsDashboard />; // Could be dedicated anomaly component
      case 'comparacion': return <AnalysisMonitor />; // Could be dedicated comparison component
      case 'historico':  return <AnalysisMonitor />; // Could be dedicated history component
      case 'integraciones': return <SettingsModule />; // Settings for integrations
      case 'webhooks':   return <SettingsModule />; // Settings for webhooks
      case 'usuarios':   return <SettingsModule />; // Settings for users
      case 'preferencias': return <SettingsModule />; // User preferences
      default:           return <Dashboard onVerAnalisis={() => {}} onVerLogs={() => {}} onCambiarTab={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0A0A0F]">
      {/* Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        userName={user?.name || 'Usuario'}
        onLogout={() => {
          clearToken();
          navigate('/login');
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + agentView + selectedAgentId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="animate-in fade-in duration-500"
            >
              <div className="p-8">
                {renderContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {showOnboarding && (
        <OnboardingGuide
          steps={onboardingSteps}
          autoStart={true}
          onComplete={() => {
            localStorage.setItem('scr_onboarding_completed', 'true');
            setShowOnboarding(false);
          }}
          onSkip={() => {
            localStorage.setItem('scr_onboarding_completed', 'true');
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
