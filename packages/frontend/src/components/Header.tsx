import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Settings, LogOut, User, Shield, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications.service';
import NotificationPanel from './ui/NotificationPanel';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onSettingsClick: () => void;
}

export default function Header({
  theme,
  onThemeToggle,
  onSettingsClick,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsService.getUnreadCount(),
    refetchInterval: 60_000,
  });

  const getNavLabel = () => {
    if (location.pathname.includes('/analyses/')) return 'Análisis';
    if (location.pathname.includes('/dashboard')) return 'Proyectos';
    return '';
  };

  const getInitials = () => {
    const email = localStorage.getItem('userEmail') || 'user@example.com';
    const parts = email.split('@')[0]?.split('.') || [];
    return parts.map((part: string) => part[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header className="border-b border-[#2D2D2D] bg-[#1C1C1E] sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group flex-shrink-0"
            aria-label="Go to dashboard"
          >
            <div className="p-1.5 bg-[#F97316] rounded-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-semibold text-white text-sm">SCR Agent</p>
            </div>
          </button>

          {/* Breadcrumb */}
          {!isLogin && (
            <div className="hidden md:flex items-center gap-2 flex-1 ml-8">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-[#6B7280] hover:text-[#A0A0A0] transition-colors"
              >
                Proyectos
              </button>
              {location.pathname.includes('/analyses/') && (
                <>
                  <span className="text-[#4B5563] text-sm">/</span>
                  <span className="text-sm font-medium text-[#A0A0A0]">{getNavLabel()}</span>
                </>
              )}
            </div>
          )}

          {/* Right Controls */}
          {!isLogin && (
            <div className="flex items-center gap-1">
              <button
                onClick={onThemeToggle}
                className="p-2 hover:bg-[#242424] rounded-lg text-[#6B7280] hover:text-[#A0A0A0] transition-all"
                title="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <button
                onClick={onSettingsClick}
                className="hidden sm:block p-2 hover:bg-[#242424] rounded-lg text-[#6B7280] hover:text-[#A0A0A0] transition-all"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Campana de notificaciones */}
              <div className="relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                  className="relative p-2 hover:bg-[#242424] rounded-lg text-[#6B7280] hover:text-[#A0A0A0] transition-all"
                  title="Notificaciones"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#EF4444] border border-[#1C1C1E]" />
                  )}
                </button>
                {showNotifications && (
                  <NotificationPanel onClose={() => setShowNotifications(false)} />
                )}
              </div>

              <div className="relative ml-1">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 text-[#F97316] font-semibold text-xs hover:bg-[#F97316]/20 transition-all"
                  title="User menu"
                >
                  {getInitials()}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1E] rounded-xl shadow-xl border border-[#2D2D2D] py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-[#2D2D2D]">
                      <p className="text-sm font-medium text-white truncate">
                        {localStorage.getItem('userEmail') || 'User'}
                      </p>
                    </div>

                    <button
                      onClick={() => { setShowUserMenu(false); onSettingsClick(); }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#242424] hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span>Configuración</span>
                    </button>

                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#A0A0A0] hover:bg-[#242424] hover:text-white transition-colors"
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>Perfil</span>
                    </button>

                    <div className="border-t border-[#2D2D2D]" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
