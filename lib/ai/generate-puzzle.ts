import {
  APICallError,
  generateText,
  NoObjectGeneratedError,
  Output,
  RetryError,
  type LanguageModel,
} from "ai";
import { z } from "zod";
import { puzzleSchema } from "@/lib/puzzle/schema";
import type {
  Difficulty,
  PuzzleGroupData,
  PuzzleLevel,
} from "@/lib/puzzle/types";
import { AiConfigError } from "./model";
import {
  buildPuzzlePrompt,
  MAX_WORD_LENGTH,
  PUZZLE_SYSTEM_PROMPT,
} from "./puzzle-prompt";

/**
 * What the model is asked to return. Deliberately loose (no array lengths):
 * providers differ in which JSON-schema constraints they accept, so the
 * exact rules are enforced by `validateGeneratedPuzzle` instead, and a
 * violation triggers a retry with feedback.
 */
export const generatedPuzzleSchema = z.object({
  groups: z
    .array(
      z.object({
        name: z
          .string()
          .describe("Short Norwegian group name stating the connection"),
        words: z
          .array(z.string())
          .describe("Exactly four lowercase Norwegian words"),
      }),
    )
    .describe("Exactly four groups, ordered from easiest to hardest"),
});

export type GeneratedPuzzle = z.infer<typeof generatedPuzzleSchema>;

export type ValidationResult =
  | { ok: true; groups: PuzzleGroupData[] }
  | { ok: false; problems: string[] };

const GROUP_COUNT = 4;
const WORDS_PER_GROUP = 4;
const MAX_NAME_LENGTH = 40;
const WORD_PATTERN = /^\p{L}+(?:-\p{L}+)*$/u;

function normalizeWord(word: string): string {
  return word.trim().replace(/\s+/g, " ").toLocaleLowerCase("nb-NO");
}

function normalizeName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  return trimmed.charAt(0).toLocaleUpperCase("nb-NO") + trimmed.slice(1);
}

function nameTokens(name: string): string[] {
  return name
    .toLocaleLowerCase("nb-NO")
    .split(/[^\p{L}-]+/u)
    .filter(Boolean);
}

/**
 * Normalises a model answer (trim, lowercase words, capitalised names) and
 * checks it against the hard rules in `puzzle-prompt.ts`. Problems are
 * written in Norwegian: they are shown in admin and fed back to the model on
 * the next attempt.
 */
export function validateGeneratedPuzzle(
  raw: GeneratedPuzzle,
  avoidThemes: string[] = [],
): ValidationResult {
  const problems: string[] = [];

  if (raw.groups.length !== GROUP_COUNT) {
    problems.push(
      `Oppgaven må ha nøyaktig fire grupper, men hadde ${raw.groups.length}.`,
    );
  }

  const groups: PuzzleGroupData[] = raw.groups
    .slice(0, GROUP_COUNT)
    .map((group, index) => ({
      difficulty: (index + 1) as Difficulty,
      name: normalizeName(group.name),
      words: group.words.map(normalizeWord),
    }));

  const recent = new Set(
    avoidThemes.map((theme) => theme.trim().toLocaleLowerCase("nb-NO")),
  );
  const seenNames = new Set<string>();
  const seenWords = new Map<string, number>();

  for (const group of groups) {
    const label = group.name || `gruppe ${group.difficulty}`;
    const lowerName = group.name.toLocaleLowerCase("nb-NO");

    if (!group.name) {
      problems.push(`Gruppe ${group.difficulty} mangler navn.`);
    } else if (group.name.length > MAX_NAME_LENGTH) {
      problems.push(`Gruppenavnet «${group.name}» er for langt.`);
    }
    if (group.name && seenNames.has(lowerName)) {
      problems.push(`Gruppenavnet «${group.name}» er brukt to ganger.`);
    }
    seenNames.add(lowerName);
    if (group.name && recent.has(lowerName)) {
      problems.push(`Temaet «${group.name}» er brukt nylig.`);
    }

    if (group.words.length !== WORDS_PER_GROUP) {
      problems.push(
        `Gruppen «${label}» må ha nøyaktig fire ord, men hadde ${group.words.length}.`,
      );
    }

    const tokens = new Set(nameTokens(group.name));
    for (const word of group.words) {
      seenWords.set(word, (seenWords.get(word) ?? 0) + 1);

      if (!word) {
        problems.push(`Gruppen «${label}» har et tomt ord.`);
      } else if (!WORD_PATTERN.test(word)) {
        problems.push(
          `«${word}» må være ett ord med bare bokstaver (bindestrek er lov).`,
        );
      } else if (word.length > MAX_WORD_LENGTH) {
        problems.push(
          `«${word}» er lengre enn ${MAX_WORD_LENGTH} tegn.`,
        );
      }
      if (word && tokens.has(word)) {
        problems.push(`Gruppenavnet «${group.name}» inneholder ordet «${word}».`);
      }
    }
  }

  for (const [word, count] of seenWords) {
    if (word && count > 1) {
      problems.push(`Ordet «${word}» er brukt mer enn én gang.`);
    }
  }

  // Backstop: the same schema the admin form and `savePuzzle` use.
  if (problems.length === 0) {
    const parsed = puzzleSchema.safeParse({ groups });
    if (!parsed.success) {
      problems.push(
        ...parsed.error.issues.map((issue) => issue.message),
      );
    }
  }

  return problems.length > 0 ? { ok: false, problems } : { ok: true, groups };
}

