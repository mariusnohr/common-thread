"use client";

import { useActionState } from "react";
import { setStatusAction } from "@/app/admin/actions";
import { EMPTY_FORM_STATE } from "@/app/admin/form-state";
import type { PuzzleStatus } from "@/lib/puzzle/types";

type StatusFormProps = {
  id: number;
  status: PuzzleStatus;
};

export function StatusForm({ id, status }: StatusFormProps) {
  const [state, formAction, pending] = useActionState(
    setStatusAction,
    EMPTY_FORM_STATE,
  );

  const nextStatus: PuzzleStatus = status === "approved" ? "draft" : "approved";
  const label = status === "approved" ? "Skjul" : "Godkjenn";

  return (
    <form action={formAction} className="inline-form">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={nextStatus} />
      <button type="submit" disabled={pending}>
        {label}
      </button>
      {state.formError && <span className="error">{state.formError}</span>}
    </form>
  );
}
