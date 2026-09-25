import { describe, expect, it } from "vitest";
import {
  createGameState,
  gameReducer,
  isRepeatGuess,
  livesLeft,
  MAX_MISTAKES,
  wasSolvedByPlayer,
  type GameState,
} from "./reducer";
import type { PublicGroup } from "./types";

const WORDS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const GROUP: PublicGroup = { difficulty: 1, name: "Test", words: ["a", "b", "c", "d"] };
const WRONG = ["a", "b", "e", "f"];

function select(state: GameState, words: string[]): GameState {
  return words.reduce(
    (current, word) => gameReducer(current, { type: "toggle", word }),
    state,
  );
}

function loseAllLives(state: GameState): GameState {
  let current = state;
  for (let i = 0; i < MAX_MISTAKES; i += 1) {
    current = gameReducer(current, { type: "wrong", guess: [...WRONG] });
  }
  return current;
}

describe("gameReducer", () => {
  it("gives the player three lives", () => {
    expect(MAX_MISTAKES).toBe(3);
    expect(livesLeft(createGameState(WORDS))).toBe(3);
  });

  it("starts with no selection and all words", () => {
    const state = createGameState(WORDS);
    expect(state.selected).toEqual([]);
    expect(state.solved).toEqual([]);
    expect(state.guesses).toEqual([]);
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

  it("shuffles the words without losing any", () => {
    const state = gameReducer(createGameState(WORDS), { type: "shuffle", seed: "x" });
    expect([...state.words].sort()).toEqual([...WORDS].sort());
  });

  it("moves promoted words to the front, after solved words", () => {
    let state = gameReducer(createGameState(WORDS), { type: "solve", group: GROUP });
    state = gameReducer(state, { type: "promote", words: ["h", "f"] });
    expect(state.words).toEqual(["a", "b", "c", "d", "f", "h", "e", "g"]);
  });

  it("records a solved group and clears the selection", () => {
    const state = select(createGameState(WORDS), ["a", "b", "c", "d"]);
    const solved = gameReducer(state, { type: "solve", group: GROUP });
    expect(solved.solved).toEqual([GROUP]);
    expect(solved.selected).toEqual([]);
    expect(solved.guesses).toEqual([GROUP.words]);
    expect(solved.status).toBe("playing");
    expect(wasSolvedByPlayer(solved, GROUP)).toBe(true);
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

  it("keeps the selection after a wrong guess so one word can be swapped", () => {
    const state = select(createGameState(WORDS), WRONG);
    const next = gameReducer(state, { type: "wrong", guess: [...WRONG] });
    expect(next.mistakes).toBe(1);
    expect(next.selected).toEqual(WRONG);
    expect(next.guesses).toEqual([WRONG]);
    expect(isRepeatGuess(next, ["f", "e", "b", "a"])).toBe(true);
    expect(isRepeatGuess(next, ["a", "b", "c", "d"])).toBe(false);
  });

  it("counts mistakes and loses at the limit", () => {
    const state = loseAllLives(select(createGameState(WORDS), WRONG));
    expect(state.mistakes).toBe(MAX_MISTAKES);
    expect(livesLeft(state)).toBe(0);
    expect(state.selected).toEqual([]);
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
    expect(wasSolvedByPlayer(state, GROUP)).toBe(false);
  });

  it("ignores toggles once the game is over", () => {
    const state = loseAllLives(select(createGameState(WORDS), WRONG));
    expect(gameReducer(state, { type: "toggle", word: "a" }).selected).toEqual([]);
  });

  it("keeps solved groups in the order they were found", () => {
    const hard: PublicGroup = { difficulty: 4, name: "D", words: ["e", "f", "g", "h"] };
    let state = gameReducer(createGameState(WORDS), { type: "solve", group: hard });
    state = gameReducer(state, { type: "solve", group: GROUP });
    expect(state.solved.map((group) => group.difficulty)).toEqual([4, 1]);
  });

  it("reveals the missing groups after the ones the player found", () => {
    const found: PublicGroup = { difficulty: 3, name: "C", words: ["e", "f", "g", "h"] };
    const others: PublicGroup[] = [
      { difficulty: 4, name: "D", words: ["m", "n", "o", "p"] },
      GROUP,
      found,
      { difficulty: 2, name: "B", words: ["i", "j", "k", "l"] },
    ];
    let state = gameReducer(createGameState(WORDS), { type: "solve", group: found });
    state = gameReducer(state, { type: "reveal", groups: others });
    expect(state.solved.map((group) => group.difficulty)).toEqual([3, 1, 2, 4]);
  });

  it("replaces the state on restore", () => {
    const saved = loseAllLives(createGameState(WORDS));
    expect(gameReducer(createGameState(WORDS), { type: "restore", state: saved })).toBe(saved);
  });
});
