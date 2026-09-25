import { existsSync } from "node:fs";
import path from "node:path";

// `next dev` loads .env.local automatically, but Vitest does not. Load it here
// (before any test module imports `db/client`) so the documented development
// setup actually runs the database-backed suites. Variables already present in
// the environment take precedence, so an explicitly supplied TEST_DATABASE_URL
// is preserved.
const envFile = path.join(process.cwd(), ".env.local");
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

// Database-backed suites talk to a dedicated test database. Point the shared
// application client at it before any test module imports `db/client`.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
