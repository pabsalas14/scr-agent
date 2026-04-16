import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch, AlertTriangle, AlertOctagon, Lock, Zap, FileSearch, Network,
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
  details?: string;
  remediation?: string;
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

  // Group hallazgos by risk type AND function for dynamic pattern detection
  const riskTypeGroups = hallazgos.reduce((acc: Record<string, typeof hallazgos>, h) => {
    const type = h.riskType || 'Otro';
    if (!acc[type]) acc[type] = [];
    acc[type].push(h);
    return acc;
  }, {});

  // Detect DYNAMIC patterns from actual findings discovered across the analysis
  // This learns from each repo's unique vulnerability profile
  const patterns: Pattern[] = Object.entries(riskTypeGroups).map(([riskType, items]) => {
    // Dynamic color assignment based on severity of findings in this pattern
    const severities = items.map(i => i.severity?.toUpperCase() || 'MEDIUM');
    const hasCritical = severities.includes('CRITICAL');
    const hasHigh = severities.includes('HIGH');

    const getColorByRisk = (): string => {
      if (hasCritical) return '#EF4444'; // Red for CRITICAL
      if (hasHigh) return '#FB923C';     // Orange for HIGH
      return '#EAB308';                   // Yellow for MEDIUM/LOW
    };

    // Get meaningful pattern description
    const getDescription = (type: string, items: typeof hallazgos): string => {
      if (items.length === 0) return 'No hallazgos detectados';

      const affectedFiles = new Set(items.map(i => i.file)).size;
      const affectedFunctions = new Set(items.map(i => i.function).filter(Boolean)).size;

      let desc = `${items.length} hallazgo${items.length !== 1 ? 's' : ''} en ${affectedFiles} archivo${affectedFiles !== 1 ? 's' : ''}`;
      if (affectedFunctions > 0) {
        desc += ` (${affectedFunctions} función${affectedFunctions !== 1 ? 's' : ''} afectada${affectedFunctions !== 1 ? 's' : ''})`;
      }
      return desc;
    };

    // Get pattern-specific details and remediation
    const getPatternDetails = (type: string): { details: string; remediation: string } => {
      const detailsMap: Record<string, { details: string; remediation: string }> = {
        'BACKDOOR': {
          details: 'Potencial punto de acceso no autorizado o código oculto detectado',
          remediation: 'Auditar todo el código para funciones no documentadas, rutas de acceso especiales o comandos remotos'
        },
        'LOGIC_BOMB': {
          details: 'Código diseñado para ejecutarse bajo condiciones específicas y causar daño',
          remediation: 'Eliminar condicionales sospechosos, implementar validación de permisos en tiempo de ejecución'
        },
        'INJECTION': {
          details: 'Vulnerabilidad donde datos no validados se interpretan como código',
          remediation: 'Usar parameterized queries, validar y escapar todas las entradas de usuario'
        },
        'ERROR_HANDLING': {
          details: 'Manejo de errores incorrecto que expone información sensible o causa comportamiento impredecible',
          remediation: 'Implementar try-catch adecuado, registrar errores de forma segura sin revelar detalles internos'
        },
        'HARDCODED_VALUES': {
          details: 'Valores sensibles (contraseñas, claves, URLs) codificados directamente en el código',
          remediation: 'Mover a variables de entorno o gestor de secretos, nunca commitear secretos'
        },
        'OBFUSCATION': {
          details: 'Código ofuscado o compilado que impide el análisis y auditoría',
          remediation: 'Usar código fuente legible, documentar lógica compleja, mantener mapas de símbolos'
        },
        'SUSPICIOUS': {
          details: 'Patrones de código inusuales o comportamientos sospechosos detectados',
          remediation: 'Revisar contexto, documentar intención del código, considerar refactorización'
        }
      };
      return detailsMap[type] || {
        details: `Potencial problema de seguridad detectado en el patrón ${type}`,
        remediation: 'Revisar el código y consultar con el equipo de seguridad'
      };
    };

    const patternInfo = getPatternDetails(riskType);

    return {
      name: `${riskType}${hasCritical ? ' ⚠️ CRÍTICO' : hasHigh ? ' ⚠️ ALTO' : ''}`,
      icon: hasCritical ? AlertOctagon : AlertTriangle,
      color: getColorByRisk(),
      count: items.length,
      description: getDescription(riskType, items),
      details: patternInfo.details,
      remediation: patternInfo.remediation,
    };
  }).sort((a, b) => {
    // Sort by count first, then by severity (critical first)
    if (b.count !== a.count) return b.count - a.count;
    return (b.name.includes('CRÍTICO') ? 1 : 0) - (a.name.includes('CRÍTICO') ? 1 : 0);
  });

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
                  className="p-4 bg-[#242424]/50 rounded-lg border border-[#2D2D2D] space-y-3 hover:bg-[#242424]/70 transition-colors"
                >
                  <div className="flex items-start justify-between">
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

                  {/* Pattern Details */}
                  {pattern.details && (
                    <div className="border-t border-[#2D2D2D] pt-3 space-y-2">
                      <div>
                        <p className="text-xs font-semibold text-[#6B7280] uppercase">¿Qué es?</p>
                        <p className="text-xs text-white mt-1">{pattern.details}</p>
                      </div>
                      {pattern.remediation && (
                        <div>
                          <p className="text-xs font-semibold text-[#6B7280] uppercase">Remediación</p>
                          <p className="text-xs text-white mt-1">{pattern.remediation}</p>
                        </div>
                      )}
                    </div>
                  )}
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
