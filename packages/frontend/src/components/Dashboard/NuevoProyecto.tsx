import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import type { CrearProyectoDTO } from '../../types/api';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface NuevoProyectoProps {
  onCrear: (dto: CrearProyectoDTO) => void;
  onCerrar: () => void;
  cargando: boolean;
}

export default function NuevoProyecto({ onCrear, onCerrar, cargando }: NuevoProyectoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CrearProyectoDTO>({
    defaultValues: { scope: 'REPOSITORY' },
  });

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
          className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
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
          <form onSubmit={handleSubmit(onCrear)} className="p-6 space-y-5">
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
                  { value: 'REPOSITORY', label: '📁 Repositorio completo', desc: 'Analizar todo el código' },
                  { value: 'PULL_REQUEST', label: '📌 Pull Request específico', desc: 'Solo cambios de un PR' },
                  { value: 'ORGANIZATION', label: '🏢 Organización completa', desc: 'Todos los repos de la org' },
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
