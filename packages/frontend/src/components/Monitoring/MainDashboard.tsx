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
  History,
  Activity,
  BookOpen,
  FileText,
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
import AuditLogsView from '../Audit/AuditLogsView';
import ScrManualView from '../Docs/ScrManualView';
import { OnboardingGuide } from '../Help/OnboardingGuide';

type Tab = 'projects' | 'analyses' | 'agents' | 'system' | 'costs' | 'analytics' | 'incidents' | 'forensics' | 'audit' | 'manual';
type AgentView = 'list' | 'detail';

const TABS: Array<{ id: Tab; label: string; icon: LucideIcon; description: string }> = [
  { id: 'dashboard',  label: 'Monitor Central', icon: Activity,  description: 'Vista general' },
  { id: 'projects',   label: 'Proyectos',       icon: Shield,    description: 'Gestión de repositorios' },
  { id: 'incidents',  label: 'Incidentes',      icon: Radio,     description: 'Alertas críticas' },
  { id: 'forensics',  label: 'Investigaciones', icon: FileText,  description: 'Análisis forense' },
  { id: 'audit',      label: 'Seguridad',       icon: History,   description: 'Audit Trail' },
  { id: 'manual',     label: 'Biblioteca',      icon: BookOpen,  description: 'Manual SCR' },
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
      case 'audit':      return <AuditLogsView />;
      case 'manual':     return <ScrManualView />;
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
    </AnimatePresence>
  );
}
