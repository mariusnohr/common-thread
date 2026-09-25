import { describe, expect, it } from "vitest";
import {
  addDays,
  formatNorwegianDay,
  secondsUntilOsloMidnight,
  todayInOslo,
} from "./oslo";

describe("todayInOslo", () => {
  it("uses the Oslo day, not UTC", () => {
    // 23:30 UTC on 24 September is 01:30 on 25 September in Oslo (CEST).
    expect(todayInOslo(new Date("2026-09-24T23:30:00Z"))).toBe("2026-09-25");
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("secondsUntilOsloMidnight", () => {
  it("counts down to midnight in Oslo", () => {
    // 20:00 UTC is 22:00 in Oslo (CEST): two hours left.
    expect(secondsUntilOsloMidnight(new Date("2026-09-25T20:00:00Z"))).toBe(7200);
  });
});

describe("formatNorwegianDay", () => {
  it("formats weekday, day and month in Norwegian", () => {
    expect(formatNorwegianDay("2026-09-25")).toBe("fredag 25. september");
  });
});
