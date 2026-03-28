import { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from '../Header';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import ToastContainer from '../ui/Toast';
import { socketClientService } from '../../services/socket.service';
import { SocketProvider } from '../../contexts/SocketContext';

const SettingsModal = lazy(() => import('../Settings/SettingsModal'));

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [socketConnected, setSocketConnected] = useState(false);

  // Initialize Socket.io connection when authenticated
  useEffect(() => {
    if (!isAuthenticated()) return;

    const initSocket = async () => {
      try {
        const backendUrl = import.meta.env['VITE_BACKEND_URL'] ||
          `${window.location.protocol}//${window.location.hostname}:${import.meta.env['VITE_BACKEND_PORT'] || '3001'}`;

        await socketClientService.connect(backendUrl);
        setSocketConnected(true);
        console.log('✅ Socket.io connected and ready');

        // Set up event listeners for real-time updates
        socketClientService.onFindingStatusChanged((data) => {
          console.log('📢 Finding status changed via socket:', data);
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

    return () => {
      socketClientService.disconnect();
      setSocketConnected(false);
    };
  }, [isAuthenticated]);

  const toggleTheme = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SocketProvider socketConnected={socketConnected}>
      <ProtectedRoute onUnauthenticated={() => window.location.href = '/login'}>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-teal-600 to-blue-600 dark:from-slate-900 dark:to-slate-800">
          {/* Header Component */}
          <Header
            theme={theme}
            onThemeToggle={toggleTheme}
            onSettingsClick={() => setSettingsOpen(true)}
          />

          {/* Main */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <Outlet />
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
