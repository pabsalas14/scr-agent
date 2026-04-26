import { createBrowserRouter, Navigate, useNavigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from '../pages/LoginPage';
import AppLayout from '../components/layouts/AppLayout';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Lazy load heavy components - CONSOLIDATED
const Dashboard = lazy(() => import('../components/Dashboard/Dashboard'));
const ProjectsPage = lazy(() => import('../components/Projects/ProjectsPage'));
const ReportViewer = lazy(() => import('../components/Reports/ReportViewer'));
const AnalysisMonitor = lazy(() => import('../components/Analysis/AnalysisMonitor'));

// NEW: Consolidated master modules
const FindingsCenter = lazy(() => import('../components/Findings/FindingsCenter'));
const AgentsModule = lazy(() => import('../components/Agents/AgentsModule'));
const CommandCenter = lazy(() => import('../components/CommandCenter/CommandCenter'));
const SettingsModule = lazy(() => import('../components/Settings/SettingsModule'));

// Analysis pages (unchanged)
const AnalysisComparisonPage = lazy(() => import('../pages/AnalysisComparisonPage'));
const AnalysisHistoricalPage = lazy(() => import('../pages/AnalysisHistoricalPage'));

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
      onVerLogs={() => navigate('/dashboard/control')}
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
      // CONSOLIDATED ROUTES
      {
        path: 'dashboard/hallazgos',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <FindingsCenter />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/agentes',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AgentsModule />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/control',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <CommandCenter />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/configuracion',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <SettingsModule />
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


      // ANALYSIS GROUP - Analysis routes (unchanged)
      {
        path: 'dashboard/comparacion',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AnalysisComparisonPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/historico',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AnalysisHistoricalPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'dashboard/reportes',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AnalysisMonitor />
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
