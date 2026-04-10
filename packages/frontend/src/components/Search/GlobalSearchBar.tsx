import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  id: string;
  title: string;
  type: 'project' | 'finding' | 'report' | 'incident';
  description?: string;
  score: number;
}

interface GlobalSearchBarProps {
  onSearch?: (query: string) => void;
  onSelectResult?: (result: SearchResult) => void;
  placeholder?: string;
}

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'SQL Injection en login.ts',
    type: 'finding',
    description: 'Inyección SQL en módulo de autenticación',
    score: 0.95,
  },
  {
    id: '2',
    title: 'Backend Security Audit',
    type: 'project',
    description: 'Auditoría de seguridad del backend',
    score: 0.85,
  },
  {
    id: '3',
    title: 'XSS Vulnerability Report',
    type: 'report',
    description: 'Reporte de vulnerabilidades XSS identificadas',
    score: 0.78,
  },
];

const typeConfig = {
  project: { label: 'Proyecto', color: 'bg-[#F97316]', icon: '📁' },
  finding: { label: 'Hallazgo', color: 'bg-[#EF4444]', icon: '⚠️' },
  report: { label: 'Reporte', color: 'bg-[#22C55E]', icon: '📊' },
  incident: { label: 'Incidente', color: 'bg-[#6366F1]', icon: '🚨' },
};

export default function GlobalSearchBar({
  onSearch,
  onSelectResult,
  placeholder = 'Buscar proyectos, hallazgos, reportes...',
}: GlobalSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(['SQL Injection', 'XSS', 'CSRF']);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);

      if (value.trim().length > 0) {
        // Simulate search results
        const filtered = mockResults.filter(
          (r) =>
            r.title.toLowerCase().includes(value.toLowerCase()) ||
            r.description?.toLowerCase().includes(value.toLowerCase())
        );
        setResults(filtered.sort((a, b) => b.score - a.score));
        setIsOpen(true);
      } else {
        setResults([]);
      }

      onSearch?.(value);
    },
    [onSearch]
  );

  const handleSelectResult = (result: SearchResult) => {
    setQuery(result.title);
    setIsOpen(false);
    onSelectResult?.(result);

    // Add to recent searches
    setRecentSearches((prev) => [result.title, ...prev.filter((s) => s !== result.title)].slice(0, 5));
  };

  const handleSelectRecent = (search: string) => {
    setQuery(search);
    handleSearch(search);
  };

  return (
    <div className="relative flex-1 max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none transition-colors"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#2D2D2D] rounded transition-colors"
          >
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
          >
            {results.length > 0 ? (
              <div className="p-2">
                <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider px-3 py-2 mb-2">
                  Resultados ({results.length})
                </div>
                {results.map((result) => {
                  const config = typeConfig[result.type];
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[#242424] transition-colors space-y-1 border border-transparent hover:border-[#2D2D2D]"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold text-white px-2 py-0.5 rounded ${config.color} bg-opacity-20`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-[#6B7280]">Match: {Math.round(result.score * 100)}%</span>
                      </div>
                      <p className="text-sm text-white font-medium">{result.title}</p>
                      {result.description && (
                        <p className="text-xs text-[#6B7280]">{result.description}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : query.length === 0 && recentSearches.length > 0 ? (
              <div className="p-3">
                <div className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Búsquedas recientes
                </div>
                <div className="space-y-2">
                  {recentSearches.map((search) => (
                    <button
                      key={search}
                      onClick={() => handleSelectRecent(search)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#242424] transition-colors flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-white"
                    >
                      <Clock className="w-3 h-3" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-[#6B7280]">
                {query ? 'No se encontraron resultados' : 'Escribe para buscar'}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
