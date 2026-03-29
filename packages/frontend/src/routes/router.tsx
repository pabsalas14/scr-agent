import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from '../pages/LoginPage';
import AppLayout from '../components/layouts/AppLayout';

// Lazy load heavy components
const MainDashboard = lazy(() => import('../components/Monitoring/MainDashboard'));
const ReportViewer = lazy(() => import('../components/Reports/ReportViewer'));
const AnalyticsDashboard = lazy(() => import('../components/Analytics/AnalyticsDashboard'));
const SettingsModule = lazy(() => import('../components/Settings/SettingsModule'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in fade-in duration-500">
    <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.3em]">Sincronizando...</span>
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
          <Suspense fallback={<LoadingFallback />}>
            <MainDashboard />
          </Suspense>
        ),
      },
      {
        path: 'projects/:projectId/analyses/:analysisId',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <ReportViewer />
          </Suspense>
        ),
      },
      {
        path: 'analytics',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsDashboard />
          </Suspense>
        ),
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsModule />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
