"use client";

import { useActionState } from "react";
import { generatePuzzleAction } from "@/app/admin/actions";
import { EMPTY_FORM_STATE, type FormState } from "@/app/admin/form-state";
import { LEVEL_LABELS, PUZZLE_LEVELS } from "@/lib/puzzle/levels";
import type { PuzzleLevel } from "@/lib/puzzle/types";

type AiStatus = { ok: true; label: string } | { ok: false; error: string };

function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state.fieldErrors[name];
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

type GenerateFormProps = {
  ai: AiStatus;
  defaultDate: string;
  defaultLevel: PuzzleLevel;
};

/** Generates a suggestion for an empty date and level. */
export function GenerateForm({ ai, defaultDate, defaultLevel }: GenerateFormProps) {
  const [state, formAction, pending] = useActionState(
    generatePuzzleAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={formAction} className="admin-form generate-form">
      <h2>Generer med AI</h2>
      <p className="muted">
        {ai.ok
          ? `Modell: ${ai.label}. Forslaget lagres som foreslått og vises ikke før du godkjenner det.`
          : ai.error}
      </p>

      <div className="row">
        <div className="field">
          <label htmlFor="generate-date">Dato</label>
          <input
            id="generate-date"
            name="publishDate"
            type="date"
            defaultValue={defaultDate}
            required
          />
          <FieldError state={state} name="publishDate" />
        </div>

        <div className="field">
          <label htmlFor="generate-level">Nivå</label>
          <select id="generate-level" name="level" defaultValue={defaultLevel}>
            {PUZZLE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
          <FieldError state={state} name="level" />
        </div>
      </div>

      {state.formError && <p className="error">{state.formError}</p>}

      <div className="form-buttons">
        <button type="submit" disabled={pending || !ai.ok}>
          {pending ? "Genererer …" : "Generer forslag"}
        </button>
        {pending && <span className="muted">Dette kan ta et par minutter.</span>}
      </div>
    </form>
  );
}

type RegenerateFormProps = {
  ai: AiStatus;
  puzzleId: number;
};

/** Replaces the groups of a puzzle that is not approved with a new suggestion. */
export function RegenerateForm({ ai, puzzleId }: RegenerateFormProps) {
  const [state, formAction, pending] = useActionState(
    generatePuzzleAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form
      action={formAction}
      className="regenerate-form"
      onSubmit={(event) => {
        if (!window.confirm("Erstatte gruppene med et nytt AI-forslag?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={puzzleId} />
      <div className="form-buttons">
        <button type="submit" className="secondary" disabled={pending || !ai.ok}>
          {pending ? "Genererer …" : "Generer nytt forslag"}
        </button>
        {pending && <span className="muted">Dette kan ta et par minutter.</span>}
        {!ai.ok && <span className="muted">{ai.error}</span>}
      </div>
      {state.formError && <p className="error">{state.formError}</p>}
    </form>
  );
}
