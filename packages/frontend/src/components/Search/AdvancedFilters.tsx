/**
 * AdvancedFilters - Advanced filter UI for search
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, Filter, Sliders } from 'lucide-react';

export interface FilterOptions {
  type?: string;
  severity?: string;
  status?: string;
}

interface AdvancedFiltersProps {
  onFilterChange?: (filters: FilterOptions) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const TYPE_OPTIONS = [
  { value: 'finding', label: '🔴 Hallazgos' },
  { value: 'project', label: '📁 Proyectos' },
  { value: 'analysis', label: '🔍 Análisis' },
  { value: 'incident', label: '🚨 Incidentes' },
  { value: 'report', label: '📊 Reportes' },
];

const SEVERITY_OPTIONS = [
  { value: 'CRITICAL', label: '🔴 Crítico' },
  { value: 'HIGH', label: '🟠 Alto' },
  { value: 'MEDIUM', label: '🟡 Medio' },
  { value: 'LOW', label: '🟢 Bajo' },
  { value: 'INFO', label: '🔵 Información' },
];

const STATUS_OPTIONS = [
  { value: 'DETECTED', label: 'Detectado' },
  { value: 'IN_REVIEW', label: 'En Revisión' },
  { value: 'IN_CORRECTION', label: 'En Corrección' },
  { value: 'CORRECTED', label: 'Corregido' },
  { value: 'VERIFIED', label: 'Verificado' },
  { value: 'CLOSED', label: 'Cerrado' },
];

export default function AdvancedFilters({
  onFilterChange,
  isOpen = false,
  onToggle,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);

  const handleToggle = () => {
    const newState = !localIsOpen;
    setLocalIsOpen(newState);
    onToggle?.();
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string | undefined) => {
    const updatedFilters = {
      ...filters,
      [key]: value,
    };

    if (value === undefined) {
      delete updatedFilters[key];
    }

    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const handleClear = () => {
    setFilters({});
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <div className="relative">
      <motion.button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all border ${
          hasActiveFilters
            ? 'bg-[#F97316]/10 border-[#F97316]/30 text-[#F97316]'
            : 'bg-[#1E1E20] border-[#2D2D2D] text-[#A0A0A0] hover:text-white'
        }`}
      >
        <Sliders className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros</span>
        {hasActiveFilters && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-[#F97316]"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {localIsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 top-full mt-2 w-96 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg shadow-lg z-50 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtros Avanzados
              </h3>
              <button
                onClick={handleToggle}
                className="p-1 hover:bg-[#242424] rounded transition-colors"
              >
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider block mb-2">
                Tipo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleFilterChange('type', filters.type === option.value ? undefined : option.value)
                    }
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      filters.type === option.value
                        ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                        : 'bg-[#242424] border-[#2D2D2D] text-[#A0A0A0] hover:border-[#F97316]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider block mb-2">
                Severidad
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleFilterChange('severity', filters.severity === option.value ? undefined : option.value)
                    }
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      filters.severity === option.value
                        ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                        : 'bg-[#242424] border-[#2D2D2D] text-[#A0A0A0] hover:border-[#F97316]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#A0A0A0] uppercase tracking-wider block mb-2">
                Estado
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleFilterChange('status', filters.status === option.value ? undefined : option.value)
                    }
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                      filters.status === option.value
                        ? 'bg-[#F97316]/20 border-[#F97316] text-[#F97316]'
                        : 'bg-[#242424] border-[#2D2D2D] text-[#A0A0A0] hover:border-[#F97316]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleClear}
                className="w-full px-3 py-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors text-xs font-medium"
              >
                Limpiar Filtros
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {localIsOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={handleToggle}
        />
      )}
    </div>
  );
}
