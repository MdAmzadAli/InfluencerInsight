import { PrismaClient } from '@prisma/client';

// Use SQLite as fallback when PostgreSQL is not available
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

export const db = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function checkDatabaseHealth() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    await Promise.race([
      db.$queryRaw`SELECT NOW()`,
      timeoutPromise
    ]);
    
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}