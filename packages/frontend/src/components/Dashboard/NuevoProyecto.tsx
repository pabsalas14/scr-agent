/**
 * Modal para crear un nuevo proyecto/repositorio
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import type { CrearProyectoDTO, AlcanceAnalisis } from '../../types/api';

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
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="text-lg font-bold text-gray-900">Nuevo Proyecto</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onCrear)} className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Mi repositorio"
              {...register('name', { required: 'El nombre es requerido' })}
            />
            {errors.name && (
              <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* URL del repositorio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del repositorio *
            </label>
            <input
              type="url"
              className="input-field"
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
              <p className="text-red-600 text-xs mt-1">{errors.repositoryUrl.message}</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Descripción del repositorio"
              {...register('description')}
            />
          </div>

          {/* Alcance del análisis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alcance del análisis *
            </label>
            <select className="input-field" {...register('scope')}>
              <option value="REPOSITORY">Repositorio completo</option>
              <option value="PULL_REQUEST">Solo Pull Requests</option>
              <option value="ORGANIZATION">Organización completa</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="button-secondary"
              disabled={cargando}
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={cargando}>
              {cargando ? '⏳ Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
