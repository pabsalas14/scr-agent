import { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavigationSidebar from '../Navigation/NavigationSidebar';
import ProtectedRoute from '../ProtectedRoute';
import HelpSystem from '../Help/HelpSystem';
import { useAuth } from '../../hooks/useAuth';
import ToastContainer from '../ui/Toast';
import LoadingBar from '../ui/LoadingBar';
import { socketClientService } from '../../services/socket.service';
import { SocketProvider } from '../../contexts/SocketContext';
import { useToast } from '../../hooks/useToast';
import type { TabId } from '../../types/navigation';



export default function AppLayout() {
  const { isAuthenticated, user, clearToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [socketConnected, setSocketConnected] = useState(false);
  const toast = useToast();

  // Map route paths to TabIds (Updated for consolidated navigation)
  const getActiveTabFromPath = (pathname: string): TabId => {
    // New consolidated routes
    if (pathname.includes('/dashboard/hallazgos')) return 'hallazgos';
    if (pathname.includes('/dashboard/agentes')) return 'agentes';
    if (pathname.includes('/dashboard/control')) return 'control';
    if (pathname.includes('/dashboard/configuracion')) return 'configuracion';

    // Analysis routes (unchanged)
    if (pathname.includes('/dashboard/comparacion')) return 'comparacion';
    if (pathname.includes('/dashboard/historico')) return 'historico';
    if (pathname.includes('/dashboard/projects')) return 'proyectos';

    // Default to projects or monitor central
    if (pathname.includes('/dashboard')) return 'monitor-central';
    return 'monitor-central';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleTabChange = (tabId: TabId) => {
    // Map TabId to route path (consolidated navigation)
    const routeMap: Record<TabId, string> = {
      'monitor-central': '/dashboard',
      'proyectos': '/dashboard/projects',
      'reportes': '/dashboard/reportes',
      'comparacion': '/dashboard/comparacion',
      'historico': '/dashboard/historico',
      'hallazgos': '/dashboard/hallazgos',
      'agentes': '/dashboard/agentes',
      'control': '/dashboard/control',
      'configuracion': '/dashboard/configuracion',
    };

    const path = routeMap[tabId] || '/dashboard';
    navigate(path);
  };

  // Initialize Socket.io connection when authenticated (non-blocking, optional)
  useEffect(() => {
    if (!isAuthenticated()) return;

    const initSocket = async () => {
      try {
        // Try to connect socket, but don't block app if it fails
        // Uses VITE_SOCKET_URL from .env
        socketClientService.connect().then(() => {
          setSocketConnected(true);

          // Set up event listeners for real-time updates
          socketClientService.onFindingStatusChanged((data) => {
            window.dispatchEvent(new CustomEvent('finding-updated', { detail: data }));
            toast.info(`Hallazgo ${data.findingId} actualizado a ${data.newStatus}`);
          });

          socketClientService.onFindingAssigned((data) => {
            window.dispatchEvent(new CustomEvent('finding-assigned', { detail: data }));
            // Only notify if assigned to current user or if current user is admin
            if (data.assignedTo === user?.id) {
               toast.success(`¡Te han asignado un nuevo hallazgo!`);
            } else {
               toast.info(`Hallazgo asignado a analista`);
            }
          });

          socketClientService.onRemediationUpdated((data) => {
            window.dispatchEvent(new CustomEvent('remediation-updated', { detail: data }));
            toast.info(`Remediación actualizada para hallazgo ${data.findingId}`);
          });

          socketClientService.onRemediationVerified((data) => {
            window.dispatchEvent(new CustomEvent('remediation-verified', { detail: data }));
            toast.success(`✅ Remediación VERIFICADA para ${data.findingId}`);
          });

          socketClientService.onCommentAdded((data) => {
            window.dispatchEvent(new CustomEvent('comment-added', { detail: data }));
            // Only toast if it's not from current user
            if (data.userId !== user?.id) {
               toast.info(`${data.userName} comentó en un hallazgo`);
            }
          });
        }).catch((error) => {
          console.warn('⚠️ Socket connection failed:', error);
          setSocketConnected(false);
        });
      } catch (error) {
        setSocketConnected(false);
      }
    };

    initSocket();

    return () => {
      socketClientService.disconnect();
      setSocketConnected(false);
    };
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SocketProvider socketConnected={socketConnected}>
      <ProtectedRoute onUnauthenticated={() => window.location.href = '/login'}>
        <LoadingBar />
        <div className="min-h-screen bg-[#111111] flex text-[#A0A0A0]">
          {/* Sidebar Navigation */}
          <NavigationSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            userName={user?.name || 'Usuario'}
            onLogout={() => {
              clearToken();
              navigate('/login');
            }}
          />

          {/* Main Content Area - Uses margin-left to account for fixed sidebar (w-48 = 192px) */}
          <div className="flex-1 flex flex-col min-w-0 ml-48 pl-10 transition-all duration-300">
            {/* Main Content */}
            <main className="flex-1 relative z-10 overflow-auto">
              <div className="px-0 py-6">
                <AnimatePresence mode="wait">
                  <Outlet />
                </AnimatePresence>
              </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-0 py-3 border-t border-[#2D2D2D] text-center flex-shrink-0">
              <p className="text-[11px] text-[#4B5563]">
                SCR Agent — Code Observability & Defense
              </p>
            </footer>
          </div>
        </div>

        <HelpSystem />
        <ToastContainer />
      </ProtectedRoute>
    </SocketProvider>
  );
}
