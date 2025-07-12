import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

export async function checkDatabaseHealth() {
  try {
    const result = await db.execute('SELECT NOW()');
    console.log('Database connected successfully at:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}