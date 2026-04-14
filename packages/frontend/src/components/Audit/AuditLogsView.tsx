import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  History,
  Search,
  Filter,
  User,
  Box,
  Clock,
  ShieldCheck,
  AlertCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { apiService } from '../../services/api.service';
import Button from '../ui/Button';

export default function AuditLogsView() {
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [resourceType, setResourceType] = useState<string>('');
  const [action, setAction] = useState<string>('');

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', offset, resourceType, action],
    queryFn: () => apiService.obtenerAuditLogs({ 
      limit, 
      offset, 
      resourceType: resourceType || undefined, 
      action: action || undefined 
    }),
  });

  const logs = auditData?.data || [];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'USER_AUTH': return <User className="w-4 h-4 text-blue-400" />;
      case 'DB_OPERATION': return <Database className="w-4 h-4 text-green-400" />;
      case 'ANALYSIS_START': return <ShieldCheck className="w-4 h-4 text-orange-400" />;
      case 'ERROR_SYSTEM': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#2D2D2D] pb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Registro de Auditoría</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Historial de acciones y eventos de seguridad en la plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-[#A0A0A0]">Nivel de registro: Detallado</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <select
            value={resourceType}
            onChange={(e) => setResourceType(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] text-sm text-white focus:border-[#F97316] outline-none transition-all appearance-none"
          >
            <option value="">Todos los recursos</option>
            <option value="PROJECT">Proyectos</option>
            <option value="ANALYSIS">Análisis</option>
            <option value="FINDING">Hallazgos</option>
            <option value="USER">Usuarios</option>
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Filtrar por acción (ej: CREATE)"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1E1E20] border border-[#2D2D2D] text-sm text-white placeholder-[#6B7280] focus:border-[#F97316] outline-none transition-all"
          />
        </div>

        <Button 
          variant="secondary" 
          onClick={() => { setResourceType(''); setAction(''); setOffset(0); }}
          className="w-full md:w-auto"
        >
          Limpiar filtros
        </Button>
      </div>

      {/* Table */}
      <div className="bg-[#1E1E20] border border-[#2D2D2D] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#2D2D2D] bg-[#242424]/50">
                <th className="px-6 py-4 font-semibold text-[#A0A0A0]">Evento</th>
                <th className="px-6 py-4 font-semibold text-[#A0A0A0]">Acción</th>
                <th className="px-6 py-4 font-semibold text-[#A0A0A0]">Recurso</th>
                <th className="px-6 py-4 font-semibold text-[#A0A0A0]">Detalle</th>
                <th className="px-6 py-4 font-semibold text-[#A0A0A0]">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-[#2D2D2D] rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#6B7280]">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              ) : (
                logs.map((log: any, idx: number) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-[#242424] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#242424] border border-[#2D2D2D]">
                          {getEventIcon(log.eventType)}
                        </div>
                        <div>
                          <p className="text-white font-medium capitalize">
                            {log.eventType.toLowerCase().replace('_', ' ')}
                          </p>
                          <p className="text-[10px] text-[#6B7280] font-mono">{log.ipAddress || '127.0.0.1'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-[#F97316]/10 text-[#F97316] text-[10px] font-bold border border-[#F97316]/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[#A0A0A0]">
                        <Box className="w-3.5 h-3.5" />
                        <span>{log.resourceType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#A0A0A0] max-w-xs truncate" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[#6B7280]">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {auditData?.hasMore && (
           <div className="p-4 border-t border-[#2D2D2D] flex justify-center">
              <Button 
                variant="secondary" 
                onClick={() => setOffset(offset + limit)}
                className="flex items-center gap-2"
              >
                Cargar más
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
           </div>
        )}
      </div>
    </div>
  );
}
