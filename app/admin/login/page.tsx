import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Logg inn · Common Thread",
};

export default function AdminLoginPage() {
  return (
    <section className="admin-panel">
      <h2>Logg inn</h2>
      <p className="muted">Kun for eieren av siden.</p>
      <LoginForm />
    </section>
  );
}
