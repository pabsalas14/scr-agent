import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

import MainDashboard from './components/Monitoring/MainDashboard';
import ReportViewer from './components/Reports/ReportViewer';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import SettingsModal from './components/Settings/SettingsModal';
import ToastContainer from './components/ui/Toast';
import Header from './components/Header';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

type Vista = 'login' | 'dashboard' | 'reporte';

function AppContent() {
  const [vista, setVista] = useState<Vista>('login');
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const irAReporte = (id: string) => {
    setAnalysisId(id);
    setVista('reporte');
  };

  const irADashboard = () => {
    setVista('dashboard');
    setAnalysisId(null);
  };

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  if (vista === 'login') {
    return <LoginPage onLoginSuccess={() => setVista('dashboard')} />;
  }

  return (
    <ProtectedRoute onUnauthenticated={() => setVista('login')}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-600 to-blue-600 dark:from-slate-900 dark:to-slate-800">
        {/* Header Component */}
        <Header
          vista={vista}
          theme={theme}
          onLogoClick={irADashboard}
          onThemeToggle={toggleTheme}
          onSettingsClick={() => setSettingsOpen(true)}
          onNavClick={(nav) => nav === 'dashboard' && irADashboard()}
        />

        {/* Main */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {vista === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MainDashboard onVerAnalisis={irAReporte} />
              </motion.div>
            )}
            {vista === 'reporte' && analysisId && (
              <motion.div key="reporte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ReportViewer analysisId={analysisId} onVolver={irADashboard} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="text-center py-6 text-xs text-white/70 px-4">
          <p>CODA — Análisis de seguridad de código</p>
        </footer>
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ToastContainer />
    </ProtectedRoute>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
