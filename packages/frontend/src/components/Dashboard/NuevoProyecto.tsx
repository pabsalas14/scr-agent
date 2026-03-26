import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import type { CrearProyectoDTO } from '../../types/api';

interface NuevoProyectoProps {
  onCrear: (dto: CrearProyectoDTO) => void;
  onCerrar: () => void;
  cargando: boolean;
}

export default function NuevoProyecto({ onCrear, onCerrar, cargando }: NuevoProyectoProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CrearProyectoDTO>({
    defaultValues: { scope: 'REPOSITORY' },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18 }}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Nuevo proyecto</h3>
            <p className="text-xs text-slate-500 mt-0.5">Agrega un repositorio para analizar</p>
          </div>
          <button onClick={onCerrar} className="btn-icon text-lg leading-none">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onCrear)} className="px-6 py-5 space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre del proyecto <span className="text-red-500">*</span>
            </label>
            <input
              className="input"
              placeholder="Mi repositorio"
              {...register('name', { required: 'El nombre es requerido' })}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              URL del repositorio <span className="text-red-500">*</span>
            </label>
            <input
              className="input font-mono text-sm"
              placeholder="https://github.com/org/repo"
              {...register('repositoryUrl', {
                required: 'La URL del repositorio es requerida',
                pattern: {
                  value: /https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/.+/,
                  message: 'Solo se soporta GitHub, GitLab o Bitbucket',
                },
              })}
            />
            {errors.repositoryUrl && (
              <p className="text-xs text-red-500 mt-1">{errors.repositoryUrl.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Descripcion
            </label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Descripcion opcional del repositorio..."
              {...register('description')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Alcance
            </label>
            <select className="input" {...register('scope')}>
              <option value="REPOSITORY">Repositorio completo</option>
              <option value="PULL_REQUEST">Solo Pull Requests</option>
              <option value="ORGANIZATION">Organizacion completa</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCerrar} className="btn-secondary" disabled={cargando}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={cargando}>
              {cargando ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creando...</span>
                </>
              ) : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
