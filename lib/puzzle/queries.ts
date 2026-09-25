import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { puzzleGroups, puzzles } from "@/db/schema";
import type { PublicGroup, PuzzleForDate } from "./types";

async function loadGroups(puzzleId: number): Promise<PublicGroup[]> {
  const rows = await db
    .select({
      difficulty: puzzleGroups.difficulty,
      name: puzzleGroups.name,
      words: puzzleGroups.words,
    })
    .from(puzzleGroups)
    .where(eq(puzzleGroups.puzzleId, puzzleId))
    .orderBy(asc(puzzleGroups.difficulty));

  return rows.map((row) => ({
    difficulty: row.difficulty,
    name: row.name,
    words: row.words,
  }));
}

function toPuzzle(row: {
  id: number;
  publishDate: string;
}, groups: PublicGroup[]): PuzzleForDate {
  return {
    id: row.id,
    publishDate: row.publishDate,
    words: groups.flatMap((group) => group.words),
    groups,
  };
}

/** The approved puzzle published on `date`, or `null` if there is none. */
export async function getPuzzleForDate(date: string): Promise<PuzzleForDate | null> {
  const [row] = await db
    .select({ id: puzzles.id, publishDate: puzzles.publishDate })
    .from(puzzles)
    .where(
      and(eq(puzzles.publishDate, date), eq(puzzles.status, "approved")),
    )
    .limit(1);

  if (!row) return null;

  const groups = await loadGroups(row.id);
  return toPuzzle(row, groups);
}

/**
 * An approved puzzle that is today's or older. Future puzzles (and anything
 * not approved) are not playable.
 */
export async function getPlayablePuzzle(
  puzzleId: number,
  today: string,
): Promise<PuzzleForDate | null> {
  const [row] = await db
    .select({
      id: puzzles.id,
      publishDate: puzzles.publishDate,
      status: puzzles.status,
    })
    .from(puzzles)
    .where(eq(puzzles.id, puzzleId))
    .limit(1);

  if (!row || row.status !== "approved") return null;
  if (row.publishDate > today) return null;

  const groups = await loadGroups(row.id);
  return toPuzzle(row, groups);
}
