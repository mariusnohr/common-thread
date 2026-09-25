import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Database-backed suites migrate a shared test database, so run files
    // one at a time to keep migrations and truncations from racing.
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
