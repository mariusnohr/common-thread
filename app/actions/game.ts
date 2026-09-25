"use server";

import { isOneAway, sameWordSet } from "@/lib/puzzle/guess";
import { todayInOslo } from "@/lib/puzzle/oslo";
import { getPlayablePuzzle } from "@/lib/puzzle/queries";
import type { PublicGroup } from "@/lib/puzzle/types";

export type SubmitGuessResult =
  | { ok: true; correct: true; group: PublicGroup }
  /** `oneAway` is true when three of the four words share a group. */
  | { ok: true; correct: false; oneAway: boolean }
  | { ok: false; error: string };

export type RevealPuzzleResult =
  | { ok: true; groups: PublicGroup[] }
  | { ok: false; error: string };

const WORDS_PER_GUESS = 4;

/**
 * Checks a guess on the server. The client only knows the 16 words, never
 * which ones belong together, so all answer checking happens here.
 */
export async function submitGuess(
  puzzleId: number,
  words: string[],
): Promise<SubmitGuessResult> {
  if (!Number.isInteger(puzzleId) || puzzleId <= 0) {
    return { ok: false, error: "Ugyldig oppgave." };
  }

  if (
    !Array.isArray(words) ||
    words.length !== WORDS_PER_GUESS ||
    words.some((word) => typeof word !== "string") ||
    new Set(words).size !== WORDS_PER_GUESS
  ) {
    return { ok: false, error: "Du må velge nøyaktig fire ord." };
  }

  const puzzle = await getPlayablePuzzle(puzzleId, todayInOslo());
  if (!puzzle) {
    return { ok: false, error: "Oppgaven er ikke tilgjengelig." };
  }

  const allowed = new Set(puzzle.words);
  if (!words.every((word) => allowed.has(word))) {
    return { ok: false, error: "Ordet er ikke med i denne oppgaven." };
  }

  const group = puzzle.groups.find((candidate) =>
    sameWordSet(candidate.words, words),
  );
  if (!group) {
    return { ok: true, correct: false, oneAway: isOneAway(puzzle.groups, words) };
  }

  return { ok: true, correct: true, group };
}

/** Reveals the groups for today's or a past approved puzzle. */
export async function revealPuzzle(
  puzzleId: number,
): Promise<RevealPuzzleResult> {
  if (!Number.isInteger(puzzleId) || puzzleId <= 0) {
    return { ok: false, error: "Ugyldig oppgave." };
  }

  const puzzle = await getPlayablePuzzle(puzzleId, todayInOslo());
  if (!puzzle) {
    return { ok: false, error: "Oppgaven er ikke tilgjengelig." };
  }

  return { ok: true, groups: puzzle.groups };
}
