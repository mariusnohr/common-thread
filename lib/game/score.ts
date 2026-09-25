import { MAX_MISTAKES, type GameStatus } from "@/lib/puzzle/reducer";
import type { PublicGroup } from "@/lib/puzzle/types";

/** Most stars a puzzle can give: one per life left at the end. */
export const MAX_STARS = MAX_MISTAKES;

/**
 * Stars for a finished puzzle: one per life left, so a flawless game gives
 * three. A lost (or abandoned) game gives none.
 */
export function starsFor(status: GameStatus, mistakes: number): number {
  if (status !== "won") return 0;
  return Math.max(0, Math.min(MAX_STARS, MAX_STARS - mistakes));
}

/** Square per group difficulty in the shareable result grid. */
const DIFFICULTY_SQUARES: Record<number, string> = {
  1: "\u{1F7E8}", // yellow
  2: "\u{1F7E9}", // green
  3: "\u{1F7E6}", // blue
  4: "\u{1F7EA}", // purple
};
const UNKNOWN_SQUARE = "\u2B1C"; // white

export type ShareInput = {
  appName: string;
  puzzleNumber: number | null;
  levelLabel: string;
  status: GameStatus;
  mistakes: number;
  guesses: string[][];
  groups: PublicGroup[];
  url?: string;
};

/**
 * A spoiler-free summary of a finished game: one row of coloured squares per
 * guess, coloured by the group each word really belongs to.
 */
export function shareText(input: ShareInput): string {
  const groupOf = new Map<string, number>();
  for (const group of input.groups) {
    for (const word of group.words) groupOf.set(word, group.difficulty);
  }

  const title = [
    input.appName,
    input.puzzleNumber ? `nr. ${input.puzzleNumber}` : null,
    input.levelLabel.toLowerCase(),
  ]
    .filter(Boolean)
    .join(" · ");

  const stars = starsFor(input.status, input.mistakes);
  const score =
    input.status === "won"
      ? `${"\u2B50".repeat(stars)}${stars === 0 ? "" : " "}${stars}/${MAX_STARS}`
      : "ikke løst";

  const rows = input.guesses.map((guess) =>
    guess
      .map((word) => DIFFICULTY_SQUARES[groupOf.get(word) ?? 0] ?? UNKNOWN_SQUARE)
      .join(""),
  );

  return [title, score, "", ...rows, ...(input.url ? ["", input.url] : [])].join(
    "\n",
  );
}
