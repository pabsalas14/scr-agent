/**
 * UserSearchPanel - Búsqueda y perfilado de usuarios
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  User,
  AlertCircle,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { userSearchService } from '../../services/user-search.service';
import { useToast } from '../../hooks/useToast';

export default function UserSearchPanel() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const toast = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setIsSearching(true);
      const results = await userSearchService.searchUsers(query, 20);
      setSearchResults(results);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Error buscando usuarios');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = async (user: any) => {
    try {
      setIsLoadingProfile(true);
      const profile = await userSearchService.getUserProfile(user.id);
      setSelectedUser(profile);
    } catch (error) {
      toast.error('Error cargando perfil');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const getRiskLevel = (rate: string) => {
    const num = parseFloat(rate);
    if (num < 10) return { color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' };
    if (num < 30) return { color: 'text-[#EAB308]', bg: 'bg-[#EAB308]/10' };
    if (num < 60) return { color: 'text-[#F97316]', bg: 'bg-[#F97316]/10' };
    return { color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-[#F97316]" />
          Búsqueda de Usuarios
        </h2>
        <p className="text-sm text-[#6B7280] mt-1">
          Búsqueda forense y perfilado de actividad de usuarios
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full px-4 py-3 pl-12 bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg text-white placeholder-[#4B5563] focus:outline-none focus:border-[#F97316]/50"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#F97316] hover:bg-[#EA6D00] text-white rounded text-sm font-medium transition-all disabled:opacity-50"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold text-white mb-3">Resultados</h3>
          {searchResults.length === 0 && query && !isSearching ? (
            <div className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D] text-center">
              <AlertCircle className="w-6 h-6 text-[#6B7280] mx-auto mb-2" />
              <p className="text-[#6B7280] text-sm">Sin resultados</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((user, idx) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full p-3 rounded-lg border transition-all text-left ${
                    selectedUser?.id === user.id
                      ? 'bg-[#F97316]/10 border-[#F97316]/50'
                      : 'bg-[#1C1C1E] border-[#2D2D2D] hover:border-[#F97316]/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    <p className="font-medium text-white text-sm">{user.name}</p>
                  </div>
                  <p className="text-xs text-[#6B7280]">{user.email}</p>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Detail */}
        <div className="lg:col-span-2">
          {isLoadingProfile ? (
            <div className="text-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-[#F97316] mx-auto mb-2" />
              <p className="text-[#6B7280]">Cargando perfil...</p>
            </div>
          ) : selectedUser ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* User Info */}
              <div className="p-4 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {selectedUser.name}
                    </h3>
                    <p className="text-sm text-[#6B7280]">{selectedUser.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280]">Creado</p>
                    <p className="text-sm text-white">
                      {new Date(selectedUser.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
                >
                  <p className="text-xs text-[#6B7280] mb-1">Total Commits</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedUser.stats.totalCommits}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
                >
                  <p className="text-xs text-[#6B7280] mb-1">Sospechosos</p>
                  <p className="text-2xl font-bold text-[#F97316]">
                    {selectedUser.stats.suspiciousCommits}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-lg bg-[#1C1C1E] border border-[#2D2D2D]"
                >
                  <p className="text-xs text-[#6B7280] mb-1">Repos Afectados</p>
                  <p className="text-2xl font-bold text-white">
                    {selectedUser.stats.affectedRepos}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`p-3 rounded-lg border ${getRiskLevel(
                    selectedUser.stats.suspicionRate
                  ).bg}`}
                >
                  <p className="text-xs text-[#6B7280] mb-1">Tasa Sospecha</p>
                  <p
                    className={`text-2xl font-bold ${getRiskLevel(
                      selectedUser.stats.suspicionRate
                    ).color}`}
                  >
                    {selectedUser.stats.suspicionRate}
                  </p>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Ver Tendencias
                </button>
                <button className="flex-1 px-3 py-2 bg-[#F97316] hover:bg-[#EA6D00] text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ver Actividad
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-10 text-[#6B7280]">
              Selecciona un usuario para ver detalles
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
