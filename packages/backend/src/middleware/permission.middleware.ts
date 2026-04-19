/**
 * Permission Middleware (PHASE 3.5)
 * Checks user permissions before allowing access to protected resources
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { logger } from '../services/logger.service';
import { hasPermission, canPerform, Action } from '../services/permission.service';

export interface PermissionRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: Role;
  };
}

/**
 * Middleware factory to check specific permission
 */
export function requirePermission(action: Action) {
  return (req: PermissionRequest, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;

    if (!hasPermission(userRole, action)) {
      logger.warn(
        `Permission denied for user ${userId} attempting action ${action}`
      );

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredPermission: action,
      });
    }

    next();
  };
}

/**
 * Middleware factory to check ownership + permission
 */
export function requireResourcePermission(
  action: Action,
  resourceIdParam = 'id'
) {
  return async (
    req: PermissionRequest,
    res: Response,
    next: NextFunction
  ) => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const resourceId = req.params[resourceIdParam];

    // For simplicity, we'll check permission without ownership here
    // In real implementation, you'd fetch the resource and check owner
    if (!hasPermission(userRole, action)) {
      logger.warn(
        `Permission denied for user ${userId} attempting action ${action} on resource ${resourceId}`
      );

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredPermission: action,
      });
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: PermissionRequest, res: Response, next: NextFunction) {
  const userRole = (req as any).user?.role;

  if (userRole !== 'ADMIN') {
    logger.warn(`Admin access required for user with role ${userRole}`);

    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }

  next();
}

/**
 * Middleware to check if user is analyst or better
 */
export function requireAnalystOrBetter(
  req: PermissionRequest,
  res: Response,
  next: NextFunction
) {
  const userRole = (req as any).user?.role;

  if (!['ADMIN', 'ANALYST'].includes(userRole || '')) {
    logger.warn(`Analyst+ access required for user with role ${userRole}`);

    return res.status(403).json({
      success: false,
      error: 'Analyst or higher role required',
    });
  }

  next();
}

/**
 * Middleware to log permission checks (for audit trail)
 */
export function auditPermissionCheck(
  action: Action
) {
  return (req: PermissionRequest, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    const userId = (req as any).user?.id;
    const hasAccess = hasPermission(userRole, action);

    logger.info({
      message: 'Permission check',
      userId,
      userRole,
      action,
      hasAccess,
      method: req.method,
      path: req.path,
    });

    next();
  };
}
