import { and, eq } from "drizzle-orm";
import { savePuzzle } from "../../lib/puzzle/mutations";
import { puzzleSchema, type PuzzleInput } from "../../lib/puzzle/schema";
import type { PuzzleLevel } from "../../lib/puzzle/types";
import { db, pool } from "../client";
import { puzzles } from "../schema";
import { seedPuzzles } from "./puzzles";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The seed puzzles are simple, so they fill the easy slot of each day. */
const SEED_LEVEL: PuzzleLevel = "easy";

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Inserts or refreshes one puzzle keyed by its `(publish_date, level)`, so
 * running the seed repeatedly never creates duplicates and picks up edited
 * seed data. The write itself goes through the same `savePuzzle` the admin
 * uses.
 */
async function upsertPuzzle(
  publishDate: string,
  puzzle: PuzzleInput,
): Promise<void> {
  const [existing] = await db
    .select({ id: puzzles.id })
    .from(puzzles)
    .where(
      and(eq(puzzles.publishDate, publishDate), eq(puzzles.level, SEED_LEVEL)),
    )
    .limit(1);

  const result = await savePuzzle({
    id: existing?.id,
    publishDate,
    level: SEED_LEVEL,
    status: "approved",
    groups: puzzle.groups,
  });

  if (!result.ok) {
    throw new Error(`Kunne ikke lagre oppgaven for ${publishDate}: ${result.error}`);
  }
}

async function main(): Promise<void> {
  const launchDate = process.env.LAUNCH_DATE;
  if (!launchDate || !DATE_PATTERN.test(launchDate)) {
    throw new Error("LAUNCH_DATE must be set to a YYYY-MM-DD date");
  }

  const puzzlesToSeed = seedPuzzles.map((puzzle, index) => ({
    publishDate: addDays(launchDate, index),
    puzzle: puzzleSchema.parse(puzzle),
  }));

  for (const { publishDate, puzzle } of puzzlesToSeed) {
    await upsertPuzzle(publishDate, puzzle);
  }

  console.log(
    `Seeded ${puzzlesToSeed.length} approved ${SEED_LEVEL} puzzles from ${puzzlesToSeed[0].publishDate} to ${puzzlesToSeed.at(-1)!.publishDate}.`,
  );
  await pool.end();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
