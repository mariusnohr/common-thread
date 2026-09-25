import { beforeEach, describe, expect, it } from "vitest";
import { revealPuzzle, submitGuess } from "@/app/actions/game";
import { seedPuzzles } from "@/db/seed/puzzles";
import { todayInOslo } from "@/lib/puzzle/oslo";
import {
  addDays,
  hasTestDatabase,
  insertPuzzle,
  truncateAll,
} from "../../tests/db";

const puzzle = seedPuzzles[0];
const firstGroup = puzzle.groups[0];
const secondGroup = puzzle.groups[1];

describe.skipIf(!hasTestDatabase())("submitGuess", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("accepts an exact group from a past puzzle", async () => {
    const id = await insertPuzzle(addDays(todayInOslo(), -1), puzzle);

    const result = await submitGuess(id, firstGroup.words);

    expect(result.ok).toBe(true);
    if (result.ok && result.correct) {
      expect(result.group.name).toBe(firstGroup.name);
      expect(result.group.words).toEqual(firstGroup.words);
    } else {
      throw new Error("expected a correct guess");
    }
  });

  it("rejects a selection that is not one of the groups", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle);

    const result = await submitGuess(id, [
      firstGroup.words[0],
      firstGroup.words[1],
      secondGroup.words[0],
      secondGroup.words[1],
    ]);

    expect(result).toEqual({ ok: true, correct: false, oneAway: false });
  });

  it("tells the player when three of four words share a group", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle);

    const result = await submitGuess(id, [
      ...firstGroup.words.slice(0, 3),
      secondGroup.words[0],
    ]);

    expect(result).toEqual({ ok: true, correct: false, oneAway: true });
  });

  it("rejects words that are not part of the puzzle", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle);

    const result = await submitGuess(id, ["eple", "banan", "pære", "finnes-ikke"]);

    expect(result.ok).toBe(false);
  });

  it("rejects a list that is not exactly four words", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle);

    expect((await submitGuess(id, firstGroup.words.slice(0, 3))).ok).toBe(false);
    expect(
      (await submitGuess(id, [...firstGroup.words, secondGroup.words[0]])).ok,
    ).toBe(false);
  });

  it("rejects a list with duplicate words", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle);

    const result = await submitGuess(id, [
      firstGroup.words[0],
      firstGroup.words[0],
      firstGroup.words[1],
      firstGroup.words[2],
    ]);

    expect(result.ok).toBe(false);
  });

  it("rejects a future puzzle", async () => {
    const id = await insertPuzzle(addDays(todayInOslo(), 1), puzzle);

    expect((await submitGuess(id, firstGroup.words)).ok).toBe(false);
  });

  it("rejects an unknown puzzle", async () => {
    expect((await submitGuess(999999, firstGroup.words)).ok).toBe(false);
  });
});

describe.skipIf(!hasTestDatabase())("revealPuzzle", () => {
  beforeEach(async () => {
    await truncateAll();
  });

  it("returns all groups for today's approved puzzle", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle);

    const result = await revealPuzzle(id);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.groups).toHaveLength(4);
      expect(result.groups.map((group) => group.difficulty)).toEqual([
        1, 2, 3, 4,
      ]);
    }
  });

  it("returns groups for a past puzzle", async () => {
    const id = await insertPuzzle(addDays(todayInOslo(), -5), puzzle);

    expect((await revealPuzzle(id)).ok).toBe(true);
  });

  it("refuses a future puzzle", async () => {
    const id = await insertPuzzle(addDays(todayInOslo(), 1), puzzle);

    expect((await revealPuzzle(id)).ok).toBe(false);
  });

  it("refuses a non-approved puzzle", async () => {
    const id = await insertPuzzle(todayInOslo(), puzzle, "draft");

    expect((await revealPuzzle(id)).ok).toBe(false);
  });
});
