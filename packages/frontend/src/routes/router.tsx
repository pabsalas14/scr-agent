import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from '../pages/LoginPage';
import AppLayout from '../components/layouts/AppLayout';

// Lazy load heavy components
const MainDashboard = lazy(() => import('../components/Monitoring/MainDashboard'));
const ReportViewer = lazy(() => import('../components/Reports/ReportViewer'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin">⟳</div>
    <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando...</span>
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
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
