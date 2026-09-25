import type { PuzzleLevel } from "./types";

/** Every level, easiest first. Matches the `puzzle_level` enum order. */
export const PUZZLE_LEVELS: readonly PuzzleLevel[] = ["easy", "medium", "hard"];

/** Norwegian display names. */
export const LEVEL_LABELS: Record<PuzzleLevel, string> = {
  easy: "Lett",
  medium: "Middels",
  hard: "Vanskelig",
};

/** Norwegian URL slugs for `/?niva=…`. */
const LEVEL_SLUGS: Record<PuzzleLevel, string> = {
  easy: "lett",
  medium: "middels",
  hard: "vanskelig",
};

export function isPuzzleLevel(value: unknown): value is PuzzleLevel {
  return (
    typeof value === "string" &&
    (PUZZLE_LEVELS as readonly string[]).includes(value)
  );
}

export function levelSlug(level: PuzzleLevel): string {
  return LEVEL_SLUGS[level];
}

/** The level for a `niva` search param, or `null` for anything unknown. */
export function levelFromSlug(slug: unknown): PuzzleLevel | null {
  if (typeof slug !== "string") return null;
  const match = PUZZLE_LEVELS.find((level) => LEVEL_SLUGS[level] === slug);
  return match ?? null;
}
