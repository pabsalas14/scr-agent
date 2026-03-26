/**
 * ============================================================================
 * COMPONENTE PRINCIPAL - APP
 * ============================================================================
 *
 * Maneja:
 * - Estado de navegación simple (sin router externo)
 * - Providers (QueryClient)
 * - Layout global con header y footer
 *
 * Vistas:
 * - 'dashboard' → Lista de proyectos
 * - 'reporte'   → Reporte de análisis con timeline
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard/Dashboard';
import ReportViewer from './components/Reports/ReportViewer';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

/**
 * Cliente de React Query
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

type Vista = 'login' | 'dashboard' | 'reporte';

/**
 * Componente principal de la aplicación
 */
function App() {
  const { isAuthenticated } = useAuth();
  const [vista, setVista] = useState<Vista>(isAuthenticated() ? 'dashboard' : 'login');
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  /**
   * Ir a ver un reporte de análisis
   */
  const irAReporte = (id: string) => {
    setAnalysisId(id);
    setVista('reporte');
  };

  /**
   * Volver al dashboard
   */
  const irADashboard = () => {
    setVista('dashboard');
    setAnalysisId(null);
  };

  if (vista === 'login') {
    return (
      <QueryClientProvider client={queryClient}>
        <LoginPage onLoginSuccess={() => setVista('dashboard')} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ProtectedRoute onUnauthenticated={() => setVista('login')}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={irADashboard}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl">🔍</span>
                <div className="text-left">
                  <p className="font-bold text-gray-900 leading-tight">SCR Agent</p>
                  <p className="text-xs text-gray-500">Revisión de código seguro</p>
                </div>
              </button>

              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-500">
                <button
                  onClick={irADashboard}
                  className={`hover:text-gray-800 ${vista === 'dashboard' ? 'text-blue-600 font-medium' : ''}`}
                >
                  Proyectos
                </button>
                {vista === 'reporte' && (
                  <>
                    <span>›</span>
                    <span className="text-blue-600 font-medium">Reporte</span>
                  </>
                )}
              </nav>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {vista === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Dashboard onVerAnalisis={irAReporte} />
              </motion.div>
            )}

            {vista === 'reporte' && analysisId && (
              <motion.div
                key="reporte"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ReportViewer
                  analysisId={analysisId}
                  onVolver={irADashboard}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-gray-500 text-center">
              SCR Agent — Arquitectura MCP agentica con Claude 3.5 · OWASP Top 10 · Todo en español
            </p>
          </div>
        </footer>
      </div>
      </ProtectedRoute>
    </QueryClientProvider>
  );
}

export default App;
