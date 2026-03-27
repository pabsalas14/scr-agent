import { useState } from 'react';
import { Moon, Sun, Settings, LogOut, User, Shield } from 'lucide-react';

interface HeaderProps {
  vista: 'dashboard' | 'reporte' | 'login';
  theme: 'light' | 'dark';
  onLogoClick: () => void;
  onThemeToggle: () => void;
  onSettingsClick: () => void;
  onNavClick?: (nav: string) => void;
}

export default function Header({
  vista,
  theme,
  onLogoClick,
  onThemeToggle,
  onSettingsClick,
  onNavClick,
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getNavLabel = () => {
    switch (vista) {
      case 'reporte':
        return 'Reporte';
      case 'dashboard':
        return 'Proyectos';
      default:
        return '';
    }
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
    <header className="border-b border-gray-700/50 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Mejorado */}
          <button
            onClick={onLogoClick}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity duration-300 group"
            aria-label="Go to dashboard"
          >
            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl group-hover:shadow-xl group-hover:shadow-blue-500/50 transition-all duration-300">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-white text-base tracking-tight">CodeShield</p>
              <p className="text-xs text-cyan-400 font-semibold">Security Analysis</p>
            </div>
          </button>

          {/* Breadcrumb / Navigation - Center */}
          {vista !== 'login' && (
            <div className="hidden sm:flex items-center gap-2 flex-1 ml-12">
              <button
                onClick={() => onNavClick?.('dashboard')}
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Proyectos
              </button>
              {vista === 'reporte' && (
                <>
                  <span className="text-gray-400 dark:text-gray-600 text-sm">/</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getNavLabel()}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Right Controls */}
          {vista !== 'login' && (
            <div className="flex items-center gap-1">
              {/* Theme Toggle */}
              <button
                onClick={onThemeToggle}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 transition-colors"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>

              {/* Settings */}
              <button
                onClick={onSettingsClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-700 dark:text-gray-300 transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* User Avatar / Dropdown */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 text-white font-medium text-xs transition-colors"
                  title="User menu"
                  aria-label="User menu"
                >
                  {getInitials()}
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
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
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Navigate to profile
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-700" />

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
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
