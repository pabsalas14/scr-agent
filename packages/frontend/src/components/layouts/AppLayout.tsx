import { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from '../Sidebar';
import ProtectedRoute from '../ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import ToastContainer from '../ui/Toast';
import LoadingBar from '../ui/LoadingBar';
import { socketClientService } from '../../services/socket.service';
import { SocketProvider } from '../../contexts/SocketContext';
import { useToast } from '../../hooks/useToast';



export default function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const [socketConnected, setSocketConnected] = useState(false);
  const toast = useToast();

  // Initialize Socket.io connection when authenticated (non-blocking, optional)
  useEffect(() => {
    if (!isAuthenticated()) return;

    const initSocket = async () => {
      try {
        // Try to connect socket, but don't block app if it fails
        // Connect to '/' to use Vite proxy allowing ws connections to /socket.io
        socketClientService.connect('/').then(() => {
          setSocketConnected(true);
          console.log('✅ Socket.io connected and ready');

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
        <div className="min-h-screen bg-[#050505] flex text-[#94A3B8]">
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 pl-20 lg:pl-64 transition-all duration-300">
            {/* Soft Radial Spotlight Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
               <div className="absolute -top-[10%] left-[10%] w-[60%] h-[40%] bg-[#00D1FF]/5 blur-[120px] rounded-full" />
               <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-[#7000FF]/5 blur-[120px] rounded-full" />
            </div>

            <main className="flex-1 relative z-10 p-6 sm:p-8 lg:p-10">
              <AnimatePresence mode="wait">
                <Outlet />
              </AnimatePresence>
            </main>

            <footer className="relative z-10 px-10 py-8 border-t border-[#1F2937]/30 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#475569]">
                CODA — Code Observability & Defense Agentic 
              </p>
            </footer>
          </div>
        </div>


        <ToastContainer />
      </ProtectedRoute>
    </SocketProvider>
  );
}
