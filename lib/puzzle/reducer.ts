import type { PublicGroup } from "./types";

export type GameStatus = "playing" | "won" | "lost";

export const MAX_MISTAKES = 4;

export type GameState = {
  /** The 16 words for the puzzle, in the order shown to the player. */
  words: string[];
  /** Words currently selected by the player (at most four). */
  selected: string[];
  /** Groups the player has already solved or that have been revealed. */
  solved: PublicGroup[];
  mistakes: number;
  status: GameStatus;
};

export type GameAction =
  | { type: "toggle"; word: string }
  | { type: "clear" }
  | { type: "solve"; group: PublicGroup }
  | { type: "wrong" }
  | { type: "reveal"; groups: PublicGroup[] };

export function createGameState(words: string[]): GameState {
  return {
    words,
    selected: [],
    solved: [],
    mistakes: 0,
    status: "playing",
  };
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

    case "solve": {
      if (state.status !== "playing") return state;
      if (state.solved.some((group) => group.difficulty === action.group.difficulty)) {
        return state;
      }
      const solved = [...state.solved, action.group].sort(
        (a, b) => a.difficulty - b.difficulty,
      );
      return {
        ...state,
        selected: [],
        solved,
        status: solved.length === 4 ? "won" : "playing",
      };
    }

    case "wrong": {
      if (state.status !== "playing") return state;
      const mistakes = state.mistakes + 1;
      return {
        ...state,
        selected: [],
        mistakes,
        status: mistakes >= MAX_MISTAKES ? "lost" : "playing",
      };
    }

    case "reveal": {
      const solved = [...action.groups].sort(
        (a, b) => a.difficulty - b.difficulty,
      );
      return {
        ...state,
        selected: [],
        solved,
        status: state.status === "won" ? "won" : "lost",
      };
    }
  }
}
