import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client";

/**
 * Applies the committed SQL migrations in `db/migrations`. Safe to run on
 * every deploy: already-applied migrations are skipped, and an empty
 * database is brought fully up to date.
 */
async function main(): Promise<void> {
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), "db", "migrations"),
  });
  console.log("Migrations applied.");
  await pool.end();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
