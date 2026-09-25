"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { EMPTY_LOGIN_STATE } from "@/app/admin/form-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, EMPTY_LOGIN_STATE);

  return (
    <form action={formAction} className="admin-form login-form">
      <label htmlFor="password">Passord</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={pending}>
        Logg inn
      </button>
    </form>
  );
}
