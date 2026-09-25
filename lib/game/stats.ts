import { isPuzzleLevel } from "@/lib/puzzle/levels";
import { addDays } from "@/lib/puzzle/oslo";
import type { PuzzleLevel } from "@/lib/puzzle/types";

/** How one finished puzzle went, as kept in the player's browser. */
export type LevelResult = {
  won: boolean;
  stars: number;
  mistakes: number;
};

/** Finished puzzles keyed by Oslo date (`YYYY-MM-DD`) and level. */
export type ResultsByDate = Record<string, Partial<Record<PuzzleLevel, LevelResult>>>;

export type PlayerStats = {
  played: number;
  won: number;
  /** Whole-number percentage of finished puzzles that were won. */
  winRate: number;
  stars: number;
  /** Consecutive days, up to today, with at least one solved puzzle. */
  streak: number;
  bestStreak: number;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isLevelResult(value: unknown): value is LevelResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return (
    typeof result.won === "boolean" &&
    typeof result.stars === "number" &&
    typeof result.mistakes === "number"
  );
}

/** Parses stored results, dropping anything malformed. */
export function parseResults(raw: string | null): ResultsByDate {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};

  const results: ResultsByDate = {};
  for (const [date, levels] of Object.entries(data as Record<string, unknown>)) {
    if (!ISO_DATE.test(date) || !levels || typeof levels !== "object") continue;
    const day: Partial<Record<PuzzleLevel, LevelResult>> = {};
    for (const [level, result] of Object.entries(levels as Record<string, unknown>)) {
      if (isPuzzleLevel(level) && isLevelResult(result)) day[level] = result;
    }
    if (Object.keys(day).length > 0) results[date] = day;
  }
  return results;
}

function dayWasWon(day: ResultsByDate[string] | undefined): boolean {
  return Object.values(day ?? {}).some((result) => result?.won);
}

export function computeStats(results: ResultsByDate, today: string): PlayerStats {
  let played = 0;
  let won = 0;
  let stars = 0;
  for (const day of Object.values(results)) {
    for (const result of Object.values(day)) {
      if (!result) continue;
      played += 1;
      if (result.won) won += 1;
      stars += result.stars;
    }
  }

  // A streak stays alive through today until the day is over, so start
  // counting from yesterday when today has no win yet.
  let streak = 0;
  let cursor = dayWasWon(results[today]) ? today : addDays(today, -1);
  while (dayWasWon(results[cursor])) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  let bestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  const wonDates = Object.keys(results)
    .filter((date) => dayWasWon(results[date]))
    .sort();
  for (const date of wonDates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = date;
  }

  return {
    played,
    won,
    winRate: played === 0 ? 0 : Math.round((won / played) * 100),
    stars,
    streak,
    bestStreak: Math.max(bestStreak, streak),
  };
}
