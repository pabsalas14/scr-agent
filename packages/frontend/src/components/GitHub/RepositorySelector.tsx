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
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'error';

export default function RepositorySelector({
  onSelect,
  onBranchSelect,
  onValidationChange,
  isLoading = false,
  selectedRepo = null,
  selectedBranch = null,
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
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to validate repository';
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
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar repositorios..."
          value={search}
          onChange={handleSearchChange}
          disabled={isLoadingRepos || isLoading}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        />
      </div>

      {/* Repositories List */}
      <div className="max-h-52 overflow-y-auto space-y-2 rounded-lg border border-slate-600/50 bg-slate-900/30 p-3">
        {isLoadingRepos ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin text-gray-400">⟳</div>
            <span className="ml-2 text-sm text-gray-400">Cargando repositorios...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">
              {search ? 'No se encontraron repositorios' : 'No hay repositorios disponibles'}
            </p>
          </div>
        ) : (
          repos.map((repo: Repository, index: number) => (
            <button
              key={repo.id}
              onClick={() => handleSelect(repo)}
              className={`w-full text-left px-3 py-2.5 rounded-md transition-colors text-sm border ${
                selectedIndex === index
                  ? 'bg-blue-600/30 border-blue-500/50 text-white'
                  : 'bg-slate-800/50 border-slate-600/30 text-gray-300 hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{repo.name}</span>
                    {repo.isPrivate && <Lock className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                    {repo.language && (
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">{repo.language}</span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{repo.description}</p>
                  )}
                </div>
                {repo.stars > 0 && (
                  <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                    <Star className="w-3 h-3" />
                    <span className="text-xs">{repo.stars}</span>
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
          className="w-full py-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
        >
          Cargar más repositorios
        </button>
      )}

      {/* Selected Repo + Branch Selector */}
      {selectedRepo && (
        <div className={`rounded-lg border p-3 transition-colors ${
          validationState === 'valid' ? 'bg-emerald-900/20 border-emerald-600/30' :
          validationState === 'validating' ? 'bg-blue-900/20 border-blue-600/30' :
          validationState === 'error' ? 'bg-red-900/20 border-red-600/30' :
          'bg-slate-900/20 border-slate-600/30'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <GitBranch className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                validationState === 'valid' ? 'text-emerald-400' :
                validationState === 'validating' ? 'text-blue-400' :
                validationState === 'error' ? 'text-red-400' : 'text-gray-400'
              }`} />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${
                  validationState === 'valid' ? 'text-emerald-300' :
                  validationState === 'validating' ? 'text-blue-300' :
                  validationState === 'error' ? 'text-red-300' : 'text-gray-300'
                }`}>
                  {selectedRepo.fullName}
                </p>
              </div>
            </div>
            {validationState === 'validating' && <div className="animate-spin text-blue-400 flex-shrink-0">⟳</div>}
            {validationState === 'valid' && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {validationState === 'error' && <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
          </div>

          {validationState === 'error' && validationError && (
            <p className="text-xs text-red-400 mt-2 pl-6">{validationError}</p>
          )}
          {validationState === 'valid' && (
            <p className="text-xs text-emerald-400 mt-1 pl-6">✓ Repositorio accesible</p>
          )}

          {/* Branch Selector */}
          {validationState === 'valid' && (
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
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{selectedBranch || branches[0]?.name || 'Seleccionar rama'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBranches ? 'rotate-180' : ''}`} />
                  </button>

                  {showBranches && (
                    <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-xl">
                      {branches.map((branch) => (
                        <button
                          key={branch.name}
                          type="button"
                          onClick={() => handleBranchSelect(branch.name)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center gap-2 ${
                            selectedBranch === branch.name ? 'bg-blue-600/20 text-blue-300' : 'text-gray-300'
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
