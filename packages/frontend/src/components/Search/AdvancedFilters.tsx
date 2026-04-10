import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Save, Trash2 } from 'lucide-react';

export interface FilterConfig {
  severity?: string[];
  status?: string[];
  type?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  confidence?: {
    min?: number;
    max?: number;
  };
}

interface AdvancedFiltersProps {
  onFilterChange?: (filters: FilterConfig) => void;
  onSaveFilter?: (name: string, filters: FilterConfig) => void;
  savedFilters?: Array<{ name: string; filters: FilterConfig }>;
}

const severityOptions = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
const statusOptions = ['ABIERTO', 'EN PROGRESO', 'RESUELTO', 'CERRADO'];
const typeOptions = ['SQL Injection', 'XSS', 'CSRF', 'Inyección de Código', 'Inseguridad en Autenticación'];

export default function AdvancedFilters({
  onFilterChange,
  onSaveFilter,
  savedFilters = [],
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [filterName, setFilterName] = useState('');

  const handleFilterChange = (newFilters: FilterConfig) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      onSaveFilter?.(filterName, filters);
      setFilterName('');
    }
  };

  const handleLoadSavedFilter = (savedFilter: { name: string; filters: FilterConfig }) => {
    handleFilterChange(savedFilter.filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    handleFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v) && v.length > 0) return true;
    if (typeof v === 'object' && v !== null && Object.values(v).some((x) => x)) return true;
    return false;
  }).length;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-sm font-medium text-[#A0A0A0] hover:text-white hover:border-[#F97316] transition-colors"
      >
        <Filter className="w-4 h-4" />
        Filtros Avanzados
        {activeFilterCount > 0 && (
          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#F97316] text-white text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg shadow-lg z-40 w-96 max-h-96 overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              {/* Severity Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Severidad</label>
                <div className="grid grid-cols-2 gap-2">
                  {severityOptions.map((severity) => (
                    <button
                      key={severity}
                      onClick={() => {
                        const current = filters.severity || [];
                        const updated = current.includes(severity)
                          ? current.filter((s) => s !== severity)
                          : [...current, severity];
                        handleFilterChange({ ...filters, severity: updated });
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.severity?.includes(severity)
                          ? 'bg-[#F97316] text-white'
                          : 'bg-[#242424] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Estado</label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        const current = filters.status || [];
                        const updated = current.includes(status)
                          ? current.filter((s) => s !== status)
                          : [...current, status];
                        handleFilterChange({ ...filters, status: updated });
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.status?.includes(status)
                          ? 'bg-[#F97316] text-white'
                          : 'bg-[#242424] text-[#A0A0A0] border border-[#2D2D2D] hover:border-[#F97316]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confidence Range */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Confianza (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.confidence?.min || 0}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        confidence: { ...filters.confidence, min: parseInt(e.target.value) },
                      })
                    }
                    placeholder="Min"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.confidence?.max || 100}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        confidence: { ...filters.confidence, max: parseInt(e.target.value) },
                      })
                    }
                    placeholder="Max"
                    className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white">Rango de Fechas</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.dateRange?.from || ''}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        dateRange: { ...filters.dateRange, from: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white focus:border-[#F97316] focus:outline-none text-sm"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.to || ''}
                    onChange={(e) =>
                      handleFilterChange({
                        ...filters,
                        dateRange: { ...filters.dateRange, to: e.target.value },
                      })
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white focus:border-[#F97316] focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Save Filter Section */}
              {activeFilterCount > 0 && (
                <div className="border-t border-[#2D2D2D] pt-4 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                      placeholder="Nombre del filtro"
                      className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
                    />
                    <button
                      onClick={handleSaveFilter}
                      className="px-3 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                      <Save className="w-4 h-4" />
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Filters */}
              {savedFilters.length > 0 && (
                <div className="border-t border-[#2D2D2D] pt-4 space-y-2">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Filtros Guardados</p>
                  <div className="space-y-1">
                    {savedFilters.map((saved) => (
                      <button
                        key={saved.name}
                        onClick={() => handleLoadSavedFilter(saved)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-[#242424] hover:bg-[#2D2D2D] transition-colors border border-[#2D2D2D] text-sm text-[#A0A0A0] hover:text-white flex items-center justify-between"
                      >
                        {saved.name}
                        <Trash2 className="w-3 h-3 opacity-0 hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-[#2D2D2D] pt-4 flex gap-2">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#242424] text-[#A0A0A0] hover:text-white border border-[#2D2D2D] hover:border-[#EF4444] transition-colors text-sm font-medium"
                  >
                    Limpiar Filtros
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-[#F97316] text-white hover:bg-[#EA6B1B] transition-colors text-sm font-medium"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
