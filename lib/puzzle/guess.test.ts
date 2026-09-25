import { describe, expect, it } from "vitest";
import { isOneAway, sameWordSet, sharedWordCount } from "./guess";

const GROUPS = [
  { words: ["a", "b", "c", "d"] },
  { words: ["e", "f", "g", "h"] },
];

describe("sameWordSet", () => {
  it("ignores order", () => {
    expect(sameWordSet(["a", "b", "c", "d"], ["d", "c", "b", "a"])).toBe(true);
  });

  it("rejects different words or lengths", () => {
    expect(sameWordSet(["a", "b", "c", "d"], ["a", "b", "c", "e"])).toBe(false);
    expect(sameWordSet(["a", "b", "c"], ["a", "b", "c", "d"])).toBe(false);
  });
});

describe("sharedWordCount", () => {
  it("counts overlapping words", () => {
    expect(sharedWordCount(["a", "b", "c", "d"], ["a", "b", "e", "f"])).toBe(2);
  });
});

describe("isOneAway", () => {
  it("is true when three words share a group", () => {
    expect(isOneAway(GROUPS, ["a", "b", "c", "e"])).toBe(true);
  });

  it("is false for a two-and-two split", () => {
    expect(isOneAway(GROUPS, ["a", "b", "e", "f"])).toBe(false);
  });
});
