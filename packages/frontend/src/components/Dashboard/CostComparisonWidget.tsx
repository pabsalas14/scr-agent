/**
 * Cost Comparison Widget
 * Shows the trade-off between different LLM providers
 * Cost vs Time analysis
 */

import React from 'react';
import { DollarSign, Zap, Clock, TrendingDown } from 'lucide-react';

interface CostData {
  provider: string;
  model: string;
  costPer1M: {
    input: number;
    output: number;
  };
  avgTimePerChunk: number; // minutes
  totChunks?: number;
}

const providers: CostData[] = [
  {
    provider: 'Anthropic',
    model: 'Claude Sonnet',
    costPer1M: { input: 3, output: 15 },
    avgTimePerChunk: 1.5,
  },
  {
    provider: 'OpenAI',
    model: 'GPT-4 Turbo',
    costPer1M: { input: 10, output: 30 },
    avgTimePerChunk: 2,
  },
  {
    provider: 'LM Studio',
    model: 'qwen2.5-coder-7b',
    costPer1M: { input: 0.3, output: 0.5 },
    avgTimePerChunk: 15,
  },
];

export default function CostComparisonWidget() {
  const estimatedTokensPerChunk = 3000; // ~3K tokens per chunk (input + output)
  const totalChunks = 1500; // juice-shop example

  const calculateMetrics = (provider: CostData) => {
    // Estimate tokens (rough)
    const totalTokens = estimatedTokensPerChunk * totalChunks;
    const avgInputRatio = 0.6; // ~60% input, 40% output
    const inputTokens = totalTokens * avgInputRatio;
    const outputTokens = totalTokens * (1 - avgInputRatio);

    const cost =
      (inputTokens / 1_000_000) * provider.costPer1M.input +
      (outputTokens / 1_000_000) * provider.costPer1M.output;

    const totalTime = provider.avgTimePerChunk * totalChunks; // minutes
    const hours = totalTime / 60;
    const days = hours / 24;

    return {
      cost: cost,
      totalTime,
      hours,
      days,
      timeUnit: hours < 24 ? `${hours.toFixed(1)}h` : `${days.toFixed(1)}d`,
    };
  };

  const metrics = providers.map((p) => ({
    ...p,
    ...calculateMetrics(p),
  }));

  const cheapest = metrics.reduce((min, m) => (m.cost < min.cost ? m : min));
  const fastest = metrics.reduce((min, m) => (m.hours < min.hours ? m : min));

  return (
    <div className="space-y-6">
      <div className="bg-[#252525] rounded-lg border border-[#2D2D2D] p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Análisis de Costo vs Tiempo
          </h3>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Estimación para juice-shop (1500 chunks, ~4.5M tokens):
        </p>

        {/* Comparison Table */}
        <div className="space-y-4">
          {metrics.map((m, idx) => (
            <div
              key={idx}
              className="bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D] hover:border-[#3D3D3D] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{m.provider}</p>
                  <p className="text-xs text-gray-400">{m.model}</p>
                </div>

                {/* Badges */}
                <div className="flex gap-2">
                  {m.cost === cheapest.cost && (
                    <span className="bg-green-900/30 border border-green-700 text-green-400 text-xs px-2 py-1 rounded">
                      Más barato
                    </span>
                  )}
                  {m.hours === fastest.hours && (
                    <span className="bg-blue-900/30 border border-blue-700 text-blue-400 text-xs px-2 py-1 rounded">
                      Más rápido
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Cost */}
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <DollarSign className="w-3 h-3" />
                    <span>Costo</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    ${m.cost.toFixed(2)}
                  </p>
                  {m.cost !== cheapest.cost && (
                    <p className="text-xs text-gray-500 mt-1">
                      +${(m.cost - cheapest.cost).toFixed(2)} vs cheaper
                    </p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <Clock className="w-3 h-3" />
                    <span>Tiempo</span>
                  </div>
                  <p className="text-xl font-bold text-white">{m.timeUnit}</p>
                  {m.hours !== fastest.hours && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{((m.hours - fastest.hours) * 60).toFixed(0)}min vs faster
                    </p>
                  )}
                </div>

                {/* Cost Per Hour */}
                <div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
                    <Zap className="w-3 h-3" />
                    <span>$/hora</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    ${(m.cost / m.hours).toFixed(2)}/h
                  </p>
                  {m.cost / m.hours > cheapest.cost / cheapest.hours && (
                    <p className="text-xs text-gray-500 mt-1">
                      More expensive
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="mt-6 bg-[#1E1E1E] rounded-lg p-4 border border-[#2D2D2D]">
          <p className="text-sm font-semibold text-white mb-3">
            💡 Recomendaciones:
          </p>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>
              ✅ <strong>Urgente (&lt;1h):</strong> Usa Anthropic Claude
              <br />
              <span className="text-xs text-gray-500">
                Rápido pero $450 por análisis grande
              </span>
            </li>
            <li>
              ✅ <strong>Análisis nocturno:</strong> Usa qwen2.5
              <br />
              <span className="text-xs text-gray-500">
                Solo $45, puede esperar 20 horas
              </span>
            </li>
            <li>
              ✅ <strong>Producción:</strong> Usa Anthropic + qwen como fallback
              <br />
              <span className="text-xs text-gray-500">
                Si timeout en qwen, retry con Anthropic
              </span>
            </li>
            <li>
              ⚠️ <strong>OpenAI:</strong> No recomendado
              <br />
              <span className="text-xs text-gray-500">
                Más caro que Anthropic y más lento
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
