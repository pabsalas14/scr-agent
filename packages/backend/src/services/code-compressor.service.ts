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

    // 1. Remover comentarios de línea (//)
    let compressed = code.replace(/\/\/.*?$/gm, '');

    // 2. Remover comentarios de bloque (/* */)
    compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');

    // 3. Remover líneas en blanco
    compressed = compressed.replace(/^\s*\n/gm, '');

    // 4. Remover espacios al inicio/final de líneas
    compressed = compressed
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    // 5. Normalizar múltiples espacios a uno
    compressed = compressed.replace(/  +/g, ' ');

    const compressedSize = compressed.length;
    const reduction = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    logger.debug(`[CodeCompressor] ${originalSize} bytes → ${compressedSize} bytes (${reduction}% reducción)`);

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
