import { describe, expect, it } from "vitest";
import { seedPuzzles } from "@/db/seed/puzzles";
import { puzzleSchema } from "./schema";

describe("puzzleSchema", () => {
  it("accepts every seeded puzzle", () => {
    for (const [index, puzzle] of seedPuzzles.entries()) {
      expect(() => puzzleSchema.parse(puzzle)).not.toThrow();
      expect(index).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects a puzzle with fewer than four groups", () => {
    const puzzle = { groups: seedPuzzles[0].groups.slice(0, 3) };
    expect(() => puzzleSchema.parse(puzzle)).toThrow();
  });

  it("rejects duplicate words across groups", () => {
    const groups = seedPuzzles[0].groups.map((group, index) =>
      index === 1 ? { ...group, words: ["eple", "sag", "tang", "meisel"] } : group,
    );
    expect(() => puzzleSchema.parse({ groups })).toThrow();
  });

  it("rejects duplicate difficulties", () => {
    const groups = seedPuzzles[0].groups.map((group, index) =>
      index === 1 ? { ...group, difficulty: 1 as const } : group,
    );
    expect(() => puzzleSchema.parse({ groups })).toThrow();
  });
});
