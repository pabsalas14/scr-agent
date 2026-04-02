import { useState, type ComponentType } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Zap, GitBranch, Building2, X, Shield, Terminal, Settings2 } from 'lucide-react';
import type { CrearProyectoDTO } from '../../types/api';
import Button from '../ui/Button';
import RepositorySelector from '../GitHub/RepositorySelector';

interface NuevoProyectoModernoProps {
  onCrear: (dto: CrearProyectoDTO) => void;
  onCerrar: () => void;
  cargando: boolean;
}

type ScopeType = 'REPOSITORY' | 'PULL_REQUEST' | 'ORGANIZATION';
type Step = 1 | 2 | 3 | 4;

const SCOPE_OPTIONS: Array<{
  id: ScopeType;
  label: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: 'REPOSITORY',   label: 'Repositorio completo', desc: 'Análisis profundo de toda la base de código.',    icon: Terminal },
  { id: 'PULL_REQUEST', label: 'Pull Request',          desc: 'Auditoría de cambios específicos entrantes.',     icon: GitBranch },
  { id: 'ORGANIZATION', label: 'Organización',          desc: 'Escaneo masivo de activos institucionales.',      icon: Building2 },
];

export default function NuevoProyectoModerno({ onCrear, onCerrar, cargando }: NuevoProyectoModernoProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedScope, setSelectedScope] = useState<ScopeType | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [repoValidationError, setRepoValidationError] = useState<string>('');
  const [isRepoValid, setIsRepoValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CrearProyectoDTO>({
    defaultValues: { scope: 'REPOSITORY' },
  });

  const repositoryUrl = watch('repositoryUrl');

  const handleScopeSelect = (scope: ScopeType) => {
    setSelectedScope(scope);
    setValue('scope', scope);
    nextStep();
  };

  const nextStep = () => { if (step < 4) setStep((step + 1) as Step); };
  const prevStep = () => { if (step > 1) setStep((step - 1) as Step); };

  const onSubmit = (data: CrearProyectoDTO) => {
    data.scope = selectedScope || 'REPOSITORY';
    if (!data.repositoryUrl) return;
    if (!isRepoValid && repoValidationError) return;
    setIsSubmitting(true);
    onCrear(data);
  };

  register('repositoryUrl', { required: true });
  register('branch');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onCerrar}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: 12 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#1C1C1E] border border-[#2D2D2D] rounded-xl max-w-xl w-full shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#F97316]/10 flex items-center justify-center text-[#F97316]">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Nuevo proyecto</p>
                <p className="text-xs text-[#6B7280]">Paso {step} de 4</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`rounded-full transition-all duration-300 ${
                      s === step ? 'w-5 h-1.5 bg-[#F97316]' : s < step ? 'w-1.5 h-1.5 bg-[#F97316]/40' : 'w-1.5 h-1.5 bg-[#2D2D2D]'
                    }`}
                  />
                ))}
              </div>
              <button type="button" onClick={onCerrar} className="p-1 text-[#6B7280] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 flex flex-col min-h-[380px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Selecciona el tipo de análisis</h2>
                    <p className="text-sm text-[#6B7280] mt-0.5">¿Qué quieres auditar?</p>
                  </div>
                  <div className="space-y-2">
                    {SCOPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleScopeSelect(option.id)}
                          className="w-full group p-4 rounded-xl bg-[#242424] border border-[#2D2D2D] text-left hover:border-[#F97316]/40 hover:bg-[#F97316]/5 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#1E1E20] group-hover:bg-[#F97316]/10 flex items-center justify-center text-[#6B7280] group-hover:text-[#F97316] transition-colors border border-[#2D2D2D]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white">{option.label}</p>
                              <p className="text-xs text-[#6B7280]">{option.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#4B5563] group-hover:text-[#F97316] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Nombre del proyecto</h2>
                    <p className="text-sm text-[#6B7280] mt-0.5">Un nombre descriptivo para identificarlo.</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#A0A0A0]">Nombre</label>
                    <input
                      {...register('name', { required: 'El nombre es requerido' })}
                      autoFocus
                      placeholder="ej. Core API — Auditoría Q1"
                      className="w-full bg-[#111111] border border-[#2D2D2D] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#4B5563] focus:border-[#F97316]/50 focus:outline-none focus:ring-1 focus:ring-[#F97316]/20 transition-all"
                    />
                    {errors.name && <p className="text-xs text-[#EF4444]">{errors.name.message}</p>}
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Enlace de repositorio</h2>
                    <p className="text-sm text-[#6B7280] mt-0.5">Selecciona el repositorio a auditar.</p>
                  </div>
                  <div className="bg-[#111111] border border-[#2D2D2D] rounded-xl p-4 min-h-[240px]">
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
                      hideBranchSelector={selectedScope === 'REPOSITORIO'}
                    />
                    {repoValidationError && (
                      <p className="mt-3 text-xs text-[#EF4444]">Error: {repoValidationError}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
                  <div className="flex flex-col items-center space-y-3 text-center pt-4">
                    <div className="w-14 h-14 rounded-full bg-[#F97316]/10 flex items-center justify-center border border-[#F97316]/20">
                      <Shield className="w-7 h-7 text-[#F97316]" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Todo listo</h2>
                      <p className="text-sm text-[#6B7280] mt-1 max-w-xs">
                        La configuración ha sido validada. Inicia la auditoría cuando estés listo.
                      </p>
                    </div>
                  </div>

                  {/* Configuración avanzada */}
                  <div className="border border-[#2D2D2D] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs text-[#6B7280] hover:text-white transition-colors hover:bg-[#242424]"
                    >
                      <span className="flex items-center gap-2 font-medium uppercase tracking-widest">
                        <Settings2 className="w-3.5 h-3.5" /> Límites de análisis
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                    </button>
                    {showAdvanced && (
                      <div className="px-4 pb-4 grid grid-cols-2 gap-3 bg-[#111111]/50">
                        {[
                          { label: 'Tamaño máx. por archivo (KB)', field: 'maxFileSizeKb' as const, min: 10, max: 500, def: 150 },
                          { label: 'Código total máximo (MB)',      field: 'maxTotalSizeMb' as const, min: 1,  max: 20,  def: 2   },
                          { label: 'Profundidad de directorios',    field: 'maxDirectoryDepth' as const, min: 2, max: 10, def: 6  },
                          { label: 'Commits a analizar',            field: 'maxCommits' as const, min: 10, max: 200, def: 50     },
                        ].map(({ label, field, min, max, def }) => (
                          <div key={field} className="space-y-1">
                            <label className="text-[10px] font-medium text-[#6B7280] uppercase tracking-widest">{label}</label>
                            <input
                              type="number"
                              min={min}
                              max={max}
                              defaultValue={def}
                              {...register(field, { min, max, valueAsNumber: true })}
                              className="w-full bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg px-3 py-2 text-sm text-white focus:border-[#F97316]/50 focus:outline-none transition-all"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#2D2D2D] bg-[#111111]/50 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 1 ? onCerrar : prevStep}
              className="text-sm text-[#6B7280] hover:text-white transition-colors flex items-center gap-1.5"
            >
              {step === 1 ? <X className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
              {step === 1 ? 'Cancelar' : 'Atrás'}
            </button>

            {step < 4 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={nextStep}
                disabled={
                  (step === 2 && !watch('name')) ||
                  (step === 3 && (!repositoryUrl || (selectedRepo && !isRepoValid)))
                }
                className="flex items-center gap-1.5"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                isLoading={cargando || isSubmitting}
                className="flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" /> Iniciar diagnóstico
              </Button>
            )}
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
