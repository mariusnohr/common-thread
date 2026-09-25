import { assertSessionSecret } from "@/lib/auth/secret";

/**
 * Next.js calls `register` once while booting the server, before it serves any
 * request (and skips it during `next build`). Validating the session secret
 * here means a missing or too-short `SESSION_SECRET` refuses startup instead of
 * leaving admin login silently broken.
 *
 * `@/lib/auth/secret` is edge-safe (no `node:crypto`), so this file can be
 * bundled for both the Node.js and Edge instrumentation runtimes.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  assertSessionSecret();
}
