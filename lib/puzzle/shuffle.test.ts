import { describe, expect, it } from "vitest";
import { randomSeed, shuffleWords } from "./shuffle";

const WORDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

describe("shuffleWords", () => {
  it("returns a permutation of the input", () => {
    const shuffled = shuffleWords(WORDS, "seed");
    expect([...shuffled].sort()).toEqual([...WORDS].sort());
    expect(shuffled).toHaveLength(WORDS.length);
  });

  it("does not mutate the input", () => {
    const input = [...WORDS];
    shuffleWords(input, "seed");
    expect(input).toEqual(WORDS);
  });

  it("is stable for the same seed and different for different seeds", () => {
    expect(shuffleWords(WORDS, "one")).toEqual(shuffleWords(WORDS, "one"));
    expect(shuffleWords(WORDS, "one")).not.toEqual(shuffleWords(WORDS, "two"));
  });
});

describe("randomSeed", () => {
  it("returns a fresh opaque value each time", () => {
    expect(randomSeed()).not.toBe(randomSeed());
  });
});
