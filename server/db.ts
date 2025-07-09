import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Database health check
export const checkDatabaseHealth = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('Database URL not set - DATABASE_URL not configured');
    return false;
  }
  
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT NOW()`;
    console.log('Database connected successfully at:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};