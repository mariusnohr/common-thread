import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects every `/admin` route except the login page. This file runs on the
 * Edge runtime, so it verifies the session cookie with Web Crypto instead of
 * `node:crypto`. The token format must stay in sync with
 * `lib/auth/session.ts`: `<base64url(payload)>.<base64url(HMAC-SHA256)>`.
 */

const SESSION_COOKIE_NAME = "ct_admin_session";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function hasValidSession(token: string | undefined): Promise<boolean> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || new TextEncoder().encode(secret).length < 32) return false;
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      new TextEncoder().encode(payload),
    );
    if (!valid) return false;

    const data = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payload)),
    ) as { exp?: unknown };
    return typeof data.exp === "number" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (await hasValidSession(token)) return NextResponse.next();

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
