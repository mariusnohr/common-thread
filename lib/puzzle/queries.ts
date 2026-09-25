import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { puzzleGroups, puzzles } from "@/db/schema";
import type {
  AdminPuzzle,
  PublicGroup,
  PuzzleForDate,
  PuzzleLevel,
} from "./types";

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
  level: PuzzleLevel;
}, groups: PublicGroup[]): PuzzleForDate {
  return {
    id: row.id,
    publishDate: row.publishDate,
    level: row.level,
    words: groups.flatMap((group) => group.words),
    groups,
  };
}

/**
 * The approved puzzle published on `date` at `level`, or `null` if there is
 * none.
 */
export async function getPuzzleForDate(
  date: string,
  level: PuzzleLevel,
): Promise<PuzzleForDate | null> {
  const [row] = await db
    .select({
      id: puzzles.id,
      publishDate: puzzles.publishDate,
      level: puzzles.level,
    })
    .from(puzzles)
    .where(
      and(
        eq(puzzles.publishDate, date),
        eq(puzzles.level, level),
        eq(puzzles.status, "approved"),
      ),
    )
    .limit(1);

  if (!row) return null;

  const groups = await loadGroups(row.id);
  return toPuzzle(row, groups);
}

/** The id of the puzzle (any status) in a `(date, level)` slot, if any. */
export async function findPuzzleId(
  date: string,
  level: PuzzleLevel,
): Promise<number | null> {
  const [row] = await db
    .select({ id: puzzles.id })
    .from(puzzles)
    .where(and(eq(puzzles.publishDate, date), eq(puzzles.level, level)))
    .limit(1);

  return row?.id ?? null;
}

/** The levels that have an approved puzzle on `date`, easiest first. */
export async function getApprovedLevelsForDate(
  date: string,
): Promise<PuzzleLevel[]> {
  const rows = await db
    .select({ level: puzzles.level })
    .from(puzzles)
    .where(and(eq(puzzles.publishDate, date), eq(puzzles.status, "approved")))
    // Postgres sorts enums in declaration order: easy, medium, hard.
    .orderBy(asc(puzzles.level));

  return rows.map((row) => row.level);
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
      level: puzzles.level,
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

/** A single puzzle with its status and groups, for the admin editor. */
export async function getPuzzleById(id: number): Promise<AdminPuzzle | null> {
  const [row] = await db
    .select({
      id: puzzles.id,
      publishDate: puzzles.publishDate,
      level: puzzles.level,
      status: puzzles.status,
    })
    .from(puzzles)
    .where(eq(puzzles.id, id))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    publishDate: row.publishDate,
    level: row.level,
    status: row.status,
    groups: await loadGroups(row.id),
  };
}

/** Every puzzle, newest first and easiest first within a day. */
export async function listPuzzles(): Promise<AdminPuzzle[]> {
  const rows = await db
    .select({
      id: puzzles.id,
      publishDate: puzzles.publishDate,
      level: puzzles.level,
      status: puzzles.status,
    })
    .from(puzzles)
    .orderBy(desc(puzzles.publishDate), asc(puzzles.level));

  const result: AdminPuzzle[] = [];
  for (const row of rows) {
    result.push({
      id: row.id,
      publishDate: row.publishDate,
      level: row.level,
      status: row.status,
      groups: await loadGroups(row.id),
    });
  }
  return result;
}

/**
 * Group names from the most recent puzzles (any status), newest first. Fed to
 * the generator so it avoids repeating themes. `excludeId` leaves out the
 * puzzle that is about to be regenerated.
 */
export async function listRecentGroupNames(
  puzzleLimit: number,
  excludeId?: number,
): Promise<string[]> {
  const recent = await db
    .select({ id: puzzles.id })
    .from(puzzles)
    .orderBy(desc(puzzles.publishDate), desc(puzzles.id))
    .limit(puzzleLimit + 1);

  const ids = recent
    .map((row) => row.id)
    .filter((id) => id !== excludeId)
    .slice(0, puzzleLimit);
  if (ids.length === 0) return [];

  const rows = await db
    .select({ name: puzzleGroups.name })
    .from(puzzleGroups)
    .innerJoin(puzzles, eq(puzzles.id, puzzleGroups.puzzleId))
    .where(inArray(puzzleGroups.puzzleId, ids))
    .orderBy(desc(puzzles.publishDate), asc(puzzleGroups.difficulty));

  return [...new Set(rows.map((row) => row.name))];
}
