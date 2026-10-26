import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 * Re-using a single instance across the application avoids
 * exhausting the connection pool during hot-reloads in development.
 */

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
