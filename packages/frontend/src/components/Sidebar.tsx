import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  User, 
  ShieldAlert,
  ChevronRight,
  Monitor
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  onSettingsClick: () => void;
}

export default function Sidebar({ onSettingsClick }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Monitor', icon: LayoutDashboard, path: '/dashboard' },
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
      className={`fixed left-0 top-0 h-full bg-[#0A0B10]/95 backdrop-blur-xl border-r border-[#1F2937]/50 transition-all duration-500 z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Section */}
      <div className="p-6 flex items-center gap-4 overflow-hidden border-b border-[#1F2937]/30">
        <div className="relative group">
          <div className="absolute inset-0 bg-[#00D1FF]/20 blur-lg rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D1FF] to-[#7000FF] flex-shrink-0 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(0,209,255,0.4)]">
            <img src="/logo.png" alt="CODA" className="w-6 h-6 object-contain" />
          </div>
        </div>
          <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-700">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tighter leading-none">CODA</h1>
              <div className="flex items-center gap-1 bg-[#00FF94]/10 border border-[#00FF94]/20 px-1.5 py-0.5 rounded-md">
                 <div className="w-1 h-1 rounded-full bg-[#00FF94] animate-pulse shadow-[0_0_5px_#00FF94]" />
                 <span className="text-[7px] font-black text-[#00FF94] uppercase tracking-tighter">Live</span>
              </div>
            </div>
            <p className="text-[9px] text-[#00D1FF] font-black uppercase tracking-[0.2em] mt-1.5 opacity-80">Defensa Agéntica</p>
          </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-8 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = location.pathname + location.search === item.path || (location.pathname === item.path && item.id === 'dashboard');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => item.path !== '#' && navigate(item.path)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                isActive 
                  ? 'bg-gradient-to-r from-[#00D1FF]/15 to-transparent text-[#00D1FF]' 
                  : 'text-[#64748B] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-[#00D1FF] rounded-r-full shadow-[2px_0_10px_#00D1FF]"
                />
              )}
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-[#00D1FF] drop-shadow-[0_0_8px_rgba(0,209,255,0.5)]' : 'group-hover:text-[#00D1FF]'}`} />
              {!isCollapsed && (
                <span className="text-[13px] font-bold tracking-tight animate-in fade-in duration-500">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 bg-black/20 border-t border-[#1F2937]/30 space-y-2">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-[#64748B] hover:bg-white/5 hover:text-white transition-all group group-hover:shadow-inner"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-700" />
          {!isCollapsed && <span className="text-[13px] font-bold">Configuración</span>}
        </button>

        <div className="relative group/user mt-4">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00D1FF]/5 to-[#7000FF]/5 blur-xl rounded-2xl opacity-0 group-hover/user:opacity-100 transition-opacity" />
          <button
            className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-[#0F1117]/80 border border-[#1F2937]/50 hover:border-[#00D1FF]/30 transition-all relative z-10 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1F2937] to-[#0A0B10] flex items-center justify-center text-[11px] font-black text-white border border-white/10 shadow-lg">
              {getInitials()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden">
                <p className="text-xs font-black text-white truncate tracking-tight">
                  {localStorage.getItem('userEmail')?.split('@')[0] || 'Analista'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] animate-pulse" />
                  <p className="text-[9px] text-[#64748B] font-black uppercase tracking-widest">Nivel 4</p>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <LogOut 
                onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
                className="ml-auto w-4 h-4 text-[#3D4A5C] hover:text-[#FF3B3B] transition-colors cursor-pointer" 
              />
            )}
          </button>
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 bg-[#1F2937] text-white p-1 rounded-full border border-[#334155] hover:bg-[#00D1FF] hover:border-[#00D1FF] transition-all duration-300 z-[60] shadow-xl group"
      >
        <ChevronRight className={`w-3 h-3 transition-transform duration-500 ${isCollapsed ? '' : 'rotate-180'} group-hover:scale-125`} />
      </button>
    </aside>
  );
}
