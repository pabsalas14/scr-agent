import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from '../pages/LoginPage';
import AppLayout from '../components/layouts/AppLayout';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Lazy load heavy components
const MainDashboard = lazy(() => import('../components/Monitoring/MainDashboard'));
const ProjectsPage = lazy(() => import('../components/Projects/ProjectsPage'));
const ReportViewer = lazy(() => import('../components/Reports/ReportViewer'));
const AnalyticsDashboard = lazy(() => import('../components/Analytics/AnalyticsDashboard'));
const SettingsModule = lazy(() => import('../components/Settings/SettingsModule'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in fade-in duration-500">
    <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    <span className="text-sm text-[#64748B]">Cargando...</span>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <MainDashboard />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'projects',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectsPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
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
      {
        path: 'analytics',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AnalyticsDashboard />
            </Suspense>
          </ErrorBoundary>
        ),
      },
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
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
