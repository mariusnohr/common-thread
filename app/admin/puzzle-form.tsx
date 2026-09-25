"use client";

import Link from "next/link";
import { useActionState } from "react";
import { savePuzzleAction } from "@/app/admin/actions";
import { EMPTY_FORM_STATE, type FormState } from "@/app/admin/form-state";
import { todayInOslo } from "@/lib/puzzle/oslo";
import type { AdminPuzzle, PuzzleStatus } from "@/lib/puzzle/types";

type PuzzleFormProps = {
  puzzle?: AdminPuzzle;
};

type EditableGroup = {
  difficulty: number;
  name: string;
  words: string[];
};

function emptyGroups(): EditableGroup[] {
  return [1, 2, 3, 4].map((difficulty) => ({
    difficulty,
    name: "",
    words: ["", "", "", ""],
  }));
}

function FieldError({ state, name }: { state: FormState; name: string }) {
  const message = state.fieldErrors[name];
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}

export function PuzzleForm({ puzzle }: PuzzleFormProps) {
  const [state, formAction, pending] = useActionState(
    savePuzzleAction,
    EMPTY_FORM_STATE,
  );

  const groups: EditableGroup[] = puzzle
    ? [...puzzle.groups]
        .sort((a, b) => a.difficulty - b.difficulty)
        .map((group) => ({
          difficulty: group.difficulty,
          name: group.name,
          words: [...group.words],
        }))
    : emptyGroups();

  return (
    <form action={formAction} className="admin-form puzzle-form">
      {puzzle && <input type="hidden" name="id" value={puzzle.id} />}

      <div className="row">
        <div className="field">
          <label htmlFor="publishDate">Dato</label>
          <input
            id="publishDate"
            name="publishDate"
            type="date"
            defaultValue={puzzle?.publishDate ?? todayInOslo()}
            required
          />
          <FieldError state={state} name="publishDate" />
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={puzzle?.status ?? ("draft" satisfies PuzzleStatus)}
          >
            <option value="suggested">Foreslått</option>
            <option value="draft">Utkast</option>
            <option value="approved">Godkjent</option>
          </select>
          <FieldError state={state} name="status" />
        </div>
      </div>

      <FieldError state={state} name="groups" />

      {groups.map((group, groupIndex) => (
        <fieldset key={group.difficulty} className="group-fieldset">
          <legend>Gruppe {group.difficulty}</legend>

          <div className="field">
            <label htmlFor={`groups.${groupIndex}.name`}>Navn</label>
            <input
              id={`groups.${groupIndex}.name`}
              name={`groups.${groupIndex}.name`}
              type="text"
              defaultValue={group.name}
              required
            />
            <FieldError state={state} name={`groups.${groupIndex}.name`} />
          </div>

          <div className="words-grid">
            {group.words.map((word, wordIndex) => (
              <div className="field" key={wordIndex}>
                <label htmlFor={`groups.${groupIndex}.words.${wordIndex}`}>
                  Ord {wordIndex + 1}
                </label>
                <input
                  id={`groups.${groupIndex}.words.${wordIndex}`}
                  name={`groups.${groupIndex}.words.${wordIndex}`}
                  type="text"
                  defaultValue={word}
                  required
                />
                <FieldError
                  state={state}
                  name={`groups.${groupIndex}.words.${wordIndex}`}
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      {state.formError && <p className="error">{state.formError}</p>}

      <div className="form-buttons">
        <button type="submit" disabled={pending}>
          {puzzle ? "Lagre endringer" : "Opprett oppgave"}
        </button>
        <Link className="button secondary" href="/admin">
          Avbryt
        </Link>
      </div>
    </form>
  );
}
