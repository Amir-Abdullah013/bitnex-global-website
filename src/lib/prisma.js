import { PrismaClient } from '@prisma/client';

// Singleton Prisma client to prevent connection conflicts
let prismaClient;

/**
 * Get singleton Prisma client
 */
export function getPrisma() {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      errorFormat: 'pretty',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }
  return prismaClient;
}

// Export singleton instance
export const prisma = getPrisma();

export default getPrisma;










