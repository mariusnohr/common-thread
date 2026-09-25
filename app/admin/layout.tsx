import { cookies } from "next/headers";
import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "./actions";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await cookies();
  const isSignedIn = verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value);

  return (
    <main className="shell admin">
      <header className="header admin-header">
        <div>
          <h1>
            <Link href="/admin">Admin</Link>
          </h1>
          <p className="date">Common Thread</p>
        </div>
        {isSignedIn && (
          <form action={logout}>
            <button type="submit">Logg ut</button>
          </form>
        )}
      </header>
      {children}
    </main>
  );
}
