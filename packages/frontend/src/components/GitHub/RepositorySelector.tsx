/**
 * ============================================================================
 * REPOSITORY & BRANCH SELECTOR - Cargador dinámico desde GitHub
 * ============================================================================
 *
 * Carga repos del usuario desde GitHub API, permite seleccionar uno,
 * luego carga las ramas disponibles y permite seleccionar la rama.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, GitBranch, Lock, Star, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { apiService } from '../../services/api.service';

interface Repository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  cloneUrl: string;
  description: string;
  isPrivate: boolean;
  stars: number;
  language: string | null;
}

interface Branch {
  name: string;
  sha: string;
  protected: boolean;
}

interface RepositorySelectorProps {
  onSelect: (repo: Repository) => void;
  onBranchSelect?: (branch: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  isLoading?: boolean;
  selectedRepo?: Repository | null;
  selectedBranch?: string | null;
  hideBranchSelector?: boolean; // New prop to control branch visibility
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'error';

export default function RepositorySelector({
  onSelect,
  onBranchSelect,
  onValidationChange,
  isLoading = false,
  selectedRepo = null,
  selectedBranch = null,
  hideBranchSelector = false, // Default to false
}: RepositorySelectorProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationError, setValidationError] = useState<string>('');
  const [showBranches, setShowBranches] = useState(false);

  /**
   * Cargar repositorios del usuario desde GitHub
   */
  const {
    data: reposData,
    isLoading: isLoadingRepos,
    error: reposError,
  } = useQuery({
    queryKey: ['github-repos', search, page],
    queryFn: async () => {
      const response = await apiService.get('/github/repos', {
        params: { search, page, per_page: 10 },
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  /**
   * Cargar ramas del repositorio seleccionado
   */
  const {
    data: branchesData,
    isLoading: isLoadingBranches,
  } = useQuery({
    queryKey: ['github-branches', selectedRepo?.fullName],
    queryFn: async () => {
      if (!selectedRepo) return null;
      const [owner, repo] = selectedRepo.fullName.split('/');
      const response = await apiService.get(`/github/repos/${owner}/${repo}/branches`);
      return response.data.data;
    },
    enabled: !!selectedRepo,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const repos = reposData?.repos || [];
  const hasMore = reposData?.hasMore || false;
  const branches: Branch[] = branchesData?.branches || [];

  /**
   * Validar acceso al repositorio seleccionado
   */
  const validateRepositoryAccess = async (repo: Repository) => {
    try {
      setValidationState('validating');
      setValidationError('');
      const [owner, repoName] = repo.fullName.split('/');
      const response = await apiService.post(`/github/repos/${owner}/${repoName}/validate`);
      if (response.data.accessible) {
        setValidationState('valid');
        onValidationChange?.(true);
      } else {
        const message = response.data.message || 'Repository not accessible';
        setValidationState('error');
        setValidationError(message);
        onValidationChange?.(false, message);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; error?: string } } };
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to validate repository';
      setValidationState('error');
      setValidationError(errorMsg);
      onValidationChange?.(false, errorMsg);
    }
  };

  const handleSelect = (repo: Repository) => {
    onSelect(repo);
    setSelectedIndex(repos.indexOf(repo));
    setShowBranches(true);
    validateRepositoryAccess(repo);
    // Auto-select default branch if available after branches load
  };

  const handleBranchSelect = (branchName: string) => {
    onBranchSelect?.(branchName);
    setShowBranches(false);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
    setSelectedIndex(null);
    setValidationState('idle');
    setValidationError('');
  };

  if (reposError) {
    return (
      <div className="rounded-lg bg-red-900/20 border border-red-600/30 p-4">
        <p className="text-red-400 text-sm">
          Error cargando repositorios. Asegúrate de haber configurado tu GitHub token en Settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Buscador de Repositorios */}
      <div className="relative group/search">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] group-focus-within/search:text-[#F97316] transition-colors" />
        <input
          type="text"
          placeholder="BUSCAR EN GITHUB..."
          value={search}
          onChange={handleSearchChange}
          disabled={isLoadingRepos || isLoading}
          className="w-full pl-12 pr-4 py-3 bg-[#1C1C1E] border border-[#2D2D2D] rounded-xl text-white text-sm focus:border-[#F97316]/40 focus:outline-none transition-all placeholder:text-[#4B5563] disabled:opacity-50"
        />
      </div>

      {/* Lista de Repositorios */}
      <div className="max-h-52 overflow-y-auto space-y-2 rounded-xl border border-[#2D2D2D] bg-[#1E1E20] p-3 custom-scrollbar">
        {isLoadingRepos ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
             <div className="w-5 h-5 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />
             <span className="text-[9px] font-semibold text-[#64748B] uppercase tracking-widest">Consultando API...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest">
              {search ? 'Sin Coincidencias' : 'Inicie Búsqueda'}
            </p>
          </div>
        ) : (
          repos.map((repo: Repository, index: number) => (
            <button
              key={repo.id}
              onClick={() => handleSelect(repo)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all border ${
                selectedIndex === index
                  ? 'bg-[#F97316]/10 border-[#F97316]/30 text-white'
                  : 'bg-[#242424] border-[#2D2D2D] text-[#94A3B8] hover:border-[#404040]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-xs truncate tracking-tight">{repo.name}</span>
                    {repo.isPrivate && <Lock className="w-3 h-3 text-[#F59E0B] flex-shrink-0" />}
                  </div>
                  {repo.description && (
                    <p className="text-[10px] font-medium text-[#64748B] line-clamp-1 uppercase tracking-tight">{repo.description}</p>
                  )}
                </div>
                {repo.stars > 0 && (
                  <div className="flex items-center gap-1 text-[#EAB308] flex-shrink-0">
                    <Star className="w-2.5 h-2.5" />
                    <span className="text-[10px] font-semibold">{repo.stars}</span>
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Pagination */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoadingRepos || isLoading}
          className="w-full py-1.5 text-xs text-[#F97316] hover:text-[#EA6D00] disabled:opacity-50 transition-colors"
        >
          Cargar más repositorios
        </button>
      )}

      {/* Repositorio Seleccionado & Validador */}
      {selectedRepo && (
        <div className={`rounded-xl border p-5 transition-all ${
          validationState === 'valid' ? 'bg-[#22C55E]/5 border-[#22C55E]/20' :
          validationState === 'validating' ? 'bg-[#F97316]/5 border-[#F97316]/20' :
          validationState === 'error' ? 'bg-[#EF4444]/5 border-[#EF4444]/20' :
          'bg-[#1E1E20] border-[#2D2D2D]'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                validationState === 'valid' ? 'bg-[#22C55E]/10 border-[#22C55E]/30' : 'bg-[#242424] border-[#2D2D2D]'
              }`}>
                <GitBranch className={`w-5 h-5 flex-shrink-0 ${
                  validationState === 'valid' ? 'text-[#22C55E]' :
                  validationState === 'validating' ? 'text-[#F97316]' :
                  validationState === 'error' ? 'text-[#EF4444]' : 'text-[#64748B]'
                }`} />
              </div>
              <div className="min-w-0 flex flex-col justify-center h-10">
                <p className={`text-xs font-semibold tracking-tight uppercase truncate ${
                  validationState === 'valid' ? 'text-white' : 'text-[#94A3B8]'
                }`}>
                  {selectedRepo.fullName}
                </p>
                {validationState === 'valid' && (
                  <span className="text-[9px] font-semibold text-[#22C55E] uppercase tracking-widest animate-pulse">Asset Validado</span>
                )}
              </div>
            </div>
            <div className="pt-2">
               {validationState === 'validating' && <div className="w-4 h-4 border-2 border-[#F97316]/20 border-t-[#F97316] rounded-full animate-spin" />}
               {validationState === 'valid' && <CheckCircle className="w-5 h-5 text-[#22C55E]" />}
               {validationState === 'error' && <AlertCircle className="w-5 h-5 text-[#EF4444]" />}
            </div>
          </div>

          {validationState === 'error' && validationError && (
            <div className="mt-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl flex items-center gap-3">
               <AlertCircle className="w-4 h-4 text-[#EF4444]" />
               <p className="text-[10px] font-bold text-[#EF4444] uppercase tracking-tight">{validationError}</p>
            </div>
          )}

          {/* Selector de Rama (Condicional) */}
          {validationState === 'valid' && !hideBranchSelector && (
            <div className="mt-3 pl-6">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Rama</label>
              {isLoadingBranches ? (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                  <div className="animate-spin">⟳</div>
                  <span>Cargando ramas...</span>
                </div>
              ) : branches.length > 0 ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBranches(!showBranches)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-[#1E1E20] border border-[#2D2D2D] rounded-lg text-sm text-white hover:border-[#F97316]/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>{selectedBranch || branches[0]?.name || 'Seleccionar rama'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBranches ? 'rotate-180' : ''}`} />
                  </button>

                  {showBranches && (
                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-[#1E1E20] border border-[#2D2D2D] rounded-lg shadow-xl">
                      {branches.map((branch) => (
                        <button
                          key={branch.name}
                          type="button"
                          onClick={() => handleBranchSelect(branch.name)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-[#242424] transition-colors flex items-center gap-2 ${
                            selectedBranch === branch.name ? 'bg-[#F97316]/10 text-[#F97316]' : 'text-[#94A3B8]'
                          }`}
                        >
                          <GitBranch className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{branch.name}</span>
                          {branch.protected && (
                            <Lock className="w-3 h-3 text-yellow-500 flex-shrink-0 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No se encontraron ramas</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
