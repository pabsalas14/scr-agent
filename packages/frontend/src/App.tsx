import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy load non-critical components
const MainDashboard = lazy(() => import('./components/Monitoring/MainDashboard'));
const ReportViewer = lazy(() => import('./components/Reports/ReportViewer'));
const SettingsModal = lazy(() => import('./components/Settings/SettingsModal'));

// Critical components (load immediately)
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import ToastContainer from './components/ui/Toast';
import Header from './components/Header';
import { socketClientService } from './services/socket.service';
import { SocketProvider } from './contexts/SocketContext';

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
  const { isAuthenticated } = useAuth();
  const initialVista = useMemo<Vista>(() => {
    return isAuthenticated() ? 'dashboard' : 'login';
  }, [isAuthenticated]);

  const [vista, setVista] = useState<Vista>(initialVista);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize Socket.io connection when authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;

    const initSocket = async () => {
      try {
        // Usar la URL del backend desde variable de entorno o construir dinámicamente
        const backendUrl = import.meta.env['VITE_BACKEND_URL'] ||
          `${window.location.protocol}//${window.location.hostname}:${import.meta.env['VITE_BACKEND_PORT'] || '3001'}`;

        await socketClientService.connect(backendUrl);
        setSocketConnected(true);
        console.log('✅ Socket.io connected and ready');

        // Set up event listeners for real-time updates
        socketClientService.onFindingStatusChanged((data) => {
          console.log('📢 Finding status changed via socket:', data);
          // This will trigger a refetch in components that are listening
          window.dispatchEvent(new CustomEvent('finding-updated', { detail: data }));
        });

        socketClientService.onFindingAssigned((data) => {
          console.log('📢 Finding assigned via socket:', data);
          window.dispatchEvent(new CustomEvent('finding-assigned', { detail: data }));
        });

        socketClientService.onRemediationUpdated((data) => {
          console.log('📢 Remediation updated via socket:', data);
          window.dispatchEvent(new CustomEvent('remediation-updated', { detail: data }));
        });

        socketClientService.onRemediationVerified((data) => {
          console.log('📢 Remediation verified via socket:', data);
          window.dispatchEvent(new CustomEvent('remediation-verified', { detail: data }));
        });

        socketClientService.onCommentAdded((data) => {
          console.log('📢 Comment added via socket:', data);
          window.dispatchEvent(new CustomEvent('comment-added', { detail: data }));
        });
      } catch (error) {
        console.error('❌ Failed to connect socket:', error);
        setSocketConnected(false);
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      socketClientService.disconnect();
      setSocketConnected(false);
    };
  }, [isAuthenticated]);

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

  // Loading fallback component
  const LoadingFallback = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin">⟳</div>
      <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando...</span>
    </div>
  );

  return (
    <SocketProvider socketConnected={socketConnected}>
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
                  <Suspense fallback={<LoadingFallback />}>
                    <MainDashboard onVerAnalisis={irAReporte} />
                  </Suspense>
                </motion.div>
              )}
              {vista === 'reporte' && analysisId && (
                <motion.div key="reporte" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Suspense fallback={<LoadingFallback />}>
                    <ReportViewer analysisId={analysisId} onVolver={irADashboard} />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          <footer className="text-center py-6 text-xs text-gray-400 px-4 border-t border-gray-700/50">
            <p>CodeShield — Advanced Security Analysis & Intelligence Platform</p>
          </footer>
        </div>

        <Suspense fallback={null}>
          <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </Suspense>
        <ToastContainer />
      </ProtectedRoute>
    </SocketProvider>
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
