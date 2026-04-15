import { Bell, AlertCircle, TrendingUp, Settings, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api.service';
import { useToast } from '../../hooks/useToast';

export default function AlertsMonitor() {
  const toast = useToast();
  const { data: alertsData, isLoading, refetch } = useQuery({
    queryKey: ['global-alerts'],
    queryFn: () => apiService.obtenerHallazgosGlobales({ isIncident: true, limit: 100 }),
    refetchInterval: 10000,
  });

  const handleAcknowledge = async (alertId: string, alertTitle: string) => {
    try {
      await apiService.cambiarEstadoHallazgo(alertId, {
        status: 'IN_PROGRESS',
      });
      toast.success(`Alerta reconocida: ${alertTitle}`);
      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al reconocer la alerta');
    }
  };

  const handleResolve = async (alertId: string, alertTitle: string) => {
    try {
      await apiService.cambiarEstadoHallazgo(alertId, {
        status: 'RESOLVED',
      });
      toast.success(`Alerta resuelta: ${alertTitle}`);
      refetch();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al resolver la alerta');
    }
  };

  const alerts = (alertsData?.data || []).map((f: any) => ({
    id: f.id,
    title: `${f.riskType} detectado en ${f.file.split('/').pop()}`,
    severity: f.severity,
    timestamp: f.createdAt,
    source: `Proyecto: ${f.analysis?.project?.name || 'Sistema'}`,
    status: f.status === 'DETECTED' ? 'ACTIVE' : 
            f.status === 'IN_CORRECTION' ? 'ACKNOWLEDGED' : 
            f.status === 'CORRECTED' ? 'RESOLVED' : 'ACTIVE'
  }));

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'LOW':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-red-400';
      case 'ACKNOWLEDGED':
        return 'text-yellow-400';
      case 'RESOLVED':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length;

  return (
    <div className="flex flex-col h-full bg-[#0F0F0F]">
      {/* Header */}
      <div className="border-b border-[#2D2D2D] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Bell className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sistema de Alertas</h1>
              <p className="text-sm text-[#6B7280] mt-1">Monitoreo en tiempo real de amenazas y anomalías</p>
            </div>
          </div>
          <button className="p-2 hover:bg-[#242424] rounded-lg transition-all">
            <Settings className="w-5 h-5 text-[#6B7280] hover:text-white" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280]">Alertas Activas</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-white">{activeCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280]">Críticas</span>
              <TrendingUp className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-bold text-red-400">{criticalCount}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1C1C1E] border border-[#2D2D2D] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#6B7280]">Total</span>
              <Bell className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-orange-400">{alerts.length}</div>
          </motion.div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <Activity className="w-8 h-8 text-[#F97316] animate-spin" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-[#475569]">Sincronizando amenazas...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 border border-dashed border-[#2D2D2D] rounded-xl bg-[#1E1E20]/30">
            <Bell className="w-10 h-10 text-[#2D2D2D]" />
            <div className="text-center">
              <p className="text-white text-sm font-medium">Bandeja de alertas limpia</p>
              <p className="text-[#475569] text-xs">No se han detectado anomalías de prioridad alta en los activos monitoreados.</p>
            </div>
          </div>
        ) : alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`border rounded-lg p-4 transition-all hover:border-[#404040] ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-white">{alert.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mb-3">{alert.source}</p>
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  <span className={`font-medium ${getStatusColor(alert.status)}`}>{alert.status}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {alert.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id, alert.title)}
                    className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded text-xs hover:bg-orange-500/20 transition-all"
                  >
                    Reconocer
                  </button>
                )}
                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(alert.id, alert.title)}
                    className="px-3 py-1 bg-green-500/10 text-green-400 rounded text-xs hover:bg-green-500/20 transition-all"
                  >
                    Resolver
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
