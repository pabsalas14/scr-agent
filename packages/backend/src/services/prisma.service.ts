import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __scr_prisma: PrismaClient | undefined;
}

/**
 * PrismaClient singleton.
 * Evita crear múltiples pools de conexión en dev (hot reload) y en módulos distintos.
 */
export const prisma: PrismaClient =
  globalThis.__scr_prisma ??
  new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['warn', 'error']
        : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.__scr_prisma = prisma;
}
