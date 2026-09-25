import { describe, expect, it } from "vitest";
import {
  createGameState,
  gameReducer,
  MAX_MISTAKES,
  type GameState,
} from "./reducer";
import type { PublicGroup } from "./types";

const WORDS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const GROUP: PublicGroup = { difficulty: 1, name: "Test", words: ["a", "b", "c", "d"] };

function select(state: GameState, words: string[]): GameState {
  return words.reduce(
    (current, word) => gameReducer(current, { type: "toggle", word }),
    state,
  );
}

describe("gameReducer", () => {
  it("starts with no selection and all words", () => {
    const state = createGameState(WORDS);
    expect(state.selected).toEqual([]);
    expect(state.solved).toEqual([]);
    expect(state.status).toBe("playing");
  });

  it("toggles words in and out of the selection", () => {
    let state = select(createGameState(WORDS), ["a", "b"]);
    expect(state.selected).toEqual(["a", "b"]);
    state = gameReducer(state, { type: "toggle", word: "a" });
    expect(state.selected).toEqual(["b"]);
  });

  it("never selects more than four words", () => {
    const state = select(createGameState(WORDS), ["a", "b", "c", "d", "e"]);
    expect(state.selected).toHaveLength(4);
  });

  it("clears the selection", () => {
    const state = select(createGameState(WORDS), ["a", "b"]);
    expect(gameReducer(state, { type: "clear" }).selected).toEqual([]);
  });

  it("records a solved group and clears the selection", () => {
    const state = select(createGameState(WORDS), ["a", "b", "c", "d"]);
    const solved = gameReducer(state, { type: "solve", group: GROUP });
    expect(solved.solved).toEqual([GROUP]);
    expect(solved.selected).toEqual([]);
    expect(solved.status).toBe("playing");
  });

  it("wins after four solved groups", () => {
    let state = createGameState(WORDS);
    for (let difficulty = 1 as const; difficulty <= 4; difficulty += 1) {
      state = gameReducer(state, {
        type: "solve",
        group: {
          difficulty,
          name: `Gruppe ${difficulty}`,
          words: [`w${difficulty}a`, `w${difficulty}b`, `w${difficulty}c`, `w${difficulty}d`],
        },
      });
    }
    expect(state.solved).toHaveLength(4);
    expect(state.status).toBe("won");
  });

  it("counts mistakes and loses at the limit", () => {
    let state = select(createGameState(WORDS), ["a", "b", "c", "d"]);
    for (let i = 1; i <= MAX_MISTAKES; i += 1) {
      state = gameReducer(state, { type: "wrong" });
      expect(state.mistakes).toBe(i);
      expect(state.selected).toEqual([]);
    }
    expect(state.status).toBe("lost");
  });

  it("reveals every group and ends the game", () => {
    const groups: PublicGroup[] = [
      { difficulty: 2, name: "B", words: ["e", "f", "g", "h"] },
      GROUP,
    ];
    const state = gameReducer(createGameState(WORDS), { type: "reveal", groups });
    expect(state.solved.map((group) => group.difficulty)).toEqual([1, 2]);
    expect(state.status).toBe("lost");
  });

  it("ignores toggles once the game is over", () => {
    let state = select(createGameState(WORDS), ["a", "b", "c", "d"]);
    for (let i = 1; i <= MAX_MISTAKES; i += 1) {
      state = gameReducer(state, { type: "wrong" });
    }
    expect(gameReducer(state, { type: "toggle", word: "a" }).selected).toEqual([]);
  });
});
