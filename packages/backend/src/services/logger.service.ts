/**
 * ============================================================================
 * SERVICIO DE LOGGING
 * ============================================================================
 *
 * Servicio centralizado de logging usando Winston
 * Proporciona métodos para registrar eventos en diferentes niveles
 *
 * Uso:
 * - logger.info('Mensaje informativo')
 * - logger.error('Error crítico', { contexto })
 * - logger.warn('Advertencia')
 * - logger.debug('Información de debug')
 */

import winston from 'winston';

/**
 * Crear instancia de logger configurada
 */
export function createLogger(): winston.Logger {
  return winston.createLogger({
    level: process.env['LOG_LEVEL'] || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'scr-agent-backend' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const msg = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${msg || ''} ${metaStr}`;
          })
        ),
      }),
    ],
  });
}

// Singleton exportado
export const logger = createLogger();

/**
 * Tipo de eventos auditables
 * Se registran automáticamente en logs para compliance
 */
export enum AuditEventType {
  // Análisis
  ANALYSIS_STARTED = 'ANALYSIS_STARTED',
  ANALYSIS_COMPLETED = 'ANALYSIS_COMPLETED',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',

  // Agentes
  INSPECTOR_EXECUTION = 'INSPECTOR_EXECUTION',
  DETECTIVE_EXECUTION = 'DETECTIVE_EXECUTION',
  FISCAL_EXECUTION = 'FISCAL_EXECUTION',

  // Reportes
  REPORT_GENERATED = 'REPORT_GENERATED',
  REPORT_EXPORTED = 'REPORT_EXPORTED',

  // Seguridad
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INVALID_INPUT = 'INVALID_INPUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Base de datos
  DB_OPERATION = 'DB_OPERATION',
  DB_ERROR = 'DB_ERROR',
}

/**
 * Registrar evento auditable
 * Siempre incluir tipo, timestamp y contexto mínimo
 */
export function auditLog(
  eventType: AuditEventType,
  message: string,
  metadata?: Record<string, any>
): void {
  logger.info({
    event: eventType,
    message,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Registrar error auditables
 */
export function auditError(
  eventType: AuditEventType,
  error: Error | string,
  metadata?: Record<string, any>
): void {
  logger.error({
    event: eventType,
    message: error instanceof Error ? error.message : error,
    ...(error instanceof Error && { stack: error.stack }),
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}
