import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, AlertTriangle, Lock, Zap, FileSearch, Network,
  Shield, ChevronDown, TrendingUp, Code2, type LucideIcon
} from 'lucide-react';
import type { Hallazgo } from '../../types/api';

interface IncidentResponseViewerProps {
  analysisId: string;
  hallazgos?: Hallazgo[];
  isLoading?: boolean;
}

interface Pattern {
  name: string;
  icon: LucideIcon;
  color: string;
  count: number;
  description: string;
}

export default function IncidentResponseViewer({ hallazgos = [], isLoading }: IncidentResponseViewerProps) {
  const [expandedSection, setExpandedSection] = useState<string>('patterns');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-8 h-8 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
        <span className="text-sm text-[#6B7280]">Analizando arquitectura...</span>
      </div>
    );
  }

  // Detect patterns from hallazgos
  const patterns: Pattern[] = [
    {
      name: 'Vulnerabilidades de Autenticación',
      icon: Lock,
      color: '#EF4444',
      count: hallazgos.filter(h => h.riskType?.toLowerCase().includes('auth')).length,
      description: 'Fallos en mecanismos de autenticación y manejo de sesiones',
    },
    {
      name: 'Inyección SQL',
      icon: AlertTriangle,
      color: '#F97316',
      count: hallazgos.filter(h => h.riskType?.toLowerCase().includes('sql')).length,
      description: 'Construcción insegura de queries y validación de entrada',
    },
    {
      name: 'Exposición de Datos',
      icon: Shield,
      color: '#EAB308',
      count: hallazgos.filter(h => h.riskType?.toLowerCase().includes('data')).length,
      description: 'Información sensible expuesta o sin cifrar',
    },
    {
      name: 'Configuración Insegura',
      icon: Zap,
      color: '#22C55E',
      count: hallazgos.filter(h => h.riskType?.toLowerCase().includes('config')).length,
      description: 'Configuraciones predeterminadas y opciones inseguras',
    },
  ];

  // Analyze file architecture
  const files = [...new Set(hallazgos.map(h => h.file).filter(Boolean))] as string[];
  const fileStructure: Record<string, number> = files.reduce(
    (acc: Record<string, number>, f: string) => {
      const parts = (f || '').split('/');
      const layer: string = (parts.length > 2 ? parts[0] : 'root') || 'root';
      if (!acc[layer]) acc[layer] = 0;
      acc[layer]++;
      return acc;
    },
    {}
  );

  // Calculate risk distribution
  const riskByType: Record<string, number> = hallazgos.reduce(
    (acc, h) => {
      const type = h.severity || 'MEDIUM';
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <FileSearch className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Archivos Analizados</span>
          </div>
          <p className="text-3xl font-bold text-white">{files.length}</p>
        </div>

        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Code2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Patrones Detectados</span>
          </div>
          <p className="text-3xl font-bold text-white">{patterns.filter(p => p.count > 0).length}</p>
        </div>

        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Hallazgos Críticos</span>
          </div>
          <p className="text-3xl font-bold text-[#EF4444]">{riskByType['CRITICAL'] || 0}</p>
        </div>

        <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#6B7280]">
            <Network className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Dependencias de Riesgo</span>
          </div>
          <p className="text-3xl font-bold text-[#F97316]">{hallazgos.length}</p>
        </div>
      </div>

      {/* Patterns Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl overflow-hidden"
      >
        <button
          onClick={() => setExpandedSection(expandedSection === 'patterns' ? '' : 'patterns')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#242424] transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F97316]" />
            <span className="text-lg font-semibold text-white">Patrones Detectados</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#6B7280] transition-transform ${
              expandedSection === 'patterns' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'patterns' && (
          <div className="px-6 py-4 border-t border-[#2D2D2D] space-y-3">
            {patterns.map((pattern) => {
              const Icon = pattern.icon;
              return (
                <div
                  key={pattern.name}
                  className="flex items-start justify-between p-4 bg-[#242424]/50 rounded-lg border border-[#2D2D2D]"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${pattern.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: pattern.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{pattern.name}</h4>
                      <p className="text-xs text-[#6B7280] mt-1">{pattern.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold" style={{ color: pattern.color }}>
                      {pattern.count}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1">ocurrencias</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* File Architecture */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl overflow-hidden"
      >
        <button
          onClick={() => setExpandedSection(expandedSection === 'architecture' ? '' : 'architecture')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#242424] transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#22C55E]" />
            <span className="text-lg font-semibold text-white">Arquitectura</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#6B7280] transition-transform ${
              expandedSection === 'architecture' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'architecture' && (
          <div className="px-6 py-4 border-t border-[#2D2D2D] space-y-3">
            {Object.entries(fileStructure).map(([layer, count]) => (
              <div key={layer} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#F97316]" />
                    {layer}
                  </p>
                  <span className="px-2 py-1 bg-[#F97316]/10 text-[#F97316] text-xs font-semibold rounded">
                    {count} archivo{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#F97316] to-[#EAB308] h-full transition-all"
                    style={{
                      width: `${Math.min(100, (count / Math.max(...Object.values(fileStructure))) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Risk Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl overflow-hidden"
      >
        <button
          onClick={() => setExpandedSection(expandedSection === 'risk' ? '' : 'risk')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#242424] transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#EF4444]" />
            <span className="text-lg font-semibold text-white">Distribución de Riesgo</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-[#6B7280] transition-transform ${
              expandedSection === 'risk' ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSection === 'risk' && (
          <div className="px-6 py-4 border-t border-[#2D2D2D] space-y-3">
            {[
              { level: 'CRITICAL', count: riskByType['CRITICAL'] || 0 },
              { level: 'HIGH', count: riskByType['HIGH'] || 0 },
              { level: 'MEDIUM', count: riskByType['MEDIUM'] || 0 },
              { level: 'LOW', count: riskByType['LOW'] || 0 },
            ].map(({ level, count }) => {
              const colors = {
                CRITICAL: { bg: 'bg-[#EF4444]', text: 'text-[#EF4444]' },
                HIGH: { bg: 'bg-[#F97316]', text: 'text-[#F97316]' },
                MEDIUM: { bg: 'bg-[#EAB308]', text: 'text-[#EAB308]' },
                LOW: { bg: 'bg-[#22C55E]', text: 'text-[#22C55E]' },
              };
              const color = colors[level as keyof typeof colors];

              return (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{level}</p>
                    <span className={`px-2 py-1 ${color.bg}/10 ${color.text} text-xs font-semibold rounded`}>
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-[#2D2D2D] h-3 rounded-full overflow-hidden">
                    <div
                      className={`${color.bg} h-full transition-all`}
                      style={{
                        width: `${Math.max(5, (count / hallazgos.length) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
