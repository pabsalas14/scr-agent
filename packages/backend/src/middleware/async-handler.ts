import { type Request, type Response, type NextFunction, type RequestHandler } from 'express';

/**
 * Wraps async route handlers to forward errors to Express error middleware.
 * Eliminates repetitive try/catch blocks in every route.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
