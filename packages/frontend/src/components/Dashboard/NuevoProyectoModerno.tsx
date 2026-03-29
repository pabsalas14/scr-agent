/**
 * ============================================================================
 * NUEVO PROYECTO - FORMULARIO PROGRESIVO MODERNO
 * ============================================================================
 * Wizard multi-step para crear nuevos análisis de seguridad
 * Step 1: Seleccionar tipo de análisis (Repositorio, PR, Organización)
 * Step 2: Cargar dinámicamente datos según el tipo
 * Step 3: Información adicional
 * Step 4: Confirmar y crear
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Zap, GitBranch, Building2 } from 'lucide-react';
import type { CrearProyectoDTO } from '../../types/api';
import Button from '../ui/Button';
import RepositorySelector from '../GitHub/RepositorySelector';

interface NuevoProyectoModernoProps {
  onCrear: (dto: CrearProyectoDTO) => void;
  onCerrar: () => void;
  cargando: boolean;
}

type ScopeType = 'REPOSITORIO' | 'PULL_REQUEST' | 'ORGANIZACION';
type Step = 1 | 2 | 3 | 4;

const SCOPE_OPTIONS: Array<{
  id: ScopeType;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    id: 'REPOSITORIO',
    label: 'Repositorio Completo',
    desc: 'Analizar todo el código de un repositorio',
    icon: <Zap className="w-6 h-6" />,
    color: '#0EA5E9',
  },
  {
    id: 'PULL_REQUEST',
    label: 'Pull Request',
    desc: 'Analizar cambios específicos de un PR',
    icon: <GitBranch className="w-6 h-6" />,
    color: '#10B981',
  },
  {
    id: 'ORGANIZACION',
    label: 'Organización',
    desc: 'Analizar múltiples repositorios',
    icon: <Building2 className="w-6 h-6" />,
    color: '#EC4899',
  },
];

export default function NuevoProyectoModerno({
  onCrear,
  onCerrar,
  cargando,
}: NuevoProyectoModernoProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedScope, setSelectedScope] = useState<ScopeType | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [repoValidationError, setRepoValidationError] = useState<string>('');
  const [isRepoValid, setIsRepoValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CrearProyectoDTO>({
    defaultValues: { scope: 'REPOSITORIO' },
  });

  // Ver cambios en repositoryUrl
  const repositoryUrl = watch('repositoryUrl');

  // Avanzar de step
  const nextStep = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  // Seleccionar scope
  const handleScopeSelect = (scope: ScopeType) => {
    setSelectedScope(scope);
    setValue('scope', scope);
    nextStep();
  };

  // Submit
  const onSubmit = (data: CrearProyectoDTO) => {
    data.scope = selectedScope || 'REPOSITORIO';

    // Validar que repositoryUrl está presente y es válido
    if (!data.repositoryUrl) {
      alert('Por favor selecciona un repositorio válido');
      return;
    }

    // Validar que el repositorio pasó validación
    if (!isRepoValid && repoValidationError) {
      alert(`Cannot create project: ${repoValidationError}`);
      return;
    }

    setIsSubmitting(true);
    onCrear(data);
  };

  // Registrar campos ocultos (se llenan via setValue)
  register('repositoryUrl', { required: true });
  register('branch');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCerrar}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
    >
      <form onSubmit={handleSubmit((data) => onSubmit(data))} className="contents">
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl border border-slate-700/50 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
        {/* Header con progress - Responsive */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-slate-700/50 p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Nuevo Análisis</h2>
              <p className="text-xs sm:text-base text-gray-400">Crear un nuevo proyecto de seguridad</p>
            </div>
            <button
              onClick={onCerrar}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0 text-xl sm:text-2xl"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1.5 sm:gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    width: s <= step ? '100%' : '0%',
                  }}
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  transition={{ duration: 0.3 }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto min-h-64 sm:min-h-96">
          <AnimatePresence mode="wait">
            {/* Step 1: Seleccionar tipo */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                  ¿Qué tipo de análisis deseas realizar?
                </p>
                <div className="grid gap-2 sm:gap-4">
                  {SCOPE_OPTIONS.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleScopeSelect(option.id)}
                      className="p-3 sm:p-4 rounded-lg border-2 transition-all text-left group hover:border-opacity-100 border-opacity-50"
                      style={{
                        borderColor: option.color,
                        backgroundColor: `${option.color}10`,
                      }}
                    >
                      <div className="flex items-start gap-2 sm:gap-4">
                        <div
                          className="p-2 sm:p-3 rounded-lg text-white group-hover:scale-110 transition-transform flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        >
                          <span className="text-2xl sm:text-3xl">{option.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-sm sm:text-base font-semibold transition-colors"
                            style={{ color: option.color }}
                          >
                            {option.label}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-400 mt-0.5 sm:mt-1">{option.desc}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Detalles específicos */}
            {step === 2 && selectedScope && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">Información del {SCOPE_OPTIONS.find(s => s.id === selectedScope)?.label}</p>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Nombre del Proyecto *
                  </label>
                  <input
                    {...register('name', { required: 'El nombre es obligatorio' })}
                    placeholder="Ej: Mi Aplicación"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Seleccionar repositorio dinámicamente */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3 sm:space-y-4"
              >
                <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                  Selecciona tu repositorio (se cargará desde GitHub)
                </p>
                <RepositorySelector
                  onSelect={(repo) => {
                    setSelectedRepo(repo);
                    setSelectedBranch(null);
                    setValue('repositoryUrl', repo.cloneUrl);
                  }}
                  onBranchSelect={(branch) => {
                    setSelectedBranch(branch);
                    setValue('branch', branch);
                  }}
                  onValidationChange={(isValid, error) => {
                    setIsRepoValid(isValid);
                    setRepoValidationError(error || '');
                  }}
                  selectedRepo={selectedRepo}
                  selectedBranch={selectedBranch}
                  isLoading={cargando}
                />
                {errors.repositoryUrl && (
                  <p className="text-red-400 text-xs">{errors.repositoryUrl.message}</p>
                )}
                {repoValidationError && (
                  <p className="text-red-400 text-xs">
                    ✗ {repoValidationError}
                  </p>
                )}
                {!repositoryUrl && (
                  <p className="text-yellow-400 text-xs">
                    💡 Selecciona un repositorio para continuar
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 4: Confirmar */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 sm:space-y-6 text-center flex flex-col items-center justify-center"
              >
                <div className="flex justify-center mb-2 sm:mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <Check className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </motion.div>
                </div>
                <div className="max-w-md">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                    ¡Todo listo para analizar!
                  </h3>
                  <p className="text-xs sm:text-base text-gray-400">
                    Hemos configurado tu proyecto. Presiona el botón para comenzar el análisis de seguridad.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer con botones - Responsive */}
        <div className="bg-slate-900/50 border-t border-slate-700/50 p-3 sm:p-6 flex justify-between gap-2 sm:gap-4 flex-shrink-0">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={step === 1 || cargando}
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base px-2 sm:px-4 py-1.5 sm:py-2"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden xs:inline">Anterior</span>
          </Button>

          {step < 4 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={
                cargando ||
                // En step 2, validar que el nombre está completo
                (step === 2 && !watch('name')) ||
                // En step 3, validar que repositorio está seleccionado y es válido
                (step === 3 && (!repositoryUrl || (selectedRepo && !isRepoValid)))
              }
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-base px-2 sm:px-4 py-1.5 sm:py-2 flex-1 sm:flex-none"
              title={step === 3 && selectedRepo && !isRepoValid ? 'Espera a que se valide el repositorio' : ''}
            >
              <span className="hidden xs:inline">Siguiente</span>
              <span className="xs:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            </Button>
          ) : (
            <Button
              variant="primary"
              type="submit"
              disabled={cargando || isSubmitting}
              isLoading={cargando || isSubmitting}
              className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base px-2 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden xs:inline">{cargando || isSubmitting ? 'Creando...' : 'Iniciar Análisis'}</span>
              <span className="xs:hidden">{cargando || isSubmitting ? '...' : 'Analizar'}</span>
            </Button>
          )}
        </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
