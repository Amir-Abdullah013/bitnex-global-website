// Dynamic Prisma import to avoid build-time issues
let prisma;

/**
 * Get Prisma client dynamically
 */
export async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Add connection pooling configuration
      __internal: {
        engine: {
          binaryTargets: ['native']
        }
      }
    });
  }
  return prisma;
}

// Legacy export for backward compatibility
export const prisma = {
  get: getPrisma
};

export default getPrisma;










