import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  sessionCookieOptions,
  verifyPassword,
  verifySessionToken,
} from "./session";

const SECRET = "a".repeat(32);
const OTHER_SECRET = "b".repeat(32);

describe("session tokens", () => {
  const originalSecret = process.env.SESSION_SECRET;
  const originalPassword = process.env.ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.SESSION_SECRET = SECRET;
    process.env.ADMIN_PASSWORD = "hemmelig";
  });

  afterEach(() => {
    process.env.SESSION_SECRET = originalSecret;
    process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("verifies a freshly signed token", () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken();
    const [payload] = token.split(".");
    expect(verifySessionToken(`${payload}.not-the-signature`)).toBe(false);
  });

  it("rejects a token whose payload was changed", () => {
    const token = createSessionToken();
    const [, signature] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ exp: Date.now() + 60_000 }),
      "utf8",
    ).toString("base64url");
    expect(verifySessionToken(`${forged}.${signature}`)).toBe(false);
  });

  it("rejects an expired token", () => {
    const token = createSessionToken(Date.now() - 1);
    expect(verifySessionToken(token)).toBe(false);
  });

  it("accepts a token that expires in the future", () => {
    const token = createSessionToken(Date.now() + 60_000);
    expect(verifySessionToken(token)).toBe(true);
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken();
    process.env.SESSION_SECRET = OTHER_SECRET;
    expect(verifySessionToken(token)).toBe(false);
  });

  it("rejects malformed tokens", () => {
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("no-dot")).toBe(false);
    expect(verifySessionToken("a.b.c")).toBe(false);
  });

  it("refuses to sign when the secret is missing", () => {
    delete process.env.SESSION_SECRET;
    expect(() => createSessionToken()).toThrow(/SESSION_SECRET/);
  });

  it("refuses to sign when the secret is too short", () => {
    process.env.SESSION_SECRET = "short";
    expect(() => createSessionToken()).toThrow(/32 bytes/);
  });
});

describe("verifyPassword", () => {
  const originalPassword = process.env.ADMIN_PASSWORD;

  afterEach(() => {
    process.env.ADMIN_PASSWORD = originalPassword;
  });

  it("accepts the configured password", () => {
    process.env.ADMIN_PASSWORD = "hemmelig";
    expect(verifyPassword("hemmelig")).toBe(true);
  });

  it("rejects a wrong password", () => {
    process.env.ADMIN_PASSWORD = "hemmelig";
    expect(verifyPassword("feil")).toBe(false);
  });

  it("rejects any password when none is configured", () => {
    delete process.env.ADMIN_PASSWORD;
    expect(verifyPassword("hemmelig")).toBe(false);
  });
});

describe("sessionCookieOptions", () => {
  it("scopes the cookie to /admin with a 7-day lifetime", () => {
    const options = sessionCookieOptions();
    expect(SESSION_COOKIE_NAME).toBe("ct_admin_session");
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/admin");
    expect(options.maxAge).toBe(SESSION_MAX_AGE_SECONDS);
    expect(SESSION_MAX_AGE_SECONDS).toBe(7 * 24 * 60 * 60);
    expect(options.secure).toBe(process.env.NODE_ENV === "production");
  });
});