export type GeneratePuzzleOptions = {
  level: PuzzleLevel;
  model: LanguageModel;
  /** Recent group names the model should not repeat. */
  avoidThemes?: string[];
  /** Attempts before giving up on invalid answers. */
  maxAttempts?: number;
  /** Per-attempt timeout. */
  timeoutMs?: number;
};

export type GeneratePuzzleResult =
  | { ok: true; groups: PuzzleGroupData[]; attempts: number }
  | { ok: false; error: string };

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 180_000;

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

/** A readable message for errors that retrying the prompt will not fix. */
function fatalErrorMessage(error: unknown): string | null {
  if (error instanceof AiConfigError) return error.message;

  const apiError = RetryError.isInstance(error)
    ? error.lastError
    : error;
  if (APICallError.isInstance(apiError)) {
    if (apiError.statusCode === 401 || apiError.statusCode === 403) {
      return "AI-tjenesten avviste API-nøkkelen.";
    }
    if (apiError.statusCode === 404) {
      return "AI-tjenesten fant ikke modellen. Sjekk AI_MODEL.";
    }
    if (apiError.statusCode === 429) {
      return "AI-tjenesten har for mange forespørsler akkurat nå. Prøv igjen om litt.";
    }
    return `AI-tjenesten svarte med en feil${apiError.statusCode ? ` (${apiError.statusCode})` : ""}.`;
  }
  if (RetryError.isInstance(error)) {
    return "AI-tjenesten svarte ikke. Prøv igjen om litt.";
  }
  if (isTimeout(error)) {
    return "AI-tjenesten brukte for lang tid. Prøv igjen.";
  }
  return null;
}

/**
 * Asks the model for a puzzle at `level` and validates the answer. Invalid
 * answers are retried with the problems fed back to the model; provider
 * errors (bad key, unknown model, rate limit) stop immediately. Nothing is
 * written to the database here.
 */
export async function generatePuzzle({
  level,
  model,
  avoidThemes = [],
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: GeneratePuzzleOptions): Promise<GeneratePuzzleResult> {
  let feedback: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let raw: GeneratedPuzzle;
    try {
      const result = await generateText({
        model,
        instructions: PUZZLE_SYSTEM_PROMPT,
        prompt: buildPuzzlePrompt({ level, avoidThemes, feedback }),
        output: Output.object({
          schema: generatedPuzzleSchema,
          name: "puzzle",
          description: "A Common Thread puzzle: four groups of four words.",
        }),
        timeout: timeoutMs,
      });
      raw = result.output;
    } catch (error) {
      const fatal = fatalErrorMessage(error);
      if (fatal) {
        console.error("Puzzle generation failed", error);
        return { ok: false, error: fatal };
      }
      if (NoObjectGeneratedError.isInstance(error)) {
        feedback =
          "Svaret var ikke gyldig JSON med fire grupper (name, words).";
        continue;
      }
      console.error("Puzzle generation failed", error);
      return { ok: false, error: "Noe gikk galt under genereringen." };
    }

    const validation = validateGeneratedPuzzle(raw, avoidThemes);
    if (validation.ok) {
      return { ok: true, groups: validation.groups, attempts: attempt };
    }
    feedback = validation.problems.join(" ");
  }

  return {
    ok: false,
    error: `Fikk ikke en gyldig oppgave etter ${maxAttempts} forsøk. Siste feil: ${feedback ?? "ukjent"}`,
  };
}
