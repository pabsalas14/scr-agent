/**
 * DashboardTabs Component
 * Main dashboard with 4 tabs: Health, Costs, Findings, Scans
 */

import React, { useState } from 'react';
import { Activity, DollarSign, AlertOctagon, TrendingUp } from 'lucide-react';
import HealthTab from './HealthTab';
import CostsTab from './CostsTab';
import FindingsTab from './FindingsTab';
import ScansTab from './ScansTab';

export default function DashboardTabs() {
  const [activeTab, setActiveTab] = useState<'health' | 'costs' | 'findings' | 'scans'>('health');

  const tabs = [
    {
      id: 'health' as const,
      label: 'Salud & Estado',
      icon: Activity,
      component: HealthTab,
    },
    {
      id: 'costs' as const,
      label: 'Costos & Recursos',
      icon: DollarSign,
      component: CostsTab,
    },
    {
      id: 'findings' as const,
      label: 'Hallazgos & Seguridad',
      icon: AlertOctagon,
      component: FindingsTab,
    },
    {
      id: 'scans' as const,
      label: 'Escaneos & Análisis',
      icon: TrendingUp,
      component: ScansTab,
    },
  ];

  const currentTab = tabs.find((t) => t.id === activeTab);
  const CurrentComponent = currentTab?.component;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#2D2D2D] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs text-[#6B7280]">Monitorización activa</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Monitor Central</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[#2D2D2D] pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors text-sm font-medium ${
                isActive
                  ? 'border-[#F97316] text-[#F97316]'
                  : 'border-transparent text-[#A0A0A0] hover:text-white'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {CurrentComponent && <CurrentComponent />}
    </div>
  );
}
