import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from '@shared/schema';

// Create a custom PostgreSQL connection using Neon serverless
const createCustomPool = () => {
  neonConfig.webSocketConstructor = ws;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set");
  }

  return new Pool({ connectionString });
};

export const customPool = createCustomPool();
export const customDb = drizzle({ client: customPool, schema });

// Database health check
export const checkDatabaseHealth = async () => {
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