/**
 * Monitor de Costos
 * Muestra gastos por modelo de IA
 */

import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '../../services/monitoring.service';
import { DollarSign } from 'lucide-react';

export default function CostsMonitor() {
  const { data: costs, isLoading } = useQuery({
    queryKey: ['costs'],
    queryFn: () => monitoringService.getCosts('month'),
    refetchInterval: 60000, // Actualizar cada 1 min
  });

  if (isLoading) {
    return (
      <div className="glass-sm rounded-xl p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">Cargando datos de costos...</p>
      </div>
    );
  }

  if (!costs) return null;

  const totalPercentages = costs.entries.map((entry) => (entry.costUSD / costs.totalCostUSD) * 100);

  return (
    <div className="space-y-6">
      {/* Resumen Total */}
      <div className="glass-sm rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Costo Total (Mes)</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${costs.totalCostUSD.toFixed(2)}
            </p>
          </div>
          <DollarSign className="w-12 h-12 text-blue-500 opacity-20" />
        </div>
      </div>

      {/* Tabla de costos por modelo */}
      <div className="glass-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/20 dark:bg-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Modelo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Llamadas</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Tokens</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Costo</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">% Total</th>
              </tr>
            </thead>
            <tbody>
              {costs.entries.map((entry, i) => (
                <tr key={entry.model} className={i % 2 === 0 ? 'bg-white/5' : ''}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{entry.model}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{entry.calls.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                    {((entry.inputTokens + entry.outputTokens) / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-semibold text-right">
                    ${entry.costUSD.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    {totalPercentages[i].toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribución visual */}
      <div className="glass-sm rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribución de Costos</h3>
        <div className="space-y-3">
          {costs.entries.map((entry, i) => (
            <div key={entry.model}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.model}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">${entry.costUSD.toFixed(2)}</span>
              </div>
              <div className="bg-gray-200 dark:bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    i === 0
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                      : i === 1
                      ? 'bg-gradient-to-r from-purple-500 to-purple-400'
                      : 'bg-gradient-to-r from-pink-500 to-pink-400'
                  }`}
                  style={{ width: `${totalPercentages[i]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Proyección */}
      <div className="glass-sm rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Proyección Anual</h3>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          ${(costs.totalCostUSD * 12).toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Basado en el gasto del mes actual</p>
      </div>
    </div>
  );
}
