import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections during hot reload
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Create a new PrismaClient if one doesn't exist or use the existing one
const prisma = globalForPrisma.prisma || new PrismaClient();

// In development, preserve the PrismaClient instance between hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma; 