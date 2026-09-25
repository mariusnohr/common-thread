import { beforeEach, describe, expect, it } from "vitest";
import { seedPuzzles } from "@/db/seed/puzzles";
import {
  getApprovedLevelsForDate,
  getPlayablePuzzle,
  getPuzzleForDate,
  listPuzzles,
  listRecentGroupNames,
} from "@/lib/puzzle/queries";
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

    const puzzle = await getPuzzleForDate(DATE, "easy");

    expect(puzzle?.id).toBe(id);
    expect(puzzle?.publishDate).toBe(DATE);
    expect(puzzle?.level).toBe("easy");
    expect(puzzle?.words).toHaveLength(16);
    expect(new Set(puzzle?.words).size).toBe(16);
  });

  it("orders groups by difficulty", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);

    const puzzle = await getPuzzleForDate(DATE, "easy");

    expect(puzzle?.groups.map((group) => group.difficulty)).toEqual([
      1, 2, 3, 4,
    ]);
  });

  it("returns null when no puzzle is published that day", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);

    expect(await getPuzzleForDate("2026-10-02", "easy")).toBeNull();
  });

  it("returns the puzzle for the requested level only", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "approved", "easy");
    const hardId = await insertPuzzle(DATE, seedPuzzles[1], "approved", "hard");

    expect((await getPuzzleForDate(DATE, "hard"))?.id).toBe(hardId);
    expect(await getPuzzleForDate(DATE, "medium")).toBeNull();
  });

  it("ignores puzzles that are not approved", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "draft");

    expect(await getPuzzleForDate(DATE, "easy")).toBeNull();
  });

  it("allows one puzzle per level on the same date", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "approved", "easy");
    await insertPuzzle(DATE, seedPuzzles[1], "approved", "medium");
    await insertPuzzle(DATE, seedPuzzles[2], "approved", "hard");

    expect(await getApprovedLevelsForDate(DATE)).toEqual([
      "easy",
      "medium",
      "hard",
    ]);
  });

  it("fails at the database level when two puzzles share a date and level", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "approved", "medium");

    await expect(
      insertPuzzle(DATE, seedPuzzles[1], "draft", "medium"),
    ).rejects.toThrow();
  });
});

describe.skipIf(!hasTestDatabase())("getApprovedLevelsForDate", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("lists approved levels easiest first and skips unapproved ones", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "approved", "hard");
    await insertPuzzle(DATE, seedPuzzles[1], "suggested", "medium");
    await insertPuzzle(DATE, seedPuzzles[2], "approved", "easy");

    expect(await getApprovedLevelsForDate(DATE)).toEqual(["easy", "hard"]);
  });
});

describe.skipIf(!hasTestDatabase())("listPuzzles", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("orders newest date first and easiest level first within a day", async () => {
    await insertPuzzle(DATE, seedPuzzles[0], "approved", "hard");
    await insertPuzzle(DATE, seedPuzzles[1], "approved", "easy");
    await insertPuzzle(addDays(DATE, 1), seedPuzzles[2], "approved", "medium");

    const rows = await listPuzzles();

    expect(rows.map((row) => [row.publishDate, row.level])).toEqual([
      [addDays(DATE, 1), "medium"],
      [DATE, "easy"],
      [DATE, "hard"],
    ]);
  });
});

describe.skipIf(!hasTestDatabase())("listRecentGroupNames", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("returns unique group names from the newest puzzles", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);
    await insertPuzzle(addDays(DATE, 1), seedPuzzles[1], "suggested");

    const names = await listRecentGroupNames(1);

    expect(names).toEqual(seedPuzzles[1].groups.map((group) => group.name));
  });

  it("leaves out the excluded puzzle", async () => {
    await insertPuzzle(DATE, seedPuzzles[0]);
    const newest = await insertPuzzle(addDays(DATE, 1), seedPuzzles[1]);

    const names = await listRecentGroupNames(1, newest);

    expect(names).toEqual(seedPuzzles[0].groups.map((group) => group.name));
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
