import { describe, expect, it } from "vitest";
import { puzzleNumberForDate } from "./number";

describe("puzzleNumberForDate", () => {
  it("returns 1 for the launch date", () => {
    expect(puzzleNumberForDate("2026-10-01", "2026-10-01")).toBe(1);
  });

  it("counts consecutive days", () => {
    expect(puzzleNumberForDate("2026-10-01", "2026-10-02")).toBe(2);
    expect(puzzleNumberForDate("2026-10-01", "2026-10-10")).toBe(10);
  });

  it("counts across month boundaries", () => {
    expect(puzzleNumberForDate("2026-09-30", "2026-10-02")).toBe(3);
  });

  it("returns null before the launch date", () => {
    expect(puzzleNumberForDate("2026-10-02", "2026-10-01")).toBeNull();
  });

  it("returns null for missing or malformed input", () => {
    expect(puzzleNumberForDate(undefined, "2026-10-01")).toBeNull();
    expect(puzzleNumberForDate("nope", "2026-10-01")).toBeNull();
    expect(puzzleNumberForDate("2026-10-01", "2026-1-1")).toBeNull();
  });
});
