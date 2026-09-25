import { sameWordSet } from "@/lib/puzzle/guess";
import { MAX_MISTAKES, type GameState } from "@/lib/puzzle/reducer";
import type { PublicGroup } from "@/lib/puzzle/types";

const VERSION = 1;

/** What is kept in the browser so a reload does not reset the puzzle. */
export function serializeGame(state: GameState): string {
  return JSON.stringify({
    v: VERSION,
    words: state.words,
    solved: state.solved,
    guesses: state.guesses,
    mistakes: state.mistakes,
    status: state.status,
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isGroup(value: unknown): value is PublicGroup {
  if (!value || typeof value !== "object") return false;
  const group = value as Record<string, unknown>;
  return (
    typeof group.difficulty === "number" &&
    typeof group.name === "string" &&
    isStringArray(group.words)
  );
}

/**
 * Restores a saved game for a puzzle whose words are `words`. Returns `null`
 * when nothing usable is stored, including when the puzzle has been edited
 * since (the saved words no longer match).
 */
export function parseSavedGame(raw: string | null, words: string[]): GameState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const saved = data as Record<string, unknown>;

  if (saved.v !== VERSION) return null;
  if (!isStringArray(saved.words) || !sameWordSet(saved.words, words)) return null;
  if (!Array.isArray(saved.solved) || !saved.solved.every(isGroup)) return null;
  if (!Array.isArray(saved.guesses) || !saved.guesses.every(isStringArray)) return null;
  if (
    typeof saved.mistakes !== "number" ||
    !Number.isInteger(saved.mistakes) ||
    saved.mistakes < 0 ||
    saved.mistakes > MAX_MISTAKES
  ) {
    return null;
  }
  if (saved.status !== "playing" && saved.status !== "won" && saved.status !== "lost") {
    return null;
  }

  const allowed = new Set(words);
  const solved = saved.solved as PublicGroup[];
  if (!solved.every((group) => group.words.every((word) => allowed.has(word)))) {
    return null;
  }

  return {
    words: saved.words,
    selected: [],
    solved,
    guesses: saved.guesses as string[][],
    mistakes: saved.mistakes,
    status: saved.status,
  };
}
