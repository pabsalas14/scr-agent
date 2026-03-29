import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Zap, GitBranch, Building2, X, Shield, Search, Terminal } from 'lucide-react';
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
  icon: any;
  accent: string;
}> = [
  {
    id: 'REPOSITORIO',
    label: 'Repositorio Completo',
    desc: 'Protocolo de análisis profundo de base de código.',
    icon: Terminal,
    accent: '#00D1FF',
  },
  {
    id: 'PULL_REQUEST',
    label: 'Pull Request',
    desc: 'Auditoría de cambios específicos entrantes.',
    icon: GitBranch,
    accent: '#7000FF',
  },
  {
    id: 'ORGANIZACION',
    label: 'Organización',
    desc: 'Escaneo masivo de activos institucionales.',
    icon: Building2,
    accent: '#FFD600',
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

  const repositoryUrl = watch('repositoryUrl');

  const nextStep = () => {
    if (step < 4) setStep((step + 1) as Step);
  };

  const prevStep = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleScopeSelect = (scope: ScopeType) => {
    setSelectedScope(scope);
    setValue('scope', scope);
    nextStep();
  };

  const onSubmit = (data: CrearProyectoDTO) => {
    data.scope = selectedScope || 'REPOSITORIO';
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
      onClick={onCerrar}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#050505] border border-[#1F2937] rounded-[2rem] max-w-2xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col relative"
        >
          {/* Progress Indicator Dots */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  s === step ? 'bg-gradient-to-r from-[#00D1FF] to-[#7000FF] w-6 shadow-[0_0_15px_rgba(0,209,255,0.5)]' : s < step ? 'bg-[#00D1FF]/40 w-1.5' : 'bg-white/10 w-1.5'
                }`} 
              />
            ))}
          </div>

          <div className="p-10 pt-16 flex flex-col min-h-[500px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Protocolo de Inicio</h2>
                    <p className="text-[#64748B] font-medium uppercase text-[10px] tracking-[0.2em]">Seleccione el Vector de Observabilidad</p>
                  </div>
                  
                  <div className="grid gap-4">
                    {SCOPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleScopeSelect(option.id)}
                          className="group relative p-6 rounded-2xl bg-[#0A0B10] border border-[#1F2937] text-left hover:border-[#00D1FF]/50 transition-all overflow-hidden"
                        >
                          <div className="relative z-10 flex items-center gap-6">
                            <div className="w-12 h-12 rounded-xl bg-[#111218] flex items-center justify-center border border-[#1F2937] group-hover:scale-110 transition-transform">
                              <Icon className="w-6 h-6 text-[#00D1FF]" />
                            </div>
                            <div>
                              <h3 className="text-white font-black tracking-tight">{option.label}</h3>
                              <p className="text-[#64748B] text-xs font-medium">{option.desc}</p>
                            </div>
                            <ChevronRight className="ml-auto w-4 h-4 text-[#475569] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white tracking-tighter">Identificación del Asset</h2>
                    <p className="text-[#64748B] font-medium uppercase text-[10px] tracking-[0.2em]">Detalles Administrativos</p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Etiqueta del Proyecto</label>
                      <input
                        {...register('name', { required: 'Identificador requerido' })}
                        autoFocus
                        placeholder="ej. Core-API-Audit"
                        className="w-full bg-[#0A0B10] border border-[#1F2937] rounded-xl px-4 py-3 text-white focus:border-[#00D1FF]/50 focus:outline-none transition-all placeholder:text-[#475569]"
                      />
                      {errors.name && <p className="text-[#FF3B3B] text-[10px] font-bold">{errors.name.message}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white tracking-tighter">Enlace de Repositorio</h2>
                    <p className="text-[#64748B] font-medium uppercase text-[10px] tracking-[0.2em]">Sincronización con GitHub</p>
                  </div>
                  
                  <div className="bg-[#0A0B10] border border-[#1F2937] rounded-2xl p-6 min-h-[300px]">
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
                      <div className="mt-4 flex items-center gap-2 text-[#FF3B3B] text-[10px] font-bold">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Falla de Validación: {repoValidationError}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center flex-1 space-y-6 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-[#00D1FF]/10 flex items-center justify-center border border-[#00D1FF]/30">
                    <Shield className="w-10 h-10 text-[#00D1FF] shadow-[0_0_20px_#00D1FF66]" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Protocolo Listo</h2>
                    <p className="text-[#64748B] max-w-xs font-medium">
                      La configuración del perímetro ha sido validada. Inicie la fase de diagnóstico profundo.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="p-8 border-t border-[#1F2937] bg-[#0A0B10]/50 flex items-center justify-between">
            <button
              type="button"
              onClick={step === 1 ? onCerrar : prevStep}
              className="text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:text-white transition-colors flex items-center gap-2"
            >
              {step === 1 ? <X className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
              {step === 1 ? 'Abortar' : 'Atrás'}
            </button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={
                  (step === 2 && !watch('name')) ||
                  (step === 3 && (!repositoryUrl || (selectedRepo && !isRepoValid)))
                }
                className="bg-[#111218] border border-[#1F2937] text-[#00D1FF] px-8 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-[#00D1FF] hover:text-black transition-all"
              >
                Siguiente
                <ChevronRight className="w-3 h-3 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                isLoading={cargando || isSubmitting}
                className="bg-[#00D1FF] text-black font-black px-10 py-3 rounded-xl text-[10px] tracking-widest uppercase hover:bg-[#00D1FF]/80 shadow-[0_0_20px_rgba(0,209,255,0.3)]"
              >
                <Zap className="w-3.5 h-3.5 mr-2" />
                Divergir Diagnóstico
              </Button>
            )}
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}

function AlertTriangle(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
