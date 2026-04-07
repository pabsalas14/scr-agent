import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BarChart3,
  LayoutDashboard,
  Settings,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Monitor,
  Folder
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  onSettingsClick?: () => void;
}

export default function Sidebar({ onSettingsClick = () => {} }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Monitor Central', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'projects', label: 'Proyectos', icon: Folder, path: '/projects' },
    { id: 'analytics', label: 'Analíticas', icon: BarChart3, path: '/analytics' },
    { id: 'incidents', label: 'Incidentes', icon: ShieldAlert, path: '/dashboard?tab=incidents' },
    { id: 'monitors', label: 'Estado Global', icon: Monitor, path: '/dashboard?tab=system' },
  ];

  const getInitials = () => {
    const email = localStorage.getItem('userEmail') || 'US';
    return email.split('@')[0]?.slice(0, 2).toUpperCase() || 'US';
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-[#1C1C1E] border-r border-[#2D2D2D] transition-all duration-500 z-50 flex flex-col shadow-[4px_0_16px_rgba(0,0,0,0.4)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Section */}
      <div className="p-5 flex items-center gap-3 overflow-hidden border-b border-[#2D2D2D]">
        <div className="w-10 h-10 rounded-xl bg-[#F97316] flex-shrink-0 flex items-center justify-center shadow-[0_0_16px_rgba(249,115,22,0.3)]">
          <img src="/logo.png" alt="SCR" className="w-6 h-6 object-contain" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">SCR Agent</h1>
              <div className="flex items-center gap-1 bg-[#22C55E]/10 border border-[#22C55E]/20 px-1.5 py-0.5 rounded-md">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-[9px] font-semibold text-[#22C55E]">Live</span>
              </div>
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">Defensa Agéntica</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname + location.search === item.path || (location.pathname === item.path && item.id === 'dashboard');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-[#F97316]/10 text-[#F97316]'
                  : 'text-[#6B7280] hover:text-[#A0A0A0] hover:bg-[#242424]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-pill"
                  className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#F97316] rounded-r-full"
                />
              )}
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-[#F97316]' : ''}`} />
              {!isCollapsed && (
                <span className="text-sm font-medium animate-in fade-in duration-300">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[#2D2D2D] space-y-1">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#6B7280] hover:bg-[#242424] hover:text-[#A0A0A0] transition-all"
        >
          <Settings className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm font-medium">Configuración</span>}
        </button>

        <div className="mt-2 pt-2 border-t border-[#2D2D2D]">
          <button
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#242424] border border-[#2D2D2D] hover:border-[#F97316]/30 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center justify-center text-[10px] font-bold text-[#F97316]">
              {getInitials()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {localStorage.getItem('userEmail')?.split('@')[0] || 'Analista'}
                </p>
                <p className="text-[10px] text-[#6B7280]">Nivel 4</p>
              </div>
            )}
            {!isCollapsed && (
              <LogOut
                onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                className="w-3.5 h-3.5 text-[#4B5563] hover:text-[#EF4444] transition-colors cursor-pointer"
              />
            )}
          </button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-[#2D2D2D] text-[#A0A0A0] p-1 rounded-full border border-[#404040] hover:bg-[#F97316] hover:border-[#F97316] hover:text-white transition-all duration-200 z-[60] shadow-lg"
      >
        <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>
    </aside>
  );
}
