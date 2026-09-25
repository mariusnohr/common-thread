import { beforeEach, describe, expect, it } from "vitest";
import { seedPuzzles } from "@/db/seed/puzzles";
import { getPuzzleById, getPuzzleForDate } from "@/lib/puzzle/queries";
import { savePuzzle, setPuzzleStatus } from "./mutations";
import { hasTestDatabase, truncateAll } from "../../tests/db";

const DATE = "2026-10-01";
const OTHER_DATE = "2026-10-02";

describe.skipIf(!hasTestDatabase())("savePuzzle", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("creates an approved puzzle that shows on the daily page", async () => {
    const result = await savePuzzle({
      publishDate: DATE,
      status: "approved",
      groups: seedPuzzles[0].groups,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const puzzle = await getPuzzleForDate(DATE);
    expect(puzzle?.id).toBe(result.id);
    expect(puzzle?.words).toHaveLength(16);
  });

  it("creates a draft puzzle that is hidden on the daily page", async () => {
    const result = await savePuzzle({
      publishDate: DATE,
      status: "draft",
      groups: seedPuzzles[0].groups,
    });

    expect(result.ok).toBe(true);
    expect(await getPuzzleForDate(DATE)).toBeNull();
  });

  it("updates an existing puzzle's status, date and groups", async () => {
    const created = await savePuzzle({
      publishDate: DATE,
      status: "draft",
      groups: seedPuzzles[0].groups,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await savePuzzle({
      id: created.id,
      publishDate: OTHER_DATE,
      status: "approved",
      groups: seedPuzzles[1].groups,
    });

    expect(updated.ok).toBe(true);
    expect(updated.ok && updated.id).toBe(created.id);
    expect(await getPuzzleForDate(DATE)).toBeNull();

    const puzzle = await getPuzzleById(created.id);
    expect(puzzle?.publishDate).toBe(OTHER_DATE);
    expect(puzzle?.status).toBe("approved");
    expect(puzzle?.groups.map((group) => group.name)).toEqual(
      seedPuzzles[1].groups.map((group) => group.name),
    );
  });

  it("rejects a second puzzle on the same date with a readable error", async () => {
    const first = await savePuzzle({
      publishDate: DATE,
      status: "approved",
      groups: seedPuzzles[0].groups,
    });
    expect(first.ok).toBe(true);

    const collision = await savePuzzle({
      publishDate: DATE,
      status: "draft",
      groups: seedPuzzles[1].groups,
    });

    expect(collision.ok).toBe(false);
    if (!collision.ok) {
      expect(collision.error).toMatch(/datoen/i);
    }

    // The original puzzle is untouched: no half-written replacement.
    const puzzle = await getPuzzleForDate(DATE);
    expect(puzzle?.groups[0].words).toEqual(seedPuzzles[0].groups[0].words);
  });

  it("leaves a puzzle intact when moving it onto an occupied date fails", async () => {
    const first = await savePuzzle({
      publishDate: DATE,
      status: "approved",
      groups: seedPuzzles[0].groups,
    });
    const second = await savePuzzle({
      publishDate: OTHER_DATE,
      status: "approved",
      groups: seedPuzzles[1].groups,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!second.ok) return;

    const collision = await savePuzzle({
      id: second.id,
      publishDate: DATE,
      status: "approved",
      groups: seedPuzzles[1].groups,
    });
    expect(collision.ok).toBe(false);

    const stillThere = await getPuzzleForDate(OTHER_DATE);
    expect(stillThere?.groups[0].words).toEqual(seedPuzzles[1].groups[0].words);
  });

  it("writes nothing when the puzzle fails validation", async () => {
    const result = await savePuzzle({
      publishDate: DATE,
      status: "approved",
      groups: seedPuzzles[0].groups.slice(0, 3),
    });

    expect(result.ok).toBe(false);
    expect(await getPuzzleForDate(DATE)).toBeNull();
  });
});

describe.skipIf(!hasTestDatabase())("setPuzzleStatus", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("approves a draft so it appears on the daily page", async () => {
    const created = await savePuzzle({
      publishDate: DATE,
      status: "draft",
      groups: seedPuzzles[0].groups,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(await getPuzzleForDate(DATE)).toBeNull();

    const result = await setPuzzleStatus(created.id, "approved");
    expect(result.ok).toBe(true);

    expect(await getPuzzleForDate(DATE)).not.toBeNull();
  });

  it("hides an approved puzzle when changed to draft", async () => {
    const created = await savePuzzle({
      publishDate: DATE,
      status: "approved",
      groups: seedPuzzles[0].groups,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(await getPuzzleForDate(DATE)).not.toBeNull();

    await setPuzzleStatus(created.id, "draft");

    expect(await getPuzzleForDate(DATE)).toBeNull();
  });

  it("returns a readable error for an unknown puzzle", async () => {
    const result = await setPuzzleStatus(999_999, "approved");
    expect(result.ok).toBe(false);
  });
});
