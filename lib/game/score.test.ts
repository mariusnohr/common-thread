import { describe, expect, it } from "vitest";
import { shareText, starsFor } from "./score";

const GROUPS = [
  { difficulty: 1, name: "A", words: ["a1", "a2", "a3", "a4"] },
  { difficulty: 2, name: "B", words: ["b1", "b2", "b3", "b4"] },
  { difficulty: 3, name: "C", words: ["c1", "c2", "c3", "c4"] },
  { difficulty: 4, name: "D", words: ["d1", "d2", "d3", "d4"] },
];

describe("starsFor", () => {
  it("gives one star per life left on a win", () => {
    expect(starsFor("won", 0)).toBe(3);
    expect(starsFor("won", 1)).toBe(2);
    expect(starsFor("won", 2)).toBe(1);
  });

  it("gives no stars when the puzzle was not solved", () => {
    expect(starsFor("lost", 0)).toBe(0);
    expect(starsFor("lost", 3)).toBe(0);
  });
});

describe("shareText", () => {
  it("colours every guess by the real groups without naming words", () => {
    const text = shareText({
      appName: "Spill",
      puzzleNumber: 7,
      levelLabel: "Middels",
      status: "won",
      mistakes: 1,
      guesses: [
        ["a1", "a2", "a3", "b1"],
        ["a1", "a2", "a3", "a4"],
        ["b1", "b2", "b3", "b4"],
        ["c1", "c2", "c3", "c4"],
        ["d1", "d2", "d3", "d4"],
      ],
      groups: GROUPS,
      url: "https://example.com",
    });

    const lines = text.split("\n");
    expect(lines[0]).toBe("Spill · nr. 7 · middels");
    expect(lines[1]).toContain("2/3");
    expect(lines[3]).toBe("\u{1F7E8}\u{1F7E8}\u{1F7E8}\u{1F7E9}");
    expect(lines[4]).toBe("\u{1F7E8}".repeat(4));
    expect(lines.at(-1)).toBe("https://example.com");
    expect(text).not.toContain("a1");
  });

  it("marks an unsolved puzzle", () => {
    const text = shareText({
      appName: "Spill",
      puzzleNumber: null,
      levelLabel: "Lett",
      status: "lost",
      mistakes: 3,
      guesses: [],
      groups: GROUPS,
    });
    expect(text.split("\n").slice(0, 2)).toEqual(["Spill · lett", "ikke løst"]);
  });
});
