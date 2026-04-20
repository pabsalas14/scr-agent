/**
 * Failed Chunks Widget
 * Shows chunks that failed after retries
 * Displays retry attempts and error messages
 */

import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Button from '../ui/Button';

interface FailedChunk {
  index: number;
  error: string;
  attempts: number;
}

interface FailedChunksWidgetProps {
  failedChunks: FailedChunk[];
  totalChunks: number;
  onRetry?: () => void;
}

export default function FailedChunksWidget({
  failedChunks,
  totalChunks,
  onRetry,
}: FailedChunksWidgetProps) {
  if (!failedChunks || failedChunks.length === 0) {
    return null;
  }

  const failureRate = ((failedChunks.length / totalChunks) * 100).toFixed(1);

  return (
    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-red-400">
            {failedChunks.length} chunk(s) fallaron después de reintentos
          </p>
          <p className="text-sm text-red-300 mt-1">
            {failureRate}% de los chunks ({failedChunks.length}/{totalChunks})
          </p>
        </div>
      </div>

      {/* Failed Chunks List */}
      <div className="bg-red-950/30 rounded p-3 max-h-48 overflow-y-auto space-y-2">
        {failedChunks.map((chunk, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-sm border-l-2 border-red-700 pl-2 py-1"
          >
            <div className="flex-1">
              <p className="text-red-300 font-mono text-xs">
                Chunk {chunk.index + 1}
              </p>
              <p className="text-red-400 text-xs mt-0.5">{chunk.error}</p>
              <p className="text-red-500 text-xs mt-1">
                Intentos: {chunk.attempts}/3
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="text-xs text-red-300">
        <p>
          ℹ️ Se procesaron{' '}
          <strong>{totalChunks - failedChunks.length} chunks exitosamente</strong>
          . Los hallazgos de esos chunks están incluidos en el análisis.
        </p>
      </div>

      {/* Retry Button */}
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <RotateCw className="w-4 h-4" />
          Reintentar Chunks Fallidos
        </Button>
      )}
    </div>
  );
}
