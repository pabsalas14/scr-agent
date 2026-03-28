/**
 * Monitor de Costos
 * Muestra GASTOS REALES por modelo de IA (USD)
 */

import { useQuery } from '@tanstack/react-query';
import { monitoringService } from '../../services/monitoring.service';
import Card from '../ui/Card';
import { DollarSign, TrendingUp } from 'lucide-react';

export default function CostsMonitor() {
  const { data: costs, isLoading } = useQuery({
    queryKey: ['costs'],
    queryFn: () => monitoringService.getCosts('month'),
    refetchInterval: 60000, // Actualizar cada 1 min
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Cargando datos de costos...</p>
        </div>
      </Card>
    );
  }

  if (!costs || costs.entries.length === 0) {
    return (
      <Card>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Sin análisis completados aún. Los costos aparecerán después del primer análisis.
          </p>
        </div>
      </Card>
    );
  }

  const totalPercentages = (costs?.entries || []).map((entry) =>
    (costs?.totalCostUSD || 0) > 0 ? (entry.costUSD / (costs?.totalCostUSD || 1)) * 100 : 0
  );

  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];

  return (
    <div className="space-y-6">
      {/* Resumen Total (Prominente) */}
      <Card elevated>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Costo Total (Este Mes)</p>
            <p className="text-5xl font-bold text-gray-900 dark:text-white">
              ${costs.totalCostUSD.toFixed(2)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Basado en tokens reales usados por los agentes (Claude API USD pricing)
            </p>
          </div>
          <div className="text-right">
            <DollarSign className="w-20 h-20 text-blue-200 dark:text-blue-900 mb-2" />
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              ↑ ${(costs.totalCostUSD * 12).toFixed(2)}/año
            </p>
          </div>
        </div>
      </Card>

      {/* Tabla de costos por modelo */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Desglose por Modelo</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Modelo</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Llamadas</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Tokens (M)</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Costo USD</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">% Total</th>
              </tr>
            </thead>
            <tbody>
              {costs.entries.map((entry, i) => (
                <tr key={entry.model} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{entry.model}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-right">{entry.calls.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-right">
                    {((entry.inputTokens + entry.outputTokens) / 1000000).toFixed(1)}M
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-semibold text-right">
                    ${entry.costUSD.toFixed(4)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-right">
                    {totalPercentages[i]!.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Distribución visual */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Distribución de Costos
        </h3>
        <div className="space-y-4">
          {costs.entries.map((entry, i) => (
            <div key={entry.model}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.model}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.inputTokens.toLocaleString()} entrada + {entry.outputTokens.toLocaleString()} salida
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white ml-4">
                  ${entry.costUSD.toFixed(4)}
                </p>
              </div>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${colors[i % colors.length]} transition-all`}
                  style={{ width: `${totalPercentages[i]}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {totalPercentages[i]!.toFixed(1)}% del total
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Proyección anual */}
      {costs.totalCostUSD > 0 && (
        <Card elevated>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Proyección Anual</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${(costs.totalCostUSD * 12).toFixed(2)}/año
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Extrapolado del gasto de este mes
              </p>
            </div>
            <div className="text-right text-4xl font-bold text-green-600 dark:text-green-400">
              📊
            </div>
          </div>
        </Card>
      )}

      {/* Info de pricing */}
      <Card>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p className="font-semibold text-gray-900 dark:text-white mb-3">Precios Aplicados (USD)</p>
          <div className="space-y-1 font-mono text-xs">
            <p>• GPT-4 Turbo: $0.00001/input, $0.00003/output</p>
            <p>• GPT-3.5-turbo: $0.0000005/input, $0.0000015/output</p>
            <p>• Claude-3-Opus: $0.000015/input, $0.000075/output</p>
            <p>• Claude-3-Sonnet: $0.000003/input, $0.000015/output</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
