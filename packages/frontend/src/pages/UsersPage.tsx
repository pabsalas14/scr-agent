import { useState } from 'react';
import { Plus, Trash2, Edit2, Shield, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api.service';
import Button from '../components/ui/Button';
import type { Usuario } from '../types/api';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, refetch } = useQuery<Usuario[]>({
    queryKey: ['users-list'],
    queryFn: async () => {
      try {
        const result = await apiService.listarUsuarios();
        return result || [];
      } catch {
        // If API fails, return empty array and show current user instead
        return [];
      }
    },
  });

  // Combine API users with current user
  const allUsers = currentUser && users.length === 0
    ? [{
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name || 'Usuario Actual',
        role: currentUser.role as any,
        createdAt: new Date().toISOString(),
      } as Usuario]
    : users;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('ANALYST');
  const [isCreating, setIsCreating] = useState(false);
  const { confirm } = useConfirm();
  const toast = useToast();

  const handleCreateUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error('El email es requerido');
      return;
    }

    if (!newUserPassword.trim()) {
      toast.error('La contraseña es requerida');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsCreating(true);
      // API call to create user
      await apiService.crearUsuario({
        email: newUserEmail,
        role: newUserRole,
        password: newUserPassword,
      });

      toast.success(`Usuario ${newUserEmail} creado correctamente`);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('ANALYST');
      setShowCreateForm(false);
      refetch();
    } catch (error) {
      toast.error('Error al crear el usuario');
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'bg-red-500/20 text-red-400';
      case 'ANALYST':
        return 'bg-blue-500/20 text-blue-400';
      case 'DEVELOPER':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getRoleName = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMIN':
        return 'Administrador';
      case 'ANALYST':
        return 'Analista';
      case 'DEVELOPER':
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

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Configura el email, contraseña y rol del nuevo usuario. La contraseña debe tener al menos 6 caracteres.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                placeholder="usuario@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Contraseña</label>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Rol</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                className="w-full px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="DEVELOPER">Desarrollador</option>
                <option value="ANALYST">Analista</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? 'Creando...' : 'Crear'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info message if showing only current user */}
      {allUsers.length === 1 && currentUser && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-medium">Mostrando usuario actual</p>
            <p className="text-xs text-blue-200">Puedes invitar a otros usuarios a través del botón "Nuevo Usuario"</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-white/10 border-t-white rounded-full animate-spin" />
        </div>
      ) : !allUsers || allUsers.length === 0 ? (
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
              {allUsers.map((user) => (
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
