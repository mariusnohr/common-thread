import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AiProvider = "anthropic" | "openai";

export type ModelSpec = {
  provider: AiProvider;
  modelId: string;
};

/**
 * Used when `AI_MODEL` only names a provider or is not set at all. Set
 * `AI_MODEL` explicitly to pin a model.
 */
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-5.5",
};

const API_KEY_VARS: Record<AiProvider, string> = {
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
};

/** A missing or malformed AI configuration. The message is shown in admin. */
export class AiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiConfigError";
  }
}

type Env = Record<string, string | undefined>;

function isProvider(value: string): value is AiProvider {
  return value === "anthropic" || value === "openai";
}

function hasKey(env: Env, provider: AiProvider): boolean {
  return Boolean(env[API_KEY_VARS[provider]]?.trim());
}

/**
 * Reads the model choice from the environment.
 *
 * - `AI_MODEL=anthropic:claude-sonnet-5` or `AI_MODEL=openai:gpt-5.5` picks
 *   a provider and model.
 * - `AI_MODEL=anthropic` / `AI_MODEL=openai` uses that provider's default.
 * - Without `AI_MODEL`, whichever API key is set decides (Anthropic first).
 */
export function parseModelSpec(env: Env = process.env): ModelSpec {
  const raw = env.AI_MODEL?.trim();

  if (!raw) {
    const provider = (["anthropic", "openai"] as const).find((candidate) =>
      hasKey(env, candidate),
    );
    if (!provider) {
      throw new AiConfigError(
        "AI er ikke satt opp. Legg inn ANTHROPIC_API_KEY eller OPENAI_API_KEY.",
      );
    }
    return { provider, modelId: DEFAULT_MODELS[provider] };
  }

  const separator = raw.indexOf(":");
  const providerPart = (separator === -1 ? raw : raw.slice(0, separator))
    .trim()
    .toLowerCase();
  const modelPart = separator === -1 ? "" : raw.slice(separator + 1).trim();

  if (!isProvider(providerPart)) {
    throw new AiConfigError(
      "AI_MODEL må starte med «anthropic:» eller «openai:», f.eks. anthropic:claude-sonnet-5.",
    );
  }
  if (!hasKey(env, providerPart)) {
    throw new AiConfigError(
      `AI_MODEL bruker ${providerPart}, men ${API_KEY_VARS[providerPart]} mangler.`,
    );
  }

  return {
    provider: providerPart,
    modelId: modelPart || DEFAULT_MODELS[providerPart],
  };
}

/** Human-readable `provider:model`, for logs and the admin UI. */
export function formatModelSpec(spec: ModelSpec): string {
  return `${spec.provider}:${spec.modelId}`;
}

/** Whether generation is configured, for the admin UI. Never throws. */
export function describeAiConfig(
  env: Env = process.env,
): { ok: true; label: string } | { ok: false; error: string } {
  try {
    return { ok: true, label: formatModelSpec(parseModelSpec(env)) };
  } catch (error) {
    if (error instanceof AiConfigError) return { ok: false, error: error.message };
    throw error;
  }
}

/**
 * Builds the language model from the environment. API keys are passed
 * explicitly so nothing depends on the providers' own env lookups.
 */
export function resolveModel(env: Env = process.env): {
  model: LanguageModel;
  spec: ModelSpec;
} {
  const spec = parseModelSpec(env);
  const apiKey = env[API_KEY_VARS[spec.provider]]?.trim();

  const model =
    spec.provider === "anthropic"
      ? createAnthropic({ apiKey })(spec.modelId)
      : createOpenAI({ apiKey })(spec.modelId);

  return { model, spec };
}
