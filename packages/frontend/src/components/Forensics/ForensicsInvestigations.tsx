import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  TrendingUp,
  User,
  GitBranch,
  Calendar,
  AlertTriangle,
  ChevronDown,
  Code2,
  Lock,
  Zap,
  BarChart3,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { EventoForense } from '../../types/api';

export default function ForensicsInvestigations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterRepo, setFilterRepo] = useState('');
  const [filterRisk, setFilterRisk] = useState<'todos' | 'alto' | 'critico'>('todos');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [tab, setTab] = useState<'timeline' | 'usuarios' | 'repos' | 'sospechosos'>('timeline');

  // Mock data - en producción vendría del backend
  const { data: allEventos = [] } = useQuery({
    queryKey: ['forensics-all'],
    queryFn: async () => {
      try {
        // Aquí iría la llamada real al backend
        return [] as EventoForense[];
      } catch {
        return [];
      }
    },
  });

  // Filtrar eventos
  const filteredEventos = allEventos.filter((e) => {
    let matches = true;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      matches =
        matches &&
        (e.file?.toLowerCase().includes(query) ||
          e.commitMessage?.toLowerCase().includes(query) ||
          e.author?.toLowerCase().includes(query));
    }

    if (filterUser) {
      matches = matches && e.author === filterUser;
    }

    if (filterRepo) {
      matches = matches && e.file?.startsWith(filterRepo);
    }

    if (filterRisk === 'alto') {
      matches = matches && ['ALTO', 'CRÍTICO'].includes(e.riskLevel || '');
    } else if (filterRisk === 'critico') {
      matches = matches && e.riskLevel === 'CRITICAL';
    }

    return matches;
  });

  // Agrupar por usuario
  const eventosPorUsuario = filteredEventos.reduce(
    (acc, e) => {
      const user = e.author || 'Desconocido';
      if (!acc[user]) acc[user] = [];
      acc[user].push(e);
      return acc;
    },
    {} as Record<string, EventoForense[]>
  );

  // Agrupar por repositorio
  const eventosPorRepo = filteredEventos.reduce(
    (acc, e) => {
      const repo = e.file?.split('/')[0] || 'root';
      if (!acc[repo]) acc[repo] = [];
      acc[repo].push(e);
      return acc;
    },
    {} as Record<string, EventoForense[]>
  );

  // Eventos sospechosos
  const eventosSospechosos = filteredEventos.filter(
    (e) => e.suspicionIndicators && e.suspicionIndicators.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Investigaciones Forenses</h2>
          <p className="text-sm text-[#6B7280]">
            Analiza la línea de tiempo completa, investiga usuarios y repositorios
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Buscar por archivo, commit, usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase block mb-2">Usuario</label>
            <input
              type="text"
              placeholder="Filtrar por usuario..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase block mb-2">Repositorio</label>
            <input
              type="text"
              placeholder="Filtrar por repo..."
              value={filterRepo}
              onChange={(e) => setFilterRepo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase block mb-2">Riesgo</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white focus:border-[#F97316] focus:outline-none text-sm"
            >
              <option value="todos">Todos</option>
              <option value="alto">Alto/Crítico</option>
              <option value="critico">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#2D2D2D]">
        {[
          { id: 'timeline', label: '📅 Timeline', icon: Calendar },
          { id: 'usuarios', label: '👤 Usuarios', icon: User },
          { id: 'repos', label: '📦 Repositorios', icon: GitBranch },
          { id: 'sospechosos', label: '⚠️ Sospechosos', icon: AlertTriangle },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === t.id
                ? 'border-[#F97316] text-[#F97316]'
                : 'border-transparent text-[#6B7280] hover:text-[#A0A0A0]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {/* TIMELINE TAB */}
          {tab === 'timeline' && (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredEventos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#6B7280]">No hay eventos que mostrar</p>
                </div>
              ) : (
                filteredEventos.map((evento, idx) => (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] hover:border-[#404040] transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Code2 className="w-4 h-4 text-[#F97316] flex-shrink-0" />
                          <span className="text-sm font-semibold text-white truncate">{evento.file}</span>
                        </div>
                        <p className="text-xs text-[#94A3B8] mb-2">{evento.commitMessage}</p>
                        <div className="flex items-center gap-3 flex-wrap text-xs text-[#6B7280]">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {evento.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(evento.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      {evento.suspicionIndicators && evento.suspicionIndicators.length > 0 && (
                        <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* USUARIOS TAB */}
          {tab === 'usuarios' && (
            <div className="space-y-3">
              {Object.entries(eventosPorUsuario).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#6B7280]">No hay usuarios con eventos</p>
                </div>
              ) : (
                Object.entries(eventosPorUsuario)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([usuario, eventos]) => (
                    <motion.div
                      key={usuario}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg border border-[#2D2D2D] overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedUser(expandedUser === usuario ? null : usuario)}
                        className="w-full px-4 py-3 bg-[#1E1E20] hover:bg-[#242424] transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F97316]/20 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#F97316]" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-semibold text-white">{usuario}</p>
                            <p className="text-xs text-[#6B7280]">{eventos.length} eventos</p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedUser === usuario ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedUser === usuario && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          className="border-t border-[#2D2D2D] bg-[#242424]/50 p-4 space-y-2"
                        >
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div>
                              <p className="text-xs text-[#6B7280] uppercase">Total</p>
                              <p className="text-xl font-bold text-white">{eventos.length}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#6B7280] uppercase">Críticos</p>
                              <p className="text-xl font-bold text-[#EF4444]">
                                {eventos.filter((e) => e.riskLevel === 'CRITICAL').length}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#6B7280] uppercase">Sospechosos</p>
                              <p className="text-xl font-bold text-[#F97316]">
                                {eventos.filter((e) => e.suspicionIndicators?.length).length}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {eventos.slice(0, 5).map((e) => (
                              <div key={e.id} className="text-xs text-[#94A3B8] p-2 bg-[#1C1C1E] rounded truncate">
                                {e.file} - {e.action}
                              </div>
                            ))}
                            {eventos.length > 5 && (
                              <p className="text-xs text-[#6B7280] italic">+{eventos.length - 5} más</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))
              )}
            </div>
          )}

          {/* REPOS TAB */}
          {tab === 'repos' && (
            <div className="space-y-3">
              {Object.entries(eventosPorRepo).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#6B7280]">No hay repositorios con eventos</p>
                </div>
              ) : (
                Object.entries(eventosPorRepo)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([repo, eventos]) => (
                    <div key={repo} className="p-4 rounded-lg bg-[#1E1E20] border border-[#2D2D2D]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-[#22C55E]" />
                          <h4 className="font-semibold text-white">{repo}</h4>
                        </div>
                        <span className="text-xs font-semibold bg-[#F97316]/10 text-[#F97316] px-2 py-1 rounded">
                          {eventos.length} eventos
                        </span>
                      </div>

                      <div className="w-full bg-[#2D2D2D] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#F97316] to-[#EAB308] h-full transition-all"
                          style={{ width: `${Math.min(100, (eventos.length / filteredEventos.length) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {/* SOSPECHOSOS TAB */}
          {tab === 'sospechosos' && (
            <div className="space-y-3">
              {eventosSospechosos.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[#22C55E]">✓ No hay eventos sospechosos</p>
                </div>
              ) : (
                eventosSospechosos.map((evento, idx) => (
                  <motion.div
                    key={evento.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-lg bg-[#EF4444]/5 border border-[#EF4444]/30"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white mb-2">{evento.file}</p>
                        <p className="text-sm text-[#94A3B8] mb-3">{evento.commitMessage}</p>

                        <div className="space-y-1 mb-3">
                          {evento.suspicionIndicators?.map((indicator, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="text-[#EF4444] flex-shrink-0">⚠</span>
                              <span className="text-[#94A3B8]">{indicator}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                          <span>{evento.author}</span>
                          <span>•</span>
                          <span>{new Date(evento.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
