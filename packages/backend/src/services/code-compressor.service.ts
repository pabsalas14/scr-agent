/**
 * ============================================================================
 * CODE COMPRESSOR SERVICE - Reducir ruido en código antes de analizar
 * ============================================================================
 *
 * Remueve comentarios, espacios extra, líneas en blanco
 * Reduce tamaño del código ~30-40% sin perder información crítica
 */

import { logger } from './logger.service';

export class CodeCompressor {
  /**
   * Comprimir código fuente
   * - Remover comentarios de línea (//) y de bloque
   * - Remover líneas en blanco
   * - Remover espacios en blanco al inicio/final de líneas
   * - Normalizar espacios múltiples a uno solo
   */
  compress(code: string): string {
    if (!code || code.length === 0) {
      return '';
    }

    const originalSize = code.length;

    // CRITICAL FIX: Preserve file markers (// === filename ===) - they're NOT comments, they're metadata!
    // File markers are essential for the LLM to know which files it's analyzing
    // Without them, LLM hallucinations occur (reports files that don't exist)

    let compressed = code;

    // 1. Remover comentarios de línea (//) - BUT PRESERVE file markers
    // File markers look like: // === filename.ext ===
    // This regex removes ALL // comments EXCEPT file markers (both inline and full-line)
    compressed = compressed.replace(/\/\/(?!\s*===).*?$/gm, ''); // Remove non-marker comments (inline + full-line)

    // 2. Remover comentarios de bloque (/* */)
    compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');

    // 3. Remover líneas en blanco
    compressed = compressed.replace(/^\s*\n/gm, '');

    // 4. Remover espacios al inicio/final de líneas (pero preservar file markers)
    compressed = compressed
      .split('\n')
      .map(line => {
        // For file markers, preserve exact format
        if (line.includes('===')) {
          return line.trim();
        }
        return line.trim();
      })
      .filter(line => line.length > 0)
      .join('\n');

    // 5. Normalizar múltiples espacios a uno
    compressed = compressed.replace(/  +/g, ' ');

    const compressedSize = compressed.length;
    const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    logger.debug(`[CodeCompressor] ${originalSize} bytes → ${compressedSize} bytes (${reduction}% reducción) - File markers PRESERVED`);

    return compressed;
  }

  /**
   * Comprimir múltiples archivos
   */
  compressFiles(files: Array<{ path: string; content: string }>): Array<{ path: string; content: string }> {
    return files.map(file => ({
      path: file.path,
      content: this.compress(file.content),
    }));
  }

  /**
   * Obtener estadísticas de compresión
   */
  getStats(original: string, compressed: string): {
    originalSize: number;
    compressedSize: number;
    reduction: number;
    reductionPercent: number;
  } {
    const originalSize = original.length;
    const compressedSize = compressed.length;
    const reduction = originalSize - compressedSize;
    const reductionPercent = Math.round((reduction / originalSize) * 100);

    return {
      originalSize,
      compressedSize,
      reduction,
      reductionPercent,
    };
  }
}

// Instancia global
export const codeCompressor = new CodeCompressor();
