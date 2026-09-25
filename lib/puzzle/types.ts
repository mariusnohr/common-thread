export type Difficulty = 1 | 2 | 3 | 4;

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
  words: string[];
  groups: PublicGroup[];
};
