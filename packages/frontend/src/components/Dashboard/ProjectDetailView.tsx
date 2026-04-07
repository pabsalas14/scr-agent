/**
 * Vista Detalle de Proyecto
 * Muestra detalles, permite editar y eliminar
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api.service';
import type { Proyecto, AlcanceAnalisis } from '../../types/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

interface ProjectDetailViewProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onProjectDeleted?: () => void;
}

const SCOPE_LABELS: Record<string, string> = {
  REPOSITORY: '📁 Repositorio Completo',
  ORGANIZATION: '🏢 Organización',
  PULL_REQUEST: '📌 Pull Request Específico',
};

export default function ProjectDetailView({
  projectId,
  isOpen,
  onClose,
  onProjectDeleted,
}: ProjectDetailViewProps) {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'REPOSITORY',
  });

  // Obtener detalles del proyecto
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => apiService.obtenerProyecto(projectId),
    enabled: isOpen,
  });

  const project = projectData as Proyecto | undefined;

  // Obtener análisis del proyecto
  const { data: analysesData } = useQuery({
    queryKey: ['project-analyses', projectId],
    queryFn: () => apiService.obtenerAnalisisDeProyecto(projectId),
    enabled: isOpen && mostrarHistorial,
  });

  const analyses = analysesData || [];

  // Actualizar proyecto
  const actualizarMutation = useMutation({
    mutationFn: (data: { name: string; description: string; scope: string }) => apiService.actualizarProyecto(projectId, { ...data, scope: data.scope as AlcanceAnalisis }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      setEditando(false);
    },
  });

  // Eliminar proyecto
  const eliminarMutation = useMutation({
    mutationFn: () => apiService.eliminarProyecto(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onProjectDeleted?.();
      onClose();
    },
  });

  const handleActualizar = () => {
    actualizarMutation.mutate(formData);
  };

  const handleEliminar = () => {
    eliminarMutation.mutate();
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Cargando...">
        <div className="flex justify-center py-8">
          <div className="animate-spin text-4xl">⟳</div>
        </div>
      </Modal>
    );
  }

  if (!project) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Proyecto no encontrado">
        <div className="text-center py-8">
          <p className="text-[#6B7280]">El proyecto no existe</p>
        </div>
      </Modal>
    );
  }

  // Inicializar formulario cuando entra en modo edición
  useEffect(() => {
    if (editando && project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        scope: project.scope,
      });
    }
  }, [editando, project]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editando ? '✏️ Editar Proyecto' : project.name} size="lg" >
      <div className="space-y-6">
        {/* Información del Proyecto */}
        {!editando ? (
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                Nombre del Proyecto
              </label>
              <p className="text-lg font-semibold text-white">{project.name}</p>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                URL del Repositorio
              </label>
              <a
                href={project.repositoryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F97316] hover:underline font-mono text-sm break-all"
              >
                {project.repositoryUrl}
              </a>
            </div>

            {/* Scope */}
            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                Alcance del Análisis
              </label>
              <div className="inline-block px-3 py-2 bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20 rounded-lg text-sm font-medium">
                {SCOPE_LABELS[project.scope] || project.scope}
              </div>
            </div>

            {/* Descripción */}
            {project.description && (
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Descripción
                </label>
                <p className="text-[#A0A0A0]">{project.description}</p>
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2D2D2D]">
              <div>
                <p className="text-sm text-[#6B7280]">Total de Análisis</p>
                <p className="text-2xl font-bold text-white">
                  {analyses.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-[#6B7280]">Creado</p>
                <p className="text-sm text-white">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Formulario de Edición */
          <div className="space-y-4">
            <Input
              label="Nombre del Proyecto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <Input
              label="Descripción"
              placeholder="Opcional"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Alcance del Análisis
              </label>
              <select
                value={formData.scope}
                onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                className="w-full px-3 py-2 border border-[#2D2D2D] rounded-lg bg-[#1C1C1E] text-white focus:border-[#F97316]/50 focus:outline-none"
              >
                <option value="REPOSITORY">{SCOPE_LABELS['REPOSITORY']}</option>
                <option value="ORGANIZATION">{SCOPE_LABELS['ORGANIZATION']}</option>
                <option value="PULL_REQUEST">{SCOPE_LABELS['PULL_REQUEST']}</option>
              </select>
            </div>
          </div>
        )}

        {/* Historial de Análisis */}
        <div className="border-t border-[#2D2D2D] pt-4">
          <button
            onClick={() => setMostrarHistorial(!mostrarHistorial)}
            className="flex items-center gap-2 text-sm font-medium text-white hover:text-[#A0A0A0]"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform ${mostrarHistorial ? 'rotate-180' : ''}`}
            />
            Historial de Análisis ({analyses.length})
          </button>

          <AnimatePresence>
            {mostrarHistorial && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-2">
                {analyses.length === 0 ? (
                  <p className="text-sm text-[#4B5563]">Sin análisis</p>
                ) : (
                  (analyses as { id: string; status: string; createdAt: string; progress?: number }[]).map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-3 bg-[#242424] rounded-lg border border-[#2D2D2D] text-sm">
                      <div>
                        <p className="font-medium text-white">{analysis.status}</p>
                        <p className="text-xs text-[#4B5563]">
                          {new Date(analysis.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#6B7280]">{analysis.progress || 0}%</span>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Acciones */}
        <div className="border-t border-[#2D2D2D] pt-4 space-y-3">
          {!editando ? (
            <>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setEditando(true)}
              >
                <Edit className="w-4 h-4" />
                Editar Proyecto
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => setConfirmarEliminar(true)}
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Proyecto
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                className="w-full"
                onClick={handleActualizar}
                disabled={actualizarMutation.isPending}
                isLoading={actualizarMutation.isPending}
              >
                Guardar Cambios
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setEditando(false)}
              >
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Confirmación de Eliminar */}
      <AnimatePresence>
        {confirmarEliminar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setConfirmarEliminar(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl p-6 max-w-sm mx-4"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-white">
                  Eliminar Proyecto
                </h3>
              </div>
              <p className="text-[#6B7280] mb-6">
                ¿Estás seguro? Esta acción no se puede deshacer y se eliminarán todos los análisis asociados.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setConfirmarEliminar(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleEliminar}
                  disabled={eliminarMutation.isPending}
                  isLoading={eliminarMutation.isPending}
                >
                  Eliminar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
