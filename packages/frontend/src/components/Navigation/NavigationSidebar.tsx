/**
 * ============================================================================
 * NAVIGATION SIDEBAR - New grouped navigation structure
 * ============================================================================
 * Renders navigation with 5 logical groups instead of 11 scattered tabs.
 * Each group is collapsible and shows related features together.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, Home, TrendingUp, Shield, Zap, Settings,
  Activity, FolderOpen, BarChart2, History, Radio, AlertOctagon,
  Terminal, Wand2, Server, DollarSign, BarChart3, Webhook,
  Users, Bell, LogOut, User as UserIcon, Cpu, AlertTriangle
} from 'lucide-react';
import type { TabGroup, TabId, GroupId } from '../../types/navigation';

interface NavigationSidebarProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  userName?: string;
  onLogout?: () => void;
  collapsed?: boolean;
  badgeOverrides?: Record<TabId, number | string>; // Dynamic badge data from parent
}

/**
 * Navigation structure - organized into 5 logical groups
 */
const getNavigationGroups = (): TabGroup[] => [
  {
    groupId: 'inicio',
    groupLabel: 'INICIO',
    groupIcon: Home,
    collapsible: false,
    defaultExpanded: true,
    tabs: [
      {
        id: 'monitor-central',
        label: 'Monitor Central',
        icon: Activity,
        description: 'Vista general en tiempo real',
        component: null as any,
        requiresAuth: true,
      },
    ],
  },
  {
    groupId: 'analisis',
    groupLabel: 'ANÁLISIS',
    groupIcon: TrendingUp,
    collapsible: true,
    defaultExpanded: true,
    tabs: [
      {
        id: 'proyectos',
        label: 'Proyectos',
        icon: FolderOpen,
        description: 'Gestión de repositorios',
        component: null as any,
        requiresAuth: true,
      },
      {
        id: 'reportes',
        label: 'Reportes',
        icon: BarChart3,
        description: 'Histórico de análisis',
        component: null as any,
        requiresAuth: true,
      },
      {
        id: 'comparacion',
        label: 'Comparación',
        icon: BarChart2,
        description: 'Comparar dos análisis',
        component: null as any,
        requiresAuth: true,
      },
      {
        id: 'historico',
        label: 'Histórico',
        icon: History,
        description: 'Tendencias y evolución',
        component: null as any,
        requiresAuth: true,
      },
    ],
  },
  {
    groupId: 'seguridad',
    groupLabel: 'SEGURIDAD',
    groupIcon: Shield,
    collapsible: true,
    defaultExpanded: true,
    tabs: [
      {
        id: 'hallazgos',
        label: 'Hallazgos',
        icon: AlertOctagon,
        description: 'Hallazgos, incidentes, alertas unificadas',
        component: null as any,
        requiresAuth: true,
      },
    ],
  },
  {
    groupId: 'operaciones',
    groupLabel: 'OPERACIONES',
    groupIcon: Server,
    collapsible: true,
    defaultExpanded: false,
    tabs: [
      {
        id: 'agentes',
        label: 'Agentes',
        icon: Wand2,
        description: 'Estado y configuración de agentes',
        component: null as any,
        requiresAuth: true,
      },
      {
        id: 'control',
        label: 'Centro de Control',
        icon: BarChart2,
        description: 'Métricas y visibilidad operacional',
        component: null as any,
        requiresAuth: true,
      },
    ],
  },
  {
    groupId: 'configuracion',
    groupLabel: 'CONFIGURACIÓN',
    groupIcon: Settings,
    collapsible: true,
    defaultExpanded: false,
    tabs: [
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: Webhook,
        description: 'Integraciones y preferencias',
        component: null as any,
        requiresAuth: true,
      },
    ],
  },
];

export default function NavigationSidebar({
  activeTab,
  onTabChange,
  userName = 'Usuario',
  onLogout,
  collapsed = false,
  badgeOverrides = {},
}: NavigationSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<GroupId>>(() => {
    const groups = getNavigationGroups();
    return new Set(groups.filter(g => g.defaultExpanded).map(g => g.groupId));
  });

  const navGroups = useMemo(() => getNavigationGroups(), []);

  const toggleGroup = (groupId: GroupId) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <div className={`fixed left-0 top-0 flex flex-col h-screen bg-[#0A0A0F] border-r border-[#2D2D2D] ${collapsed ? 'w-20' : 'w-48'} transition-all duration-300 z-50`}>
      {/* Logo/Branding */}
      <div className="p-4 border-b border-[#2D2D2D]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#F97316] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && <span className="text-sm font-bold text-white">SCR Agent</span>}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-2 px-2">
        <AnimatePresence>
          {navGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.groupId);
            const GroupIcon = group.groupIcon;

            return (
              <motion.div key={group.groupId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Group Header */}
                <button
                  onClick={() => {
                    if (group.collapsible) {
                      toggleGroup(group.groupId);
                    }
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    collapsed ? 'justify-center' : 'justify-between'
                  } ${group.collapsible ? 'hover:bg-[#1E1E20] cursor-pointer' : 'cursor-default'}`}
                  title={collapsed ? group.groupLabel : undefined}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GroupIcon className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                    {!collapsed && <span className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">{group.groupLabel}</span>}
                  </div>
                  {group.collapsible && !collapsed && (
                    <ChevronDown
                      className={`w-4 h-4 text-[#6B7280] transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                    />
                  )}
                </button>

                {/* Tabs in Group */}
                <AnimatePresence>
                  {isExpanded && !collapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1 pl-4"
                    >
                      {group.tabs.map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = activeTab === tab.id;
                        // Use badge override if provided, otherwise use tab.badge
                        const displayBadge = badgeOverrides[tab.id] ?? tab.badge;

                        return (
                          <motion.button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                              isActive
                                ? 'bg-[#F97316] text-white'
                                : 'text-[#A0A0A0] hover:text-white hover:bg-[#1E1E20]'
                            }`}
                            title={tab.description}
                          >
                            <TabIcon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{tab.label}</span>
                            {displayBadge && (
                              <span className="ml-auto text-xs bg-[#EF4444] text-white rounded-full px-2 py-0.5 flex-shrink-0">
                                {displayBadge}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t border-[#2D2D2D] p-3 space-y-2">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs text-[#6B7280]">Conectado como</p>
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
          </div>
        )}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#A0A0A0] hover:text-white hover:bg-[#EF4444]/10 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Salir</span>}
          </button>
        )}
      </div>
    </div>
  );
}
