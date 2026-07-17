import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/thepokersignup',
});

export const db = drizzle(pool);

console.log('✅ Database connected - thepokersignup');
