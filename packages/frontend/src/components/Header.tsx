import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Settings, LogOut, User, Shield, Menu, X } from 'lucide-react';

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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const getNavLabel = () => {
    if (location.pathname.includes('/analyses/')) {
      return 'Análisis';
    }
    if (location.pathname.includes('/dashboard')) {
      return 'Proyectos';
    }
    return '';
  };

  const getInitials = () => {
    const email = localStorage.getItem('userEmail') || 'user@example.com';
    const parts = email.split('@')[0]?.split('.') || [];
    return parts
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <header className="border-b border-gray-200/20 dark:border-gray-700/50 bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 sticky top-0 z-40 shadow-lg dark:shadow-xl backdrop-blur-sm dark:backdrop-blur-md transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Responsive */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 sm:gap-3 hover:opacity-85 transition-opacity duration-300 group flex-shrink-0"
            aria-label="Go to dashboard"
          >
            <div className="p-2 sm:p-2.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg sm:rounded-xl group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="hidden xs:hidden sm:block">
              <p className="font-black text-gray-900 dark:text-white text-sm sm:text-base tracking-tight">CodeShield</p>
              <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold">Security Analysis</p>
            </div>
          </button>

          {/* Breadcrumb / Navigation - Center (Hidden on mobile) */}
          {!isLogin && (
            <div className="hidden md:flex items-center gap-2 flex-1 ml-8 lg:ml-12">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
              >
                Proyectos
              </button>
              {location.pathname.includes('/analyses/') && (
                <>
                  <span className="text-gray-400 dark:text-gray-600 text-sm">/</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getNavLabel()}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Right Controls - Responsive */}
          {!isLogin && (
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Theme Toggle */}
              <button
                onClick={onThemeToggle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

              {/* Settings - Hidden on small screens */}
              <button
                onClick={onSettingsClick}
                className="hidden sm:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User Avatar / Dropdown */}
              <div className="relative ml-1 sm:ml-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600 dark:to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white font-medium text-xs transition-all duration-200 shadow-md hover:shadow-lg"
                  title="User menu"
                  aria-label="User menu"
                >
                  {getInitials()}
                </button>

                {/* Dropdown Menu - Better mobile positioning */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {localStorage.getItem('userEmail') || 'User'}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onSettingsClick();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      <span>Profile</span>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span>Logout</span>
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
