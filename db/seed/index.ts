import { eq } from "drizzle-orm";
import { puzzleSchema, type PuzzleInput } from "../../lib/puzzle/schema";
import { db, pool } from "../client";
import { puzzleGroups, puzzles } from "../schema";
import { seedPuzzles } from "./puzzles";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/**
 * Inserts or refreshes one puzzle keyed by its `publish_date`, so running the
 * seed repeatedly never creates duplicates and picks up edited seed data.
 */
async function upsertPuzzle(publishDate: string, puzzle: PuzzleInput): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: puzzles.id })
      .from(puzzles)
      .where(eq(puzzles.publishDate, publishDate))
      .limit(1);

    let puzzleId: number;
    if (existing) {
      puzzleId = existing.id;
      await tx
        .update(puzzles)
        .set({ status: "approved" })
        .where(eq(puzzles.id, puzzleId));
      await tx.delete(puzzleGroups).where(eq(puzzleGroups.puzzleId, puzzleId));
    } else {
      const [inserted] = await tx
        .insert(puzzles)
        .values({ publishDate, status: "approved" })
        .returning({ id: puzzles.id });
      puzzleId = inserted.id;
    }

    await tx.insert(puzzleGroups).values(
      puzzle.groups.map((group) => ({
        puzzleId,
        difficulty: group.difficulty,
        name: group.name,
        words: group.words,
      })),
    );
  });
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
    `Seeded ${puzzlesToSeed.length} approved puzzles from ${puzzlesToSeed[0].publishDate} to ${puzzlesToSeed.at(-1)!.publishDate}.`,
  );
  await pool.end();
}

main().catch(async (error: unknown) => {
  console.error(error);
  await pool.end().catch(() => undefined);
  process.exit(1);
});
