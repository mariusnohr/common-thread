import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { puzzleGroups, puzzles } from "@/db/schema";
import { puzzleSchema } from "./schema";
import type { PuzzleStatus } from "./types";

export type SavePuzzleInput = {
  /** When set the puzzle is updated in place; otherwise a new row is created. */
  id?: number;
  publishDate: string;
  status: PuzzleStatus;
  groups: PuzzleGroupInput[];
};

/**
 * A group on its way into the database. `difficulty` is a plain number here
 * because `puzzleSchema` validates it to 1-4; the typed `PuzzleGroupData`
 * (difficulty `1 | 2 | 3 | 4`) is assignable to this.
 */
export type PuzzleGroupInput = {
  difficulty: number;
  name: string;
  words: string[];
};

export type PuzzleMutationResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const STATUSES: readonly PuzzleStatus[] = ["suggested", "draft", "approved"];

/**
 * Postgres unique-violation SQLSTATE, e.g. two puzzles on the same day.
 * Drizzle wraps driver errors, so walk the `cause` chain looking for it.
 */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== undefined; depth += 1) {
    if (
      typeof current === "object" &&
      current !== null &&
      (current as { code?: unknown }).code === "23505"
    ) {
      return true;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** True for a real `YYYY-MM-DD` calendar date. */
export function isValidPublishDate(value: string): boolean {
  return isValidDate(value);
}

/**
 * Creates or updates a puzzle and replaces its groups in a single
 * transaction. Validation runs before any write, so an invalid puzzle leaves
 * the database untouched. A `publish_date` collision (including moving an
 * existing puzzle onto an occupied date) is reported as a readable error
 * rather than a raw unique-violation.
 */
export async function savePuzzle(
  input: SavePuzzleInput,
): Promise<PuzzleMutationResult> {
  if (!isValidDate(input.publishDate)) {
    return { ok: false, error: "Datoen må være på formen ÅÅÅÅ-MM-DD." };
  }

  if (!STATUSES.includes(input.status)) {
    return { ok: false, error: "Ugyldig status." };
  }

  const parsed = puzzleSchema.safeParse({ groups: input.groups });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Oppgaven er ugyldig.",
    };
  }

  const groups = parsed.data.groups;

  try {
    const id = await db.transaction(async (tx) => {
      let puzzleId = input.id;

      if (puzzleId !== undefined) {
        const [updated] = await tx
          .update(puzzles)
          .set({ publishDate: input.publishDate, status: input.status })
          .where(eq(puzzles.id, puzzleId))
          .returning({ id: puzzles.id });

        if (!updated) throw new Error("PuzzleNotFound");

        await tx
          .delete(puzzleGroups)
          .where(eq(puzzleGroups.puzzleId, puzzleId));
      } else {
        const [inserted] = await tx
          .insert(puzzles)
          .values({ publishDate: input.publishDate, status: input.status })
          .returning({ id: puzzles.id });
        puzzleId = inserted.id;
      }

      await tx.insert(puzzleGroups).values(
        groups.map((group) => ({
          puzzleId: puzzleId as number,
          difficulty: group.difficulty,
          name: group.name,
          words: group.words,
        })),
      );

      return puzzleId;
    });

    return { ok: true, id };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        error: "Det finnes allerede en oppgave på denne datoen.",
      };
    }
    if (error instanceof Error && error.message === "PuzzleNotFound") {
      return { ok: false, error: "Fant ikke oppgaven." };
    }
    throw error;
  }
}

/** Changes only a puzzle's status, leaving its date and groups in place. */
export async function setPuzzleStatus(
  id: number,
  status: PuzzleStatus,
): Promise<PuzzleMutationResult> {
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Ugyldig oppgave." };
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, error: "Ugyldig status." };
  }

  const [row] = await db
    .update(puzzles)
    .set({ status })
    .where(eq(puzzles.id, id))
    .returning({ id: puzzles.id });

  if (!row) return { ok: false, error: "Fant ikke oppgaven." };

  return { ok: true, id: row.id };
}
