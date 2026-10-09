import { Pool } from 'pg';

// One shared connection pool per server process (kept across dev hot reloads).
const g = globalThis as unknown as { __shopPool?: Pool };

export function hasDb(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  if (!g.__shopPool) {
    g.__shopPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return g.__shopPool;
}
