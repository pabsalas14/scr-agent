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

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard/Dashboard';
import ReportViewer from './components/Reports/ReportViewer';
import Settings from './components/Settings/Settings';

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

type Vista = 'dashboard' | 'reporte' | 'settings';

/**
 * Componente principal de la aplicación
 */
function App() {
  const [vista, setVista] = useState<Vista>('dashboard');
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

  return (
    <QueryClientProvider client={queryClient}>
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
                  <p className="font-bold text-gray-900 leading-tight">CODA</p>
                  <p className="text-xs text-gray-500">Code Observability & Defense Agents</p>
                </div>
              </button>

              {/* Navegación */}
              <nav className="flex items-center gap-1 text-sm">
                <button
                  onClick={irADashboard}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    vista === 'dashboard'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Proyectos
                </button>
                {vista === 'reporte' && (
                  <span className="px-3 py-1.5 text-blue-600 font-medium">› Reporte</span>
                )}
                <button
                  onClick={() => setVista('settings')}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                    vista === 'settings'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                  title="Configuración"
                >
                  ⚙️ Config
                </button>
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

            {vista === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Settings />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-xs text-gray-500 text-center">
              CODA — Code Observability & Defense Agents · Claude 3.5 · OWASP Top 10
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
