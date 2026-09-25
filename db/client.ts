import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * One shared connection pool for the whole process. Caching it on
 * `globalThis` keeps Next.js dev hot reloads from opening a new pool on every
 * module reload (which would leak connections). In production the process is
 * long-lived, so this behaves like a normal singleton.
 */
const globalForDb = globalThis as typeof globalThis & {
  __commonThreadPool?: Pool;
};

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Postgres runs on the same machine, so TLS is unnecessary.
    ssl: false,
    // Plenty for this traffic.
    max: 5,
  });
}

export const pool: Pool = globalForDb.__commonThreadPool ?? createPool();
globalForDb.__commonThreadPool = pool;

export const db = drizzle(pool, { schema });
