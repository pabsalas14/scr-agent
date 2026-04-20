import DashboardTabs from './DashboardTabs';

interface DashboardProps {
  onVerAnalisis?: (projectId: string, analysisId: string) => void;
  onVerLogs?: () => void;
  onCambiarTab?: (tab: string) => void;
}

export default function Dashboard({ onVerAnalisis, onVerLogs, onCambiarTab }: DashboardProps) {
  return <DashboardTabs />;
}
