/**
 * Next.js calls `register` once while booting the server, before it serves any
 * request (and skips it during `next build`). Validating the session secret
 * here means a missing or too-short `SESSION_SECRET` refuses startup instead of
 * leaving admin login silently broken.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Imported dynamically so the Edge runtime never pulls in `node:crypto`.
  const { assertSessionSecret } = await import("@/lib/auth/session");
  assertSessionSecret();
}
