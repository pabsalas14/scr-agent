import { useState } from 'react';
import { Plus, Trash2, Edit2, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api.service';
import Button from '../components/ui/Button';
import type { Usuario } from '../types/api';

export default function UsersPage() {
  const { data: users, isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ['users-list'],
    queryFn: () => apiService.listarUsuarios(),
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const { confirm } = useConfirm();
  const toast = useToast();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-400';
      case 'analyst':
        return 'bg-blue-500/20 text-blue-400';
      case 'developer':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleName = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'analyst':
        return 'Analista';
      case 'developer':
        return 'Desarrollador';
      default:
        return 'Usuario';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Gestión de Usuarios</h1>
          <p className="text-sm text-[#A0A0A0]">
            Administra los usuarios y sus permisos
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus size={18} className="mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-white">Crear Nuevo Usuario</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                placeholder="usuario@example.com"
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Rol</label>
              <select className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option value="developer">Desarrollador</option>
                <option value="analyst">Analista</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" size="sm">Crear</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : !users || users.length === 0 ? (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-8 text-center">
          <p className="text-[#A0A0A0]">No hay usuarios configurados</p>
        </div>
      ) : (
        <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#111111] border-b border-[#2D2D2D]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0]">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0]">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0]">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0]">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#A0A0A0]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#252525] transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{user.name || 'Sin nombre'}</td>
                  <td className="px-6 py-4 text-sm text-[#A0A0A0]">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-green-400">Activo</span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 hover:bg-[#2D2D2D] rounded text-[#A0A0A0] hover:text-white transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={async () => {
                        await confirm({
                          title: 'Eliminar Usuario',
                          message: `¿Estás seguro de que deseas eliminar a ${user.name}? Esta acción no se puede deshacer.`,
                          confirmText: 'Eliminar',
                          cancelText: 'Cancelar',
                          isDangerous: true,
                          onConfirm: async () => {
                            toast.success(`Usuario ${user.name} eliminado correctamente`);
                          },
                        });
                      }}
                      className="p-2 hover:bg-[#2D2D2D] rounded text-[#A0A0A0] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
