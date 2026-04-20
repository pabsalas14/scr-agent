/**
 * ============================================================================
 * LM STUDIO HEALTH CHECK SERVICE - Monitorear estado de LM Studio
 * ============================================================================
 *
 * Verifica periódicamente que LM Studio está sano
 * Detecta problemas temprano antes de enviar análisis
 */

import axios from 'axios';
import { logger } from './logger.service';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

interface HealthCheckResult {
  status: HealthStatus;
  latency: number; // ms
  lastCheck: Date;
  message: string;
}

export class LMStudioHealthChecker {
  private baseUrl: string;
  private lastResult: HealthCheckResult | null = null;
  private checkInterval: number = 30000; // cada 30 segundos
  private isMonitoring = false;

  constructor(baseUrl: string = 'http://localhost:1234/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Hacer health check a LM Studio
   */
  async check(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Endpoint simple para verificar que responde
      const response = await axios.get(`${this.baseUrl}/models`, {
        timeout: 5000, // 5 segundos max
      });

      const latency = Date.now() - startTime;

      let status: HealthStatus = 'HEALTHY';
      let message = '✅ LM Studio sano';

      if (latency > 3000) {
        status = 'DEGRADED';
        message = '⚠️ LM Studio lento';
      }

      const result: HealthCheckResult = {
        status,
        latency,
        lastCheck: new Date(),
        message,
      };

      this.lastResult = result;
      logger.debug(`[LMStudioHealth] ${message} (latency: ${latency}ms)`);

      return result;
    } catch (error) {
      const latency = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      const result: HealthCheckResult = {
        status: 'UNHEALTHY',
        latency,
        lastCheck: new Date(),
        message: `❌ LM Studio no responde: ${message}`,
      };

      this.lastResult = result;
      logger.error(`[LMStudioHealth] ${result.message}`);

      return result;
    }
  }

  /**
   * Iniciar monitoreo continuo
   */
  startMonitoring(): void {
    if (this.isMonitoring) {
      logger.warn(`[LMStudioHealth] Monitoreo ya está activo`);
      return;
    }

    this.isMonitoring = true;
    logger.info(`[LMStudioHealth] Iniciando monitoreo cada ${this.checkInterval}ms`);

    setInterval(() => {
      this.check().catch(err => logger.error(`[LMStudioHealth] Error en check: ${err}`));
    }, this.checkInterval);

    // Hacer check inicial
    this.check().catch(err => logger.error(`[LMStudioHealth] Error en check inicial: ${err}`));
  }

  /**
   * Detener monitoreo
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    logger.info(`[LMStudioHealth] Monitoreo detenido`);
  }

  /**
   * Obtener último resultado
   */
  getLastResult(): HealthCheckResult | null {
    return this.lastResult;
  }

  /**
   * Verificar si LM Studio está sano
   */
  isHealthy(): boolean {
    if (!this.lastResult) {
      return false;
    }

    // Considerar "sano" si el último check fue hace menos de 1 minuto Y status no es UNHEALTHY
    const timeSinceCheck = Date.now() - this.lastResult.lastCheck.getTime();
    const checkStale = timeSinceCheck > 60000; // 1 minuto

    if (checkStale) {
      logger.warn(`[LMStudioHealth] Último check hace ${timeSinceCheck}ms - considerando no sano`);
      return false;
    }

    return this.lastResult.status !== 'UNHEALTHY';
  }

  /**
   * Obtener estimación de timeout basado en latencia
   */
  getAdaptiveTimeout(): number {
    if (!this.lastResult) {
      return 10 * 60 * 1000; // 10 minutos por defecto
    }

    const { latency, status } = this.lastResult;

    if (status === 'UNHEALTHY') {
      return 15 * 60 * 1000; // 15 minutos si está degradado
    }

    if (status === 'DEGRADED') {
      return 12 * 60 * 1000; // 12 minutos si está lento
    }

    // HEALTHY - variar según latencia actual
    // Note: qwen2.5-coder-7b-instruct needs significant time for code analysis
    if (latency > 5000) {
      return 20 * 60 * 1000; // 20 minutos si latencia alta
    }

    if (latency > 2000) {
      return 18 * 60 * 1000; // 18 minutos si latencia media
    }

    return 15 * 60 * 1000; // 15 minutos si está rápido
  }
}

// Instancia global
export const lmStudioHealthChecker = new LMStudioHealthChecker();
