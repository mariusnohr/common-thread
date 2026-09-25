import { describe, expect, it } from "vitest";
import {
  AiConfigError,
  DEFAULT_MODELS,
  describeAiConfig,
  parseModelSpec,
  resolveModel,
} from "./model";

describe("parseModelSpec", () => {
  it("reads provider and model from AI_MODEL", () => {
    expect(
      parseModelSpec({
        AI_MODEL: "openai:gpt-5.5-mini",
        OPENAI_API_KEY: "sk-test",
      }),
    ).toEqual({ provider: "openai", modelId: "gpt-5.5-mini" });
  });

  it("uses the provider default when AI_MODEL only names a provider", () => {
    expect(
      parseModelSpec({ AI_MODEL: "Anthropic", ANTHROPIC_API_KEY: "key" }),
    ).toEqual({ provider: "anthropic", modelId: DEFAULT_MODELS.anthropic });
  });

  it("keeps colons inside the model id", () => {
    expect(
      parseModelSpec({
        AI_MODEL: "openai:ft:gpt-5.5:my-org:puzzles",
        OPENAI_API_KEY: "sk-test",
      }).modelId,
    ).toBe("ft:gpt-5.5:my-org:puzzles");
  });

  it("picks the provider whose key is set when AI_MODEL is missing", () => {
    expect(parseModelSpec({ OPENAI_API_KEY: "sk-test" })).toEqual({
      provider: "openai",
      modelId: DEFAULT_MODELS.openai,
    });
    expect(
      parseModelSpec({ OPENAI_API_KEY: "sk-test", ANTHROPIC_API_KEY: "key" })
        .provider,
    ).toBe("anthropic");
  });

  it("fails without any API key", () => {
    expect(() => parseModelSpec({})).toThrow(AiConfigError);
    expect(() => parseModelSpec({ ANTHROPIC_API_KEY: "  " })).toThrow(
      AiConfigError,
    );
  });

  it("fails for an unknown provider", () => {
    expect(() =>
      parseModelSpec({ AI_MODEL: "gemini:pro", OPENAI_API_KEY: "sk-test" }),
    ).toThrow(/anthropic:|openai:/);
  });

  it("fails when the chosen provider has no key", () => {
    expect(() =>
      parseModelSpec({ AI_MODEL: "openai:gpt-5.5", ANTHROPIC_API_KEY: "key" }),
    ).toThrow(/OPENAI_API_KEY/);
  });
});

describe("describeAiConfig", () => {
  it("returns the model label when configured", () => {
    expect(
      describeAiConfig({ AI_MODEL: "anthropic:claude-x", ANTHROPIC_API_KEY: "k" }),
    ).toEqual({ ok: true, label: "anthropic:claude-x" });
  });

  it("returns the configuration error instead of throwing", () => {
    const result = describeAiConfig({});
    expect(result.ok).toBe(false);
  });
});

describe("resolveModel", () => {
  it("builds a model for the configured provider without calling it", () => {
    const { model, spec } = resolveModel({
      AI_MODEL: "openai:gpt-5.5",
      OPENAI_API_KEY: "sk-test",
    });

    expect(spec).toEqual({ provider: "openai", modelId: "gpt-5.5" });
    expect(typeof model === "object" && model.modelId).toBe("gpt-5.5");
  });
});
