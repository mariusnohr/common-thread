export type Difficulty = 1 | 2 | 3 | 4;

/** Mirrors the `puzzle_status` Postgres enum in `db/schema.ts`. */
export type PuzzleStatus = "suggested" | "draft" | "approved";

/**
 * Mirrors the `puzzle_level` Postgres enum in `db/schema.ts`: how hard a whole
 * puzzle is. Each day has one puzzle per level.
 */
export type PuzzleLevel = "easy" | "medium" | "hard";

/** A single category inside a puzzle, as stored in `db/seed/puzzles.ts`. */
export type PuzzleGroupData = {
  difficulty: Difficulty;
  name: string;
  words: string[];
};

/** One full puzzle: exactly four groups of four unique words. */
export type PuzzleData = {
  groups: PuzzleGroupData[];
};

/** A group as exposed to the client once it has been solved or revealed. */
export type PublicGroup = {
  difficulty: number;
  name: string;
  words: string[];
};

/** A playable puzzle for a given date, including the private group answers. */
export type PuzzleForDate = {
  id: number;
  publishDate: string;
  level: PuzzleLevel;
  words: string[];
  groups: PublicGroup[];
};

/** A puzzle as shown in the admin overview and editor. */
export type AdminPuzzle = {
  id: number;
  publishDate: string;
  level: PuzzleLevel;
  status: PuzzleStatus;
  groups: PublicGroup[];
};
