/**
 * ============================================================================
 * REPOSITORY SELECTOR - Cargador dinámico de repositorios desde GitHub
 * ============================================================================
 *
 * Componente que carga la lista de repositorios del usuario desde GitHub
 * y permite seleccionar uno para análisis.
 *
 * NUEVO: Validación automática de acceso al repositorio
 * Requisito: GitHub token debe estar configurado en Configuración
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, GitBranch, Lock, Star, CheckCircle, AlertCircle } from 'lucide-react';
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

interface RepositorySelectorProps {
  onSelect: (repo: Repository) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  isLoading?: boolean;
  selectedRepo?: Repository | null;
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'error';

export default function RepositorySelector({
  onSelect,
  onValidationChange,
  isLoading = false,
  selectedRepo = null,
}: RepositorySelectorProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [validationState, setValidationState] = useState<ValidationState>('idle');
  const [validationError, setValidationError] = useState<string>('');

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
        params: {
          search,
          page,
          per_page: 10,
        },
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 1,
  });

  const repos = reposData?.repos || [];
  const hasMore = reposData?.hasMore || false;

  /**
   * Validar acceso al repositorio seleccionado
   */
  const validateRepositoryAccess = async (repo: Repository) => {
    try {
      setValidationState('validating');
      setValidationError('');

      // Extraer owner y repo de fullName (ej: "owner/repo")
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
      const errorMsg = error.response?.data?.message ||
                      error.response?.data?.error ||
                      'Failed to validate repository';
      setValidationState('error');
      setValidationError(errorMsg);
      onValidationChange?.(false, errorMsg);
    }
  };

  const handleSelect = (repo: Repository) => {
    onSelect(repo);
    setSelectedIndex(repos.indexOf(repo));
    // Validar acceso inmediatamente
    validateRepositoryAccess(repo);
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
          ⚠️ Error cargando repositorios. Asegúrate de haber configurado tu GitHub token en Settings.
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
      <div className="max-h-80 overflow-y-auto space-y-2 rounded-lg border border-slate-600/50 bg-slate-900/30 p-3">
        {isLoadingRepos ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin text-gray-400">⟳</div>
            <span className="ml-2 text-sm text-gray-400">Cargando repositorios...</span>
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">
              {search ? 'No se encontraron repositorios' : 'Carga un repositorio para comenzar'}
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
                    {repo.isPrivate && (
                      <Lock className="w-3 h-3 text-orange-400 flex-shrink-0" />
                    )}
                    {repo.language && (
                      <span className="text-xs bg-slate-700/50 px-2 py-0.5 rounded">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {repo.description}
                    </p>
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

      {/* Selected Repo Display with Validation Status */}
      {selectedRepo && (
        <div className={`rounded-lg border p-3 transition-colors ${
          validationState === 'valid'
            ? 'bg-emerald-900/20 border-emerald-600/30'
            : validationState === 'validating'
            ? 'bg-blue-900/20 border-blue-600/30'
            : validationState === 'error'
            ? 'bg-red-900/20 border-red-600/30'
            : 'bg-slate-900/20 border-slate-600/30'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <GitBranch className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                validationState === 'valid' ? 'text-emerald-400' :
                validationState === 'validating' ? 'text-blue-400' :
                validationState === 'error' ? 'text-red-400' :
                'text-gray-400'
              }`} />
              <div className="min-w-0">
                <p className={`text-sm font-medium ${
                  validationState === 'valid' ? 'text-emerald-300' :
                  validationState === 'validating' ? 'text-blue-300' :
                  validationState === 'error' ? 'text-red-300' :
                  'text-gray-300'
                }`}>
                  {selectedRepo.fullName}
                </p>
                <p className={`text-xs truncate ${
                  validationState === 'valid' ? 'text-emerald-400/70' :
                  validationState === 'validating' ? 'text-blue-400/70' :
                  validationState === 'error' ? 'text-red-400/70' :
                  'text-gray-400/70'
                }`}>
                  {selectedRepo.cloneUrl}
                </p>
              </div>
            </div>

            {/* Validation Status Icon */}
            {validationState === 'validating' && (
              <div className="animate-spin text-blue-400 flex-shrink-0">⟳</div>
            )}
            {validationState === 'valid' && (
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
            {validationState === 'error' && (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
          </div>

          {/* Validation Error Message */}
          {validationState === 'error' && validationError && (
            <p className="text-xs text-red-400 mt-2 pl-6">
              {validationError}
            </p>
          )}
          {validationState === 'valid' && (
            <p className="text-xs text-emerald-400 mt-2 pl-6">
              ✓ Repository is accessible
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoadingRepos || isLoading}
          className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
        >
          Cargar más repositorios
        </button>
      )}
    </div>
  );
}
