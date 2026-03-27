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
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CrearProyectoDTO>({
    defaultValues: { scope: 'REPOSITORIO' },
  });

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
    onCrear(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCerrar}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 max-w-2xl w-full shadow-2xl overflow-hidden"
      >
        {/* Header con progress */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-b border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Nuevo Análisis</h2>
              <p className="text-gray-400">Crear un nuevo proyecto de seguridad</p>
            </div>
            <button
              onClick={onCerrar}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2">
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

        {/* Content */}
        <div className="p-8 min-h-96">
          <AnimatePresence mode="wait">
            {/* Step 1: Seleccionar tipo */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-gray-300 mb-6">
                  ¿Qué tipo de análisis deseas realizar?
                </p>
                <div className="grid gap-4">
                  {SCOPE_OPTIONS.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleScopeSelect(option.id)}
                      className="p-4 rounded-lg border-2 transition-all text-left group hover:border-opacity-100 border-opacity-50"
                      style={{
                        borderColor: option.color,
                        backgroundColor: `${option.color}10`,
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="p-3 rounded-lg text-white group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: option.color }}
                        >
                          {option.icon}
                        </div>
                        <div>
                          <h3
                            className="font-semibold transition-colors"
                            style={{ color: option.color }}
                          >
                            {option.label}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">{option.desc}</p>
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
                className="space-y-4"
              >
                <p className="text-gray-300 mb-6">Información del {SCOPE_OPTIONS.find(s => s.id === selectedScope)?.label}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Proyecto *
                  </label>
                  <input
                    {...register('name', { required: 'El nombre es obligatorio' })}
                    placeholder="Ej: Mi Aplicación"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 3: URL/Repositorio */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-gray-300 mb-6">URL del repositorio</p>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Repository URL *
                  </label>
                  <input
                    {...register('repositoryUrl', {
                      required: 'La URL es obligatoria',
                      pattern: {
                        value: /^https:\/\/github\.com\//,
                        message: 'Debe ser una URL de GitHub válida',
                      },
                    })}
                    placeholder="https://github.com/usuario/repo"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {errors.repositoryUrl && (
                    <p className="text-red-400 text-sm mt-1">{errors.repositoryUrl.message}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirmar */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="flex justify-center mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <Check className="w-8 h-8 text-white" />
                  </motion.div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    ¡Todo listo para analizar!
                  </h3>
                  <p className="text-gray-400">
                    Hemos configurado tu proyecto. Presiona el botón para comenzar el análisis de seguridad.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer con botones */}
        <div className="bg-slate-900/50 border-t border-slate-700/50 p-6 flex justify-between gap-4">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={step === 1 || cargando}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>

          {step < 4 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={cargando}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <form onSubmit={handleSubmit((data) => onSubmit(data))}>
              <Button
                variant="primary"
                type="submit"
                disabled={cargando}
                isLoading={cargando}
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {cargando ? 'Creando...' : 'Iniciar Análisis'}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
