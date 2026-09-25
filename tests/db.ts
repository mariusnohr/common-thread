import path from "node:path";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "@/db/client";
import { puzzleGroups, puzzles } from "@/db/schema";
import type { PuzzleData } from "@/lib/puzzle/types";

let migrationPromise: Promise<void> | null = null;

export function hasTestDatabase(): boolean {
  return Boolean(process.env.TEST_DATABASE_URL);
}

/** Shifts an ISO `YYYY-MM-DD` date by a number of days. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** Migrates the test database once per test run. */
function migrateOnce(): Promise<void> {
  migrationPromise ??= migrate(db, {
    migrationsFolder: path.join(process.cwd(), "db", "migrations"),
  });
  return migrationPromise;
}

/** Empties the tables between tests. */
export async function truncateAll(): Promise<void> {
  await migrateOnce();
  await db.execute(
    sql`TRUNCATE TABLE "puzzle_groups", "puzzles" RESTART IDENTITY CASCADE`,
  );
}

export async function insertPuzzle(
  publishDate: string,
  puzzle: PuzzleData,
  status: "suggested" | "draft" | "approved" = "approved",
): Promise<number> {
  const [row] = await db
    .insert(puzzles)
    .values({ publishDate, status })
    .returning({ id: puzzles.id });

  await db.insert(puzzleGroups).values(
    puzzle.groups.map((group) => ({
      puzzleId: row.id,
      difficulty: group.difficulty,
      name: group.name,
      words: group.words,
    })),
  );

  return row.id;
}
