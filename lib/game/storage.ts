"use client";

import { useSyncExternalStore } from "react";
import type { GameState } from "@/lib/puzzle/reducer";
import type { PuzzleLevel } from "@/lib/puzzle/types";
import { parseSavedGame, serializeGame } from "./saved";
import { parseResults, type LevelResult, type ResultsByDate } from "./stats";

/**
 * Browser-only persistence. Everything lives in localStorage, so progress and
 * stats are per device and never leave the player's browser. Every access is
 * wrapped because storage can be full, disabled or blocked (private mode).
 */

const PREFIX = "ct:v1";
const RESULTS_KEY = `${PREFIX}:results`;
const HELP_KEY = `${PREFIX}:seen-help`;
const CHANGE_EVENT = "ct:storage";

function gameKey(puzzleId: number): string {
  return `${PREFIX}:game:${puzzleId}`;
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the game still works, it just is not remembered.
  }
}

export function loadGame(puzzleId: number, words: string[]): GameState | null {
  return parseSavedGame(read(gameKey(puzzleId)), words);
}

export function saveGame(puzzleId: number, state: GameState): void {
  write(gameKey(puzzleId), serializeGame(state));
}

let cachedRaw: string | null | undefined;
let cachedResults: ResultsByDate = {};

/** Stable snapshot for `useSyncExternalStore`: same object until it changes. */
function readResults(): ResultsByDate {
  const raw = read(RESULTS_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedResults = parseResults(raw);
  }
  return cachedResults;
}

export function recordResult(
  date: string,
  level: PuzzleLevel,
  result: LevelResult,
): void {
  const current = readResults();
  const previous = current[date]?.[level];
  if (
    previous &&
    previous.won === result.won &&
    previous.stars === result.stars &&
    previous.mistakes === result.mistakes
  ) {
    return;
  }
  write(
    RESULTS_KEY,
    JSON.stringify({ ...current, [date]: { ...current[date], [level]: result } }),
  );
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** The player's results, or `null` during server render and hydration. */
export function useResults(): ResultsByDate | null {
  return useSyncExternalStore<ResultsByDate | null>(subscribe, readResults, () => null);
}

export function hasSeenHelp(): boolean {
  return read(HELP_KEY) === "1";
}

export function markHelpSeen(): void {
  write(HELP_KEY, "1");
}
