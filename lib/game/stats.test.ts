import { describe, expect, it } from "vitest";
import { computeStats, parseResults, type ResultsByDate } from "./stats";

const WIN = { won: true, stars: 3, mistakes: 0 };
const LOSS = { won: false, stars: 0, mistakes: 3 };

describe("parseResults", () => {
  it("keeps valid entries and drops the rest", () => {
    const raw = JSON.stringify({
      "2026-09-25": { easy: WIN, hard: { won: "yes" }, bogus: WIN },
      "not-a-date": { easy: WIN },
    });
    expect(parseResults(raw)).toEqual({ "2026-09-25": { easy: WIN } });
  });

  it("survives garbage", () => {
    expect(parseResults("{nope")).toEqual({});
    expect(parseResults(null)).toEqual({});
    expect(parseResults("[1,2]")).toEqual({});
  });
});

describe("computeStats", () => {
  it("counts played, won and stars", () => {
    const results: ResultsByDate = {
      "2026-09-24": { easy: WIN, medium: LOSS },
      "2026-09-25": { easy: { won: true, stars: 2, mistakes: 1 } },
    };
    const stats = computeStats(results, "2026-09-25");
    expect(stats).toMatchObject({ played: 3, won: 2, winRate: 67, stars: 5 });
  });

  it("counts a streak through today", () => {
    const results: ResultsByDate = {
      "2026-09-23": { easy: WIN },
      "2026-09-24": { hard: WIN },
      "2026-09-25": { medium: WIN },
    };
    expect(computeStats(results, "2026-09-25").streak).toBe(3);
  });

  it("keeps yesterday's streak alive until today is over", () => {
    const results: ResultsByDate = {
      "2026-09-23": { easy: WIN },
      "2026-09-24": { easy: WIN },
    };
    expect(computeStats(results, "2026-09-25").streak).toBe(2);
  });

  it("breaks the streak on a day without a win and remembers the best", () => {
    const results: ResultsByDate = {
      "2026-09-10": { easy: WIN },
      "2026-09-11": { easy: WIN },
      "2026-09-12": { easy: WIN },
      "2026-09-23": { easy: LOSS },
      "2026-09-24": { easy: WIN },
    };
    const stats = computeStats(results, "2026-09-26");
    expect(stats.streak).toBe(0);
    expect(stats.bestStreak).toBe(3);
  });
});
