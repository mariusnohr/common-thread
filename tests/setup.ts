// Database-backed suites talk to a dedicated test database. Point the shared
// application client at it before any test module imports `db/client`.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
