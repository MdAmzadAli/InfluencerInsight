import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from '@shared/schema';

// Create a custom PostgreSQL connection using Neon serverless
const createCustomPool = () => {
  neonConfig.webSocketConstructor = ws;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.warn("DATABASE_URL is not set. Database functionality will be disabled.");
    return null;
  }

  return new Pool({ connectionString });
};

const pool = createCustomPool();
export const customPool = pool;
export const customDb = pool ? drizzle({ client: pool, schema }) : null;

// Database health check
export const checkDatabaseHealth = async () => {
  if (!customPool) {
    console.log('Database pool not initialized - DATABASE_URL not set');
    return false;
  }
  
  try {
    const client = await customPool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Custom database connected successfully at:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Custom database connection failed:', error);
    return false;
  }
};