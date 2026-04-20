/**
 * ============================================================================
 * CIRCUIT BREAKER SERVICE - Detectar y manejar fallos de LM Studio
 * ============================================================================
 *
 * Estados:
 * - CLOSED: funciona normal ✅
 * - OPEN: LM Studio muerto, rechazar peticiones 🔴
 * - HALF_OPEN: probando si se recuperó ⚠️
 */

import { logger } from './logger.service';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number; // fallos consecutivos antes de abrir (default: 3)
  successThreshold: number; // éxitos en HALF_OPEN antes de cerrar (default: 2)
  timeout: number; // ms antes de pasar de OPEN a HALF_OPEN (default: 30s)
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 3,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 30000, // 30 segundos
    };
    logger.info(`[CircuitBreaker] Inicializado - umbral de fallos: ${this.config.failureThreshold}, timeout: ${this.config.timeout}ms`);
  }

  /**
   * Registrar éxito
   */
  recordSuccess(): void {
    if (this.state === 'OPEN') {
      logger.warn(`[CircuitBreaker] ⚠️ Éxito en estado OPEN (debería ser HALF_OPEN)`);
      return;
    }

    if (this.state === 'CLOSED') {
      this.failureCount = 0;
      logger.debug(`[CircuitBreaker] ✅ Éxito - resetear contador de fallos`);
      return;
    }

    // HALF_OPEN
    this.successCount++;
    logger.info(`[CircuitBreaker] ⚠️ HALF_OPEN: Éxito ${this.successCount}/${this.config.successThreshold}`);

    if (this.successCount >= this.config.successThreshold) {
      this.close();
    }
  }

  /**
   * Registrar fallo
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED') {
      logger.warn(`[CircuitBreaker] ❌ Fallo ${this.failureCount}/${this.config.failureThreshold}`);

      if (this.failureCount >= this.config.failureThreshold) {
        this.open();
      }
    } else if (this.state === 'HALF_OPEN') {
      logger.error(`[CircuitBreaker] ❌ Fallo en HALF_OPEN - volver a OPEN`);
      this.open();
    }
  }

  /**
   * Abrir circuito (LM Studio está muerto)
   */
  private open(): void {
    this.state = 'OPEN';
    this.successCount = 0;
    logger.error(`[CircuitBreaker] 🔴 CIRCUIT ABIERTO - LM Studio rechazado durante ${this.config.timeout}ms`);
  }

  /**
   * Cerrar circuito (LM Studio está bien)
   */
  private close(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    logger.info(`[CircuitBreaker] 🟢 CIRCUIT CERRADO - LM Studio recuperado`);
  }

  /**
   * Pasar a HALF_OPEN si timeout expiró
   */
  private tryHalfOpen(): void {
    if (this.state === 'OPEN') {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      if (timeSinceFailure >= this.config.timeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        logger.warn(`[CircuitBreaker] ⚠️ HALF_OPEN - probando si LM Studio se recuperó...`);
      }
    }
  }

  /**
   * Verificar si es seguro enviar petición
   */
  canExecute(): boolean {
    this.tryHalfOpen();

    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'HALF_OPEN') {
      logger.debug(`[CircuitBreaker] ⚠️ Permitiendo petición en HALF_OPEN (prueba)`);
      return true;
    }

    // OPEN
    logger.warn(`[CircuitBreaker] 🔴 Petición rechazada - circuito abierto`);
    return false;
  }

  /**
   * Obtener estado actual
   */
  getState(): CircuitBreakerState {
    this.tryHalfOpen();
    return this.state;
  }

  /**
   * Resetear circuito manualmente
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    logger.info(`[CircuitBreaker] Reset manual - estado a CLOSED`);
  }
}

// Instancia global
export const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 30000, // 30 segundos antes de intentar recuperar
});
