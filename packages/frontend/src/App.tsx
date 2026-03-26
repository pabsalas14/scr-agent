import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard/Dashboard';
import ReportViewer from './components/Reports/ReportViewer';
import Settings from './components/Settings/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

type Vista = 'dashboard' | 'reporte' | 'settings';

const NAV_ITEMS: { id: Vista; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '⬡', label: 'Proyectos' },
  { id: 'settings', icon: '⚙', label: 'Configuración' },
];

function App() {
  const [vista, setVista] = useState<Vista>('dashboard');
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const irAReporte = (id: string) => {
    setAnalysisId(id);
    setVista('reporte');
  };

  const irADashboard = () => {
    setVista('dashboard');
    setAnalysisId(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          {/* Logo */}
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4-4 3 3 4-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="14" cy="14" r="2.5" fill="rgba(255,255,255,0.8)"/>
                <circle cx="3" cy="14" r="1.8" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">CODA</p>
              <p className="text-xs leading-tight" style={{ color: 'rgba(148,163,184,0.7)' }}>
                Code Defense Agents
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 overflow-y-auto">
            <p className="sidebar-section-label">Menú</p>

            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === 'dashboard' ? irADashboard() : setVista(item.id)}
                className={`sidebar-item w-full text-left ${
                  (item.id === 'dashboard' && (vista === 'dashboard' || vista === 'reporte')) ||
                  (item.id === vista)
                    ? 'active'
                    : ''
                }`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}

            {/* Breadcrumb when in report */}
            {vista === 'reporte' && (
              <div className="mx-2 mt-1">
                <button
                  onClick={irADashboard}
                  className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg w-full text-left transition-colors"
                  style={{ color: 'rgba(148,163,184,0.6)' }}
                >
                  <span className="opacity-50">↩</span>
                  <span>Volver a proyectos</span>
                </button>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <p className="text-xs" style={{ color: 'rgba(148,163,184,0.4)' }}>
              OWASP Top 10 · Claude 3.5
            </p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="main-content">
          <AnimatePresence mode="wait">
            {vista === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="page-content"
              >
                <Dashboard onVerAnalisis={irAReporte} />
              </motion.div>
            )}

            {vista === 'reporte' && analysisId && (
              <motion.div
                key="reporte"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="page-content"
              >
                <ReportViewer analysisId={analysisId} onVolver={irADashboard} />
              </motion.div>
            )}

            {vista === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="page-content"
              >
                <Settings />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
