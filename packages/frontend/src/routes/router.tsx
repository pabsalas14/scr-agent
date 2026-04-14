import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from '../pages/LoginPage';
import AppLayout from '../components/layouts/AppLayout';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Lazy load heavy components
const Dashboard = lazy(() => import('../components/Dashboard/Dashboard'));
const ProjectsPage = lazy(() => import('../components/Projects/ProjectsPage'));
const ReportViewer = lazy(() => import('../components/Reports/ReportViewer'));
const AnalyticsDashboard = lazy(() => import('../components/Analytics/AnalyticsDashboard'));
const SettingsModule = lazy(() => import('../components/Settings/SettingsModule'));
const IncidentMonitor = lazy(() => import('../components/Monitoring/IncidentMonitor'));
const AnalysisMonitor = lazy(() => import('../components/Monitoring/AnalysisMonitor'));
const ForensicsInvestigations = lazy(() => import('../components/Forensics/ForensicsInvestigations'));
const AgentsMonitor = lazy(() => import('../components/Monitoring/AgentsMonitor'));
const SystemMonitor = lazy(() => import('../components/Monitoring/SystemMonitor'));
const CostsMonitor = lazy(() => import('../components/Monitoring/CostsMonitor'));
const AlertsMonitor = lazy(() => import('../components/Monitoring/AlertsMonitor'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in fade-in duration-500">
    <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    <span className="text-sm text-[#64748B]">Cargando...</span>
  </div>
);

// Helper wrapper to provide navigation to lazy-loaded Dashboard
function DashboardWrapper() {
  const navigate = useNavigate();
  return (
    <Dashboard 
      onVerAnalisis={(projId, analId) => navigate(`/projects/${projId}/analyses/${analId}`)}
      onCambiarTab={(tab) => navigate(`/dashboard/${tab}`)}
      onVerLogs={() => navigate('/dashboard/system')}
    />
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Default redirect to projects when accessing /dashboard
      {
        path: '',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DashboardWrapper />
            </Suspense>
          </ErrorBoundary>
        ),
      },

      // Dashboard sections with proper routing
      {
        path: 'dashboard/projects',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/incidents',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <IncidentMonitor />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/alerts',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AlertsMonitor />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/forensics',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ForensicsInvestigations />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/analyses',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AnalysisMonitor />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/agents',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AgentsMonitor onSelectAgent={() => {}} />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/system',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SystemMonitor />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/costs',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <CostsMonitor />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/analytics',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsDashboard />
            </Suspense>
          </ErrorBoundary>
        ),
      },

      // Projects detail route - removed, using dashboard/projects instead
      {
        path: 'projects/:projectId/analyses/:analysisId',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ReportViewer />
            </Suspense>
          </ErrorBoundary>
        ),
      },

      // Settings route
      {
        path: 'settings',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SettingsModule />
            </Suspense>
          </ErrorBoundary>
        ),
      },

      // Catch-all redirect
      {
        path: '*',
        element: <Navigate to="/dashboard/projects" replace />,
      },
    ],
  },
]);
