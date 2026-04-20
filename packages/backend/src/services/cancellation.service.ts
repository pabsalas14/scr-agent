/**
 * ============================================================================
 * CANCELLATION SERVICE - Manejo centralizado de cancelación de análisis
 * ============================================================================
 *
 * Mantiene un registro de AbortController por análisis para cancelar
 * peticiones a LM Studio cuando el usuario cancela un análisis.
 *
 * Problema: Cuando se cancela un análisis, el worker sigue enviando
 * peticiones a LM Studio. Esta solución aborta todas las peticiones en vuelo.
 */

import { logger } from './logger.service';

/**
 * Map global de AbortControllers por analysisId
 * analysisId → AbortController
 */
const cancellationControllers = new Map<string, AbortController>();

/**
 * Crear un AbortController para un análisis
 */
export function createCancellationToken(analysisId: string): AbortController {
  const controller = new AbortController();
  cancellationControllers.set(analysisId, controller);
  logger.info(`[Cancellation] Created token for analysis ${analysisId}`);
  return controller;
}

/**
 * Obtener el AbortController de un análisis
 */
export function getCancellationToken(analysisId: string): AbortController | undefined {
  return cancellationControllers.get(analysisId);
}

/**
 * Cancelar todas las peticiones de un análisis
 */
export function cancelAnalysisRequests(analysisId: string): void {
  const controller = cancellationControllers.get(analysisId);
  if (controller) {
    logger.info(`[Cancellation] Aborting all requests for analysis ${analysisId}`);
    controller.abort();
    cancellationControllers.delete(analysisId);
  } else {
    logger.warn(`[Cancellation] No cancellation token found for analysis ${analysisId}`);
  }
}

/**
 * Limpiar token cuando análisis completa o falla
 */
export function cleanupCancellationToken(analysisId: string): void {
  if (cancellationControllers.has(analysisId)) {
    cancellationControllers.delete(analysisId);
    logger.info(`[Cancellation] Cleaned up token for analysis ${analysisId}`);
  }
}

/**
 * Obtener estado de cancelación
 */
export function isAnalysisCancelled(analysisId: string): boolean {
  const controller = cancellationControllers.get(analysisId);
  return controller ? controller.signal.aborted : false;
}
