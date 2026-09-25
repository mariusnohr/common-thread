import { beforeEach, describe, expect, it } from "vitest";
import { seedPuzzles } from "@/db/seed/puzzles";
import { getPlayablePuzzle, getPuzzleForDate } from "@/lib/puzzle/queries";
import {
  addDays,
  hasTestDatabase,
  insertPuzzle,
  truncateAll,
} from "../../tests/db";

const DATE = "2026-10-01";

describe.skipIf(!hasTestDatabase())("getPuzzleForDate", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("returns the approved puzzle for a date with all 16 words", async () => {
    const id = await insertPuzzle(DATE, seedPuzzles[0]);

    const puzzle = await getPuzzleForDate(DATE);

    expect(puzzle?.id).toBe(id);
    expect(puzzle?.publishDate).toBe(DATE);
    expect(puzzle?.words).toHaveLength(16);
    expect(new Set(puzzle?.words).size).toBe(16);
  });

  it("orders groups by difficulty", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);

    const puzzle = await getPuzzleForDate(DATE);

    expect(puzzle?.groups.map((group) => group.difficulty)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("returns null when no puzzle is published that day", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);

    expect(await getPuzzleForDate("2026-10-02")).toBeNull();
  });

  it("ignores puzzles that are not approved", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "draft");

    expect(await getPuzzleForDate(DATE)).toBeNull();
  });

  it("fails at the database level when two puzzles share a publish_date", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);

    await expect(insertPuzzle(DATE, seedPuzzles[1])).rejects.toThrow();
  });
});

describe.skipIf(!hasTestDatabase())("getPlayablePuzzle", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("allows today's puzzle", async () => {
    const id = await insertPuzzle(DATE, seedPuzzles[0]);

    expect(await getPlayablePuzzle(id, DATE)).not.toBeNull();
  });

  it("allows a past puzzle", async () => {
    const id = await insertPuzzle(DATE, seedPuzzles[0]);

    expect(await getPlayablePuzzle(id, addDays(DATE, 1))).not.toBeNull();
  });

  it("rejects a future puzzle", async () => {
    const id = await insertPuzzle(DATE, seedPuzzles[0]);

    expect(await getPlayablePuzzle(id, addDays(DATE, -1))).toBeNull();
  });

  it("rejects a puzzle that is not approved", async () => {
    const id = await insertPuzzle(DATE, seedPuzzles[0], "suggested");

    expect(await getPlayablePuzzle(id, DATE)).toBeNull();
  });
});
