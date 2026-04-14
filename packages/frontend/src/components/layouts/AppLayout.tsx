import { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import NavigationSidebar from '../Navigation/NavigationSidebar';
import SearchHeader from '../Search/SearchHeader';
import ProtectedRoute from '../ProtectedRoute';
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

  // Map route paths to TabIds
  const getActiveTabFromPath = (pathname: string): TabId => {
    if (pathname.includes('/incidents')) return 'incidentes';
    if (pathname.includes('/projects')) return 'proyectos';
    if (pathname.includes('/analyses')) return 'reportes';
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/alerts')) return 'alertas';
    if (pathname.includes('/forensics')) return 'investigaciones';
    if (pathname.includes('/agents')) return 'agentes';
    if (pathname.includes('/system')) return 'sistema';
    if (pathname.includes('/costs')) return 'costos';
    return 'monitor-central';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleTabChange = (tabId: TabId) => {
    // Map TabId to route path
    const routeMap: Record<TabId, string> = {
      'monitor-central': '/dashboard',
      'proyectos': '/dashboard/projects',
      'reportes': '/dashboard/analyses',
      'comparacion': '/dashboard/analyses',
      'historico': '/dashboard/analyses',
      'incidentes': '/dashboard/incidents',
      'hallazgos': '/dashboard/incidents',
      'alertas': '/dashboard/alerts',
      'investigaciones': '/dashboard/forensics',
      'anomalias': '/dashboard/incidents',
      'agentes': '/dashboard/agents',
      'sistema': '/dashboard/system',
      'costos': '/dashboard/costs',
      'analytics': '/dashboard/analytics',
      'integraciones': '/dashboard/settings',
      'webhooks': '/dashboard/settings',
      'usuarios': '/dashboard/settings',
      'preferencias': '/dashboard/settings',
      'biblioteca': '/dashboard/settings',
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

          {/* Main Content Area - Uses margin-left to account for fixed sidebar (w-64 = 256px) */}
          <div className="flex-1 flex flex-col min-w-0 ml-64 transition-all duration-300">
            {/* Search Header */}
            <SearchHeader />

            {/* Main Content */}
            <main className="flex-1 relative z-10 overflow-auto">
              <div className="p-6 sm:p-8 lg:p-10">
                <AnimatePresence mode="wait">
                  <Outlet />
                </AnimatePresence>
              </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 px-6 sm:px-8 lg:px-10 py-6 border-t border-[#2D2D2D] text-center flex-shrink-0">
              <p className="text-[11px] text-[#4B5563]">
                SCR Agent — Code Observability & Defense
              </p>
            </footer>
          </div>
        </div>

        <ToastContainer />
      </ProtectedRoute>
    </SocketProvider>
  );
}
