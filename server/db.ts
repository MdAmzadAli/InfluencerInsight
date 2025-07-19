import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

export const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  errorFormat: 'minimal',
});

export async function checkDatabaseHealth() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([
      db.$queryRaw`SELECT NOW()`,
      timeoutPromise
    ]);
    
    console.log('Database connected successfully');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't log full error details to reduce console noise
    return false;
  }
}

// Add connection recovery function
export async function reconnectDatabase() {
  try {
    await db.$disconnect();
    await db.$connect();
    console.log('Database reconnected successfully');
    return true;
  } catch (error) {
    console.error('Database reconnection failed:', error);
    return false;
  }
}