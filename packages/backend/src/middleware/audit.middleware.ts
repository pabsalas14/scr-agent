/**
 * ============================================================================
 * AUDIT MIDDLEWARE - Trazabilidad automática de acciones
 * ============================================================================
 *
 * Middleware que registra automáticamente acciones auditadas
 * Se aplica a endpoints específicos que modifiquen datos
 */

import { Request, Response, NextFunction } from 'express';
import { logAuditEvent } from '../services/audit.service';
import { logger } from '../services/logger.service';

// Rutas y métodos que deben ser auditados
const AUDITED_ROUTES = [
  // Análisis
  { pattern: /^\/api\/v1\/analyses\/?$/, method: 'POST', action: 'create', resourceType: 'analysis' },
  { pattern: /^\/api\/v1\/analyses\/[^/]+\/cancel\/?$/, method: 'PATCH', action: 'cancel', resourceType: 'analysis' },
  { pattern: /^\/api\/v1\/analyses\/[^/]+\/retry\/?$/, method: 'POST', action: 'retry', resourceType: 'analysis' },

  // Proyectos
  { pattern: /^\/api\/v1\/projects\/?$/, method: 'POST', action: 'create', resourceType: 'project' },
  { pattern: /^\/api\/v1\/projects\/[^/]+\/?$/, method: 'PUT', action: 'update', resourceType: 'project' },
  { pattern: /^\/api\/v1\/projects\/[^/]+\/?$/, method: 'DELETE', action: 'delete', resourceType: 'project' },

  // Hallazgos
  { pattern: /^\/api\/v1\/findings\/[^/]+\/?$/, method: 'PATCH', action: 'update', resourceType: 'finding' },
  { pattern: /^\/api\/v1\/findings\/[^/]+\/?$/, method: 'DELETE', action: 'delete', resourceType: 'finding' },
];

/**
 * Middleware de auditoría
 * Registra acciones basadas en método HTTP y ruta
 */
export function auditMiddleware(req: Request, _res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  const ipAddress = req.ip || req.socket?.remoteAddress;
  const userAgent = req.get('User-Agent');
  const method = req.method;
  const path = req.path;

  // No auditar si no hay usuario (aunque debería haber por middleware de auth)
  if (!userId) {
    return next();
  }

  // Buscar si esta ruta debe ser auditada
  const auditRule = AUDITED_ROUTES.find(
    rule => rule.pattern.test(path) && rule.method === method
  );

  if (!auditRule) {
    return next();
  }

  // Extractar resourceId de la URL
  let resourceId: string | undefined;
  const match = path.match(/^\/api\/v1\/\w+\/([^/]+)/);
  if (match) {
    resourceId = match[1];
  }

  // Preparar detalles de la acción
  const details = {
    method,
    path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    body: Object.keys(req.body || {}).length > 0 ? sanitizeBody(req.body) : undefined,
  };

  // Registrar en background (no bloquear request)
  logAuditEvent({
    userId,
    action: auditRule.action,
    resourceType: auditRule.resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
  }).catch(err => {
    logger.warn(`Failed to log audit event: ${err}`);
  });

  next();
}

/**
 * Sanitizar body para no guardar datos sensibles
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'githubToken',
    'anthropicApiKey',
  ];

  const sanitized = { ...body };

  for (const key of sensitiveFields) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Middleware de auditoría manual para acciones complejas
 * Usar cuando automaticMiddleware no es suficiente
 */
export function createManualAuditLog(
  action: string,
  resourceType: string,
  resourceId?: string
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return next();
    }

    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.get('User-Agent');

    logAuditEvent({
      userId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      details: { timestamp: new Date().toISOString() },
    }).catch(err => {
      logger.warn(`Failed to log manual audit event: ${err}`);
    });

    next();
  };
}
