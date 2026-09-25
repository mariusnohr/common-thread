import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The admin session cookie is a signed, stateless token: a base64url-encoded
 * `{ exp }` payload plus an HMAC-SHA256 signature over that payload. Nothing
 * secret is stored in the browser, and the server can verify it without a
 * database lookup. The signature format is mirrored by `middleware.ts`, which
 * runs on the Edge runtime and therefore cannot use `node:crypto`.
 */
export const SESSION_COOKIE_NAME = "ct_admin_session";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type SessionPayload = {
  /** Unix epoch milliseconds after which the session is invalid. */
  exp: number;
};

/**
 * Reads and validates `SESSION_SECRET`. The app refuses to sign or verify
 * sessions without a secret of at least 32 bytes, rather than silently
 * accepting forgeable cookies. Also called from `instrumentation.ts` so an
 * invalid configuration stops the server before it serves any request.
 */
export function assertSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set");
  }
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("SESSION_SECRET must be at least 32 bytes");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", assertSessionSecret())
    .update(payload)
    .digest("base64url");
}

/** Creates a signed session token that expires at `exp` (default: in 7 days). */
export function createSessionToken(
  exp: number = Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
): string {
  const payload = Buffer.from(JSON.stringify({ exp }), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

/**
 * Returns `true` only for a correctly signed, unexpired token. A tampered
 * signature, a malformed token, or an expired `exp` all return `false`.
 */
export function verifySessionToken(
  token: string | undefined | null,
  now: number = Date.now(),
): boolean {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  const provided = Buffer.from(signature, "utf8");
  const computed = Buffer.from(expected, "utf8");
  if (
    provided.length !== computed.length ||
    !timingSafeEqual(provided, computed)
  ) {
    return false;
  }

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<SessionPayload>;
    return typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

/** Constant-time comparison of the submitted admin password. */
export function verifyPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;

  const provided = Buffer.from(password, "utf8");
  const actual = Buffer.from(expected, "utf8");
  if (provided.length !== actual.length) return false;

  return timingSafeEqual(provided, actual);
}

/** Cookie options for the admin session: scoped to `/admin` and HttpOnly. */
export function sessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
