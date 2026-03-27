import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Loader } from 'lucide-react';
import type { CrearProyectoDTO } from '../../types/api';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { githubService, type GitHubRepo, type GitHubBranch } from '../../services/github.service';

interface NuevoProyectoProps {
  onCrear: (dto: CrearProyectoDTO) => void;
  onCerrar: () => void;
  cargando: boolean;
}

export default function NuevoProyecto({ onCrear, onCerrar, cargando }: NuevoProyectoProps) {
  // Form state
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CrearProyectoDTO>({
    defaultValues: { scope: 'REPOSITORIO' },
  });

  // Dynamic repo loading
  const [searchQuery, setSearchQuery] = useState('');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const repoInputRef = useRef<HTMLInputElement>(null);

  // Branch loading
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const repositoryUrl = watch('repositoryUrl');

  // Search repos
  useEffect(() => {
    if (!searchQuery.trim()) {
      setRepos([]);
      return;
    }

    const searchRepos = async () => {
      try {
        setLoadingRepos(true);
        const result = await githubService.searchRepos({
          search: searchQuery,
          per_page: 10,
        });
        setRepos(result.repos);
      } catch (error) {
        console.error('Error searching repos:', error);
        setRepos([]);
      } finally {
        setLoadingRepos(false);
      }
    };

    const timer = setTimeout(searchRepos, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load branches when repo URL changes
  useEffect(() => {
    if (!repositoryUrl) {
      setBranches([]);
      setSelectedBranch(null);
      return;
    }

    const loadBranches = async () => {
      try {
        // Extract owner and repo from URL
        const match = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match || !match[1] || !match[2]) return;

        const owner = match[1];
        const repo = match[2].replace('.git', '');

        setLoadingBranches(true);
        const result = await githubService.getBranches(owner, repo);
        setBranches(result.branches);

        // Auto-select main branch if exists
        const mainBranch = result.branches.find(b => b.name === 'main' || b.name === 'master');
        if (mainBranch) {
          setSelectedBranch(mainBranch.name);
        }
      } catch (error) {
        console.error('Error loading branches:', error);
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [repositoryUrl]);

  // Handle repo selection
  const handleSelectRepo = (repo: GitHubRepo) => {
    setValue('repositoryUrl', repo.cloneUrl);
    setValue('name', repo.name);
    if (repo.description) {
      setValue('description', repo.description);
    }
    setShowRepoDropdown(false);
    setSearchQuery('');
    setRepos([]);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onCerrar}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl flex flex-col"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Nuevo Proyecto
            </h2>
            <button
              onClick={onCerrar}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit((data) => onCrear(data as CrearProyectoDTO))} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Buscar repositorio */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Buscar repositorio
              </label>
              <div className="relative">
                <input
                  ref={repoInputRef}
                  type="text"
                  placeholder="Buscar repos por nombre..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowRepoDropdown(true);
                  }}
                  onFocus={() => setShowRepoDropdown(true)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {loadingRepos && (
                  <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
              </div>

                {/* Dropdown de repos */}
                {showRepoDropdown && repos.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {repos.map((repo) => (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => handleSelectRepo(repo)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">{repo.name}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{repo.fullName}</p>
                        {repo.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                            {repo.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Nombre */}
            <Input
              label="Nombre del proyecto *"
              placeholder="Mi repositorio"
              error={errors.name?.message}
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 3,
                  message: 'Mínimo 3 caracteres',
                },
              })}
            />

            {/* URL del repositorio */}
            <Input
              label="URL del repositorio *"
              type="url"
              placeholder="https://github.com/org/repo"
              error={errors.repositoryUrl?.message}
              {...register('repositoryUrl', {
                required: 'La URL del repositorio es requerida',
                pattern: {
                  value: /https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/.+/,
                  message: 'Solo se soporta GitHub, GitLab o Bitbucket',
                },
              })}
            />

            {/* Selector de rama */}
            {branches.length > 0 && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Rama (opcional)
                </label>
                <div>
                  <button
                    type="button"
                    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-left flex justify-between items-center hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <span>{selectedBranch || 'Seleccionar rama...'}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        showBranchDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown de ramas */}
                  {showBranchDropdown && (
                    <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {branches.map((branch) => (
                        <button
                          key={branch.name}
                          type="button"
                          onClick={() => {
                            setSelectedBranch(branch.name);
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                            selectedBranch === branch.name
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white">
                            {branch.name}
                            {branch.protected && (
                              <span className="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded">
                                Protected
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {branch.sha.substring(0, 7)}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {loadingBranches && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Loader className="w-3 h-3 animate-spin" /> Cargando ramas...
                  </p>
                )}
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Descripción
              </label>
              <textarea
                placeholder="Descripción del repositorio"
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('description')}
              />
            </div>

            {/* Alcance del análisis */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                Alcance del análisis *
              </label>
              <div className="space-y-2">
                {[
                  { value: 'REPOSITORIO', label: '📁 Repositorio completo', desc: 'Analizar todo el código' },
                  { value: 'PULL_REQUEST', label: '📌 Pull Request específico', desc: 'Solo cambios de un PR' },
                  { value: 'ORGANIZACION', label: '🏢 Organización completa', desc: 'Todos los repos de la org' },
                ].map(({ value, label, desc }) => (
                  <label key={value} className="flex items-start p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      value={value}
                      {...register('scope')}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={onCerrar}
                disabled={cargando}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={cargando}
                isLoading={cargando}
              >
                {cargando ? 'Creando...' : 'Crear Proyecto'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
