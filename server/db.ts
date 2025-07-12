import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

export const db = new PrismaClient();

export async function checkDatabaseHealth() {
  try {
    await db.$queryRaw`SELECT NOW()`;
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}