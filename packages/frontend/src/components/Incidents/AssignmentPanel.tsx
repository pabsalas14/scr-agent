import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, X, Check, Search } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AssignmentPanelProps {
  assignedTo?: TeamMember;
  teamMembers?: TeamMember[];
  onAssign?: (member: TeamMember) => Promise<void>;
  onUnassign?: () => Promise<void>;
  isLoading?: boolean;
}

export default function AssignmentPanel({
  assignedTo,
  teamMembers = [],
  onAssign,
  onUnassign,
  isLoading,
}: AssignmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const toast = useToast();

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async (member: TeamMember) => {
    setIsAssigning(true);
    try {
      await onAssign?.(member);
      setIsOpen(false);
      setSearchTerm('');
      toast.success(`Asignado a ${member.name}`);
    } catch (error) {
      toast.error('Error al asignar');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    try {
      await onUnassign?.();
      toast.success('Asignación removida');
    } catch (error) {
      toast.error('Error al remover asignación');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-[#242424] border border-[#2D2D2D] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4" />
          Asignación
        </p>
        {assignedTo && (
          <button
            onClick={handleUnassign}
            disabled={isLoading || isAssigning}
            className="text-xs px-2 py-1 rounded bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors disabled:opacity-50"
          >
            Remover
          </button>
        )}
      </div>

      {/* Current Assignment */}
      {assignedTo ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-3 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-[#F97316] flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
            {assignedTo.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{assignedTo.name}</p>
            <p className="text-xs text-[#6B7280]">{assignedTo.email}</p>
          </div>
          <Check className="w-5 h-5 text-[#22C55E] flex-shrink-0" />
        </motion.div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 rounded-lg bg-[#1E1E20] border border-dashed border-[#2D2D2D] hover:border-[#F97316] transition-colors text-center text-sm text-[#6B7280] hover:text-white font-medium"
        >
          + Asignar a equipo
        </button>
      )}

      {/* Selection Dropdown */}
      {isOpen && !assignedTo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 pt-2 border-t border-[#2D2D2D]"
        >
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar miembro..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#1E1E20] border border-[#2D2D2D] text-white placeholder-[#6B7280] focus:border-[#F97316] focus:outline-none text-sm"
              autoFocus
            />
          </div>

          {/* Members List */}
          {filteredMembers.length > 0 ? (
            <div className="space-y-1 max-h-56 overflow-y-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssign(member)}
                  disabled={isAssigning}
                  className="w-full p-2 rounded-lg hover:bg-[#2D2D2D] transition-colors flex items-center gap-2 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{member.name}</p>
                    <p className="text-xs text-[#6B7280] truncate">{member.role}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B7280] text-center py-4">
              {teamMembers.length === 0 ? 'Sin miembros disponibles' : 'Sin resultados'}
            </p>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              setSearchTerm('');
            }}
            className="w-full py-2 text-xs text-[#6B7280] hover:text-white transition-colors border-t border-[#2D2D2D] pt-2"
          >
            Cancelar
          </button>
        </motion.div>
      )}

      {/* Info Text */}
      {assignedTo && (
        <p className="text-xs text-[#6B7280]">
          El usuario asignado recibirá notificaciones sobre cambios en este incidente.
        </p>
      )}
    </motion.div>
  );
}
