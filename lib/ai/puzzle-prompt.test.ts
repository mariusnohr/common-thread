import { describe, expect, it } from "vitest";
import {
  buildPuzzlePrompt,
  LEVEL_GUIDES,
  MAX_WORD_LENGTH,
  PUZZLE_SYSTEM_PROMPT,
} from "./puzzle-prompt";

describe("PUZZLE_SYSTEM_PROMPT", () => {
  it("asks for Norwegian bokmål and states the word length limit", () => {
    expect(PUZZLE_SYSTEM_PROMPT).toMatch(/bokmål/);
    expect(PUZZLE_SYSTEM_PROMPT).toContain(`at most ${MAX_WORD_LENGTH} characters`);
  });
});

describe("buildPuzzlePrompt", () => {
  it("includes the guide for the requested level only", () => {
    const prompt = buildPuzzlePrompt({ level: "hard", avoidThemes: [] });

    expect(prompt).toContain(LEVEL_GUIDES.hard);
    expect(prompt).not.toContain(LEVEL_GUIDES.easy);
    expect(prompt).not.toContain(LEVEL_GUIDES.medium);
  });

  it("lists recent themes to avoid", () => {
    const prompt = buildPuzzlePrompt({
      level: "easy",
      avoidThemes: ["Frukt", "Norske byer"],
    });

    expect(prompt).toContain("- Frukt\n- Norske byer");
  });

  it("leaves out the avoid list when there are no recent themes", () => {
    expect(buildPuzzlePrompt({ level: "easy", avoidThemes: [] })).not.toMatch(
      /Recent groups/,
    );
  });

  it("includes feedback from a rejected attempt", () => {
    const prompt = buildPuzzlePrompt({
      level: "medium",
      avoidThemes: [],
      feedback: "Ordet «sei» er brukt mer enn én gang.",
    });

    expect(prompt).toContain("previous attempt was rejected");
    expect(prompt).toContain("Ordet «sei» er brukt mer enn én gang.");
  });
});
