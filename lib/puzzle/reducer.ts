import { sameWordSet } from "./guess";
import { shuffleWords } from "./shuffle";
import type { PublicGroup } from "./types";

export type GameStatus = "playing" | "won" | "lost";

/** Lives per puzzle. Every wrong guess costs one. */
export const MAX_MISTAKES = 3;

export type GameState = {
  /** The 16 words for the puzzle, in the order shown to the player. */
  words: string[];
  /** Words currently selected by the player (at most four). */
  selected: string[];
  /** Groups the player has already solved or that have been revealed. */
  solved: PublicGroup[];
  /** Every submitted guess, right or wrong, in the order it was made. */
  guesses: string[][];
  mistakes: number;
  status: GameStatus;
};

export type GameAction =
  | { type: "toggle"; word: string }
  | { type: "clear" }
  | { type: "shuffle"; seed: string }
  /** Moves `words` to the front of the board (before a solved row collapses). */
  | { type: "promote"; words: string[] }
  | { type: "solve"; group: PublicGroup }
  | { type: "wrong"; guess: string[] }
  | { type: "reveal"; groups: PublicGroup[] }
  | { type: "restore"; state: GameState };

export function createGameState(words: string[]): GameState {
  return {
    words,
    selected: [],
    solved: [],
    guesses: [],
    mistakes: 0,
    status: "playing",
  };
}

/** Lives left, from `MAX_MISTAKES` down to zero. */
export function livesLeft(state: Pick<GameState, "mistakes">): number {
  return Math.max(0, MAX_MISTAKES - state.mistakes);
}

/** True when the same four words have been submitted before. */
export function isRepeatGuess(
  state: Pick<GameState, "guesses">,
  guess: readonly string[],
): boolean {
  return state.guesses.some((previous) => sameWordSet(previous, guess));
}

/** True when `group` was found by the player rather than revealed. */
export function wasSolvedByPlayer(
  state: Pick<GameState, "guesses">,
  group: PublicGroup,
): boolean {
  return state.guesses.some((guess) => sameWordSet(guess, group.words));
}

/**
 * Pure state machine for the daily puzzle. It never learns which words belong
 * together: the caller feeds it the result of a server-side guess.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "toggle": {
      if (state.status !== "playing") return state;
      if (state.solved.some((group) => group.words.includes(action.word))) {
        return state;
      }
      if (state.selected.includes(action.word)) {
        return {
          ...state,
          selected: state.selected.filter((word) => word !== action.word),
        };
      }
      if (state.selected.length >= 4) return state;
      return { ...state, selected: [...state.selected, action.word] };
    }

    case "clear":
      return { ...state, selected: [] };

    case "shuffle": {
      if (state.status !== "playing") return state;
      return { ...state, words: shuffleWords(state.words, action.seed) };
    }

    case "promote": {
      const promoted = state.words.filter((word) => action.words.includes(word));
      const solvedWords = new Set(state.solved.flatMap((group) => group.words));
      const done = state.words.filter((word) => solvedWords.has(word));
      const rest = state.words.filter(
        (word) => !solvedWords.has(word) && !action.words.includes(word),
      );
      return { ...state, words: [...done, ...promoted, ...rest] };
    }

    case "solve": {
      if (state.status !== "playing") return state;
      if (state.solved.some((group) => group.difficulty === action.group.difficulty)) {
        return state;
      }
      // Solved groups stay in the order they were found.
      const solved = [...state.solved, action.group];
      return {
        ...state,
        selected: [],
        solved,
        guesses: [...state.guesses, [...action.group.words]],
        status: solved.length === 4 ? "won" : "playing",
      };
    }

    case "wrong": {
      if (state.status !== "playing") return state;
      const mistakes = state.mistakes + 1;
      const lost = mistakes >= MAX_MISTAKES;
      return {
        ...state,
        // Keep the selection so the player can swap a single word.
        selected: lost ? [] : state.selected,
        guesses: [...state.guesses, [...action.guess]],
        mistakes,
        status: lost ? "lost" : "playing",
      };
    }

    case "reveal": {
      // Keep what the player found, in order, then the rest easiest first.
      const found = new Set(state.solved.map((group) => group.difficulty));
      const rest = action.groups
        .filter((group) => !found.has(group.difficulty))
        .sort((a, b) => a.difficulty - b.difficulty);
      const solved = [...state.solved, ...rest];
      return {
        ...state,
        selected: [],
        solved,
        status: state.status === "won" ? "won" : "lost",
      };
    }

    case "restore":
      return action.state;
  }
}
