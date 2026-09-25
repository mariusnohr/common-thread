/**
 * Validates `SESSION_SECRET` without importing `node:crypto`, so this module is
 * safe to pull into the Edge-runtime instrumentation bundle. The byte length is
 * measured with `TextEncoder`, which equals `Buffer.byteLength(secret, "utf8")`.
 *
 * The app refuses to sign or verify sessions without a secret of at least 32
 * bytes. `instrumentation.ts` calls this at server startup so an invalid
 * configuration stops the server before it serves any request.
 */
export function assertSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  if (new TextEncoder().encode(secret).length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 bytes");
  }
  return secret;
}
