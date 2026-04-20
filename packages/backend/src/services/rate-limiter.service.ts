/**
 * ============================================================================
 * RATE LIMITER SERVICE - Control de flujo de peticiones a LM Studio
 * ============================================================================
 *
 * Evita bombardear LM Studio con peticiones simultáneas
 * Máximo: 1 petición cada 2 segundos
 */

import { logger } from './logger.service';

export class RateLimiter {
  private lastRequestTime = 0;
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private readonly minInterval: number; // ms entre peticiones

  constructor(requestsPerSecond: number = 0.5) {
    // 0.5 req/sec = 1 petición cada 2 segundos
    this.minInterval = 1000 / requestsPerSecond;
    logger.info(`[RateLimiter] Initialized: ${requestsPerSecond} req/sec (${this.minInterval}ms entre peticiones)`);
  }

  /**
   * Esperar hasta que sea seguro enviar la siguiente petición
   */
  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      logger.debug(`[RateLimiter] Esperando ${waitTime}ms antes de siguiente petición`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Ejecutar función con rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.wait();
    return fn();
  }

  /**
   * Resetear contador (después de error de LM Studio)
   */
  reset(): void {
    this.lastRequestTime = 0;
    logger.info(`[RateLimiter] Reset - contador de tiempo reiniciado`);
  }
}

// Instancia global
export const rateLimiter = new RateLimiter(0.5); // 1 petición cada 2 segundos
