import { describe, expect, it } from "vitest";
import { createGameState, gameReducer } from "@/lib/puzzle/reducer";
import { parseSavedGame, serializeGame } from "./saved";

const WORDS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const GROUP = { difficulty: 1, name: "A", words: ["a", "b", "c", "d"] };

describe("saved games", () => {
  it("round-trips progress but not the current selection", () => {
    let state = gameReducer(createGameState(WORDS), { type: "solve", group: GROUP });
    state = gameReducer(state, { type: "toggle", word: "e" });
    state = gameReducer(state, { type: "wrong", guess: ["e", "f", "g", "a"] });

    const restored = parseSavedGame(serializeGame(state), [...WORDS].reverse());
    expect(restored).toEqual({ ...state, selected: [] });
  });

  it("ignores a save for different words", () => {
    const raw = serializeGame(createGameState(WORDS));
    expect(parseSavedGame(raw, ["x", ...WORDS.slice(1)])).toBeNull();
  });

  it("ignores malformed saves", () => {
    expect(parseSavedGame("{", WORDS)).toBeNull();
    expect(parseSavedGame(JSON.stringify({ v: 1, words: WORDS }), WORDS)).toBeNull();
    const tooMany = JSON.parse(serializeGame(createGameState(WORDS)));
    tooMany.mistakes = 9;
    expect(parseSavedGame(JSON.stringify(tooMany), WORDS)).toBeNull();
  });
});
