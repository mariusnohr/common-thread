import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it, vi } from "vitest";
import {
  generatePuzzle,
  validateGeneratedPuzzle,
  type GeneratedPuzzle,
} from "./generate-puzzle";

const validPuzzle: GeneratedPuzzle = {
  groups: [
    { name: "Fisk", words: ["laks", "torsk", "sei", "ørret"] },
    { name: "Ord foran «ball»", words: ["fot", "hånd", "snø", "maske"] },
    { name: "Sol___", words: ["krem", "seng", "bær", "stråle"] },
    { name: "Skjulte dyr", words: ["hundre", "skatt", "belg", "revers"] },
  ],
};

function withGroups(
  update: (groups: GeneratedPuzzle["groups"]) => void,
): GeneratedPuzzle {
  const copy = structuredClone(validPuzzle);
  update(copy.groups);
  return copy;
}

function reply(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    finishReason: { unified: "stop" as const, raw: "stop" },
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 10, text: 10, reasoning: 0 },
    },
    warnings: [],
  };
}

function promptText(model: MockLanguageModelV4, call: number): string {
  return JSON.stringify(model.doGenerateCalls[call].prompt);
}

describe("validateGeneratedPuzzle", () => {
  it("accepts a valid puzzle and assigns difficulty in order", () => {
    const result = validateGeneratedPuzzle(validPuzzle);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.groups.map((group) => group.difficulty)).toEqual([1, 2, 3, 4]);
    expect(result.groups[1].name).toBe("Ord foran «ball»");
  });

  it("lowercases and trims words and capitalises names", () => {
    const result = validateGeneratedPuzzle(
      withGroups((groups) => {
        groups[0].name = "  fisk ";
        groups[0].words = [" Laks", "TORSK", "Sei ", "Ørret"];
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.groups[0].name).toBe("Fisk");
    expect(result.groups[0].words).toEqual(["laks", "torsk", "sei", "ørret"]);
  });

  it("rejects the wrong number of groups", () => {
    const result = validateGeneratedPuzzle({
      groups: validPuzzle.groups.slice(0, 3),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(" ")).toMatch(/fire grupper/);
  });

  it("rejects a group with the wrong number of words", () => {
    const result = validateGeneratedPuzzle(
      withGroups((groups) => groups[2].words.push("lys")),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(" ")).toMatch(/fire ord/);
  });

  it("rejects duplicate words, also when only the case differs", () => {
    const result = validateGeneratedPuzzle(
      withGroups((groups) => (groups[3].words[0] = "Laks")),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(" ")).toMatch(/«laks»/);
  });

  it("rejects words with spaces, digits or too many letters", () => {
    for (const word of ["is krem", "k2", "a".repeat(15)]) {
      const result = validateGeneratedPuzzle(
        withGroups((groups) => (groups[2].words[0] = word)),
      );
      expect(result.ok, word).toBe(false);
    }
  });

  it("allows hyphenated words", () => {
    const result = validateGeneratedPuzzle(
      withGroups((groups) => (groups[2].words[0] = "tv-krem")),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects a group name that contains one of its words", () => {
    const result = validateGeneratedPuzzle(
      withGroups((groups) => (groups[0].name = "Laks og annen fisk")),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(" ")).toMatch(/inneholder ordet/);
  });

  it("rejects a theme from the recent list", () => {
    const result = validateGeneratedPuzzle(validPuzzle, ["fisk"]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(" ")).toMatch(/brukt nylig/);
  });
});

describe("generatePuzzle", () => {
  it("returns the validated groups from the model", async () => {
    const model = new MockLanguageModelV4({ doGenerate: reply(validPuzzle) });

    const result = await generatePuzzle({
      level: "hard",
      model,
      avoidThemes: ["Frukt"],
    });

    expect(result).toMatchObject({ ok: true, attempts: 1 });
    if (result.ok) expect(result.groups).toHaveLength(4);

    const prompt = promptText(model, 0);
    expect(prompt).toContain("Level: hard");
    expect(prompt).toContain("- Frukt");
    expect(prompt).toContain("puzzle editor");
  });

  it("retries with feedback when the answer breaks the rules", async () => {
    const invalid = withGroups((groups) => (groups[3].words[0] = "laks"));
    const model = new MockLanguageModelV4({
      doGenerate: [reply(invalid), reply(validPuzzle)],
    });

    const result = await generatePuzzle({ level: "medium", model });

    expect(result).toMatchObject({ ok: true, attempts: 2 });
    expect(promptText(model, 0)).not.toContain("previous attempt was rejected");
    expect(promptText(model, 1)).toContain("previous attempt was rejected");
    expect(promptText(model, 1)).toContain("«laks»");
  });

  it("retries when the answer does not match the schema", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: [reply({ nope: true }), reply(validPuzzle)],
    });

    const result = await generatePuzzle({ level: "easy", model });

    expect(result).toMatchObject({ ok: true, attempts: 2 });
  });

  it("gives up after the maximum number of attempts", async () => {
    const invalid = { groups: validPuzzle.groups.slice(0, 2) };
    const model = new MockLanguageModelV4({
      doGenerate: [reply(invalid), reply(invalid)],
    });

    const result = await generatePuzzle({ level: "easy", model, maxAttempts: 2 });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/etter 2 forsøk/);
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("stops immediately on a rejected API key", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new APICallError({
          message: "invalid x-api-key",
          url: "https://api.example.test",
          requestBodyValues: {},
          statusCode: 401,
          isRetryable: false,
        });
      },
    });

    const result = await generatePuzzle({ level: "easy", model });

    expect(result).toEqual({
      ok: false,
      error: "AI-tjenesten avviste API-nøkkelen.",
    });
    // One call, no retries: a bad key will not fix itself.
    expect(model.doGenerateCalls).toHaveLength(1);
    spy.mockRestore();
  });
});
