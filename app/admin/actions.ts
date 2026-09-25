"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  verifyPassword,
  verifySessionToken,
} from "@/lib/auth/session";
import { generatePuzzle } from "@/lib/ai/generate-puzzle";
import { AiConfigError, formatModelSpec, resolveModel } from "@/lib/ai/model";
import { isPuzzleLevel, LEVEL_LABELS } from "@/lib/puzzle/levels";
import {
  isValidPublishDate,
  savePuzzle,
  setPuzzleStatus,
} from "@/lib/puzzle/mutations";
import {
  findPuzzleId,
  getPuzzleById,
  listRecentGroupNames,
} from "@/lib/puzzle/queries";
import { puzzleSchema } from "@/lib/puzzle/schema";
import type {
  Difficulty,
  PuzzleGroupData,
  PuzzleLevel,
  PuzzleStatus,
} from "@/lib/puzzle/types";
import type { FormState, LoginState } from "./form-state";

/** How many recent puzzles' group names the generator is told to avoid. */
const AVOID_RECENT_PUZZLES = 45;

const GROUP_COUNT = 4;
const WORDS_PER_GROUP = 4;

const STATUSES: readonly PuzzleStatus[] = ["suggested", "draft", "approved"];

/**
 * Every admin action re-checks the session itself: middleware is only a first
 * line of defence, and server actions are separate HTTP endpoints.
 */
async function assertSession(): Promise<void> {
  const store = await cookies();
  if (!verifySessionToken(store.get(SESSION_COOKIE_NAME)?.value)) {
    redirect("/admin/login");
  }
}

function collectFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "groups";
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

function parsePuzzleForm(formData: FormData): {
  groups: PuzzleGroupData[];
  publishDate: string;
  level: string;
  status: string;
  rawId: string;
} {
  const groups: PuzzleGroupData[] = [];
  for (let groupIndex = 0; groupIndex < GROUP_COUNT; groupIndex += 1) {
    const name = String(formData.get(`groups.${groupIndex}.name`) ?? "").trim();
    const words: string[] = [];
    for (let wordIndex = 0; wordIndex < WORDS_PER_GROUP; wordIndex += 1) {
      words.push(
        String(formData.get(`groups.${groupIndex}.words.${wordIndex}`) ?? "").trim(),
      );
    }
    groups.push({ difficulty: (groupIndex + 1) as Difficulty, name, words });
  }

  return {
    groups,
    publishDate: String(formData.get("publishDate") ?? "").trim(),
    level: String(formData.get("level") ?? ""),
    status: String(formData.get("status") ?? ""),
    rawId: String(formData.get("id") ?? "").trim(),
  };
}

/** Signs the admin in and redirects to the overview. */
export async function login(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = formData.get("password");
  if (typeof password !== "string" || !verifyPassword(password)) {
    return { error: "Feil passord." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, createSessionToken(), sessionCookieOptions());
  redirect("/admin");
}

/** Clears the session cookie. */
export async function logout(): Promise<void> {
  await assertSession();

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  redirect("/admin/login");
}

/**
 * Creates or updates a puzzle. Validation failures come back keyed by field
 * (e.g. `groups.2.words.1`) so the form can show them in place, and nothing is
 * written until everything is valid.
 */
export async function savePuzzleAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSession();

  const { groups, publishDate, level, status, rawId } =
    parsePuzzleForm(formData);

  const fieldErrors: Record<string, string> = {};
  if (!isValidPublishDate(publishDate)) {
    fieldErrors.publishDate = "Datoen må være en gyldig dato (ÅÅÅÅ-MM-DD).";
  }
  if (!isPuzzleLevel(level)) {
    fieldErrors.level = "Velg et gyldig nivå.";
  }
  if (!STATUSES.includes(status as PuzzleStatus)) {
    fieldErrors.status = "Velg en gyldig status.";
  }

  const parsed = puzzleSchema.safeParse({ groups });
  if (!parsed.success) {
    Object.assign(fieldErrors, collectFieldErrors(parsed.error));
  }

  const id = rawId === "" ? undefined : Number(rawId);
  if (id !== undefined && (!Number.isInteger(id) || id <= 0)) {
    fieldErrors.id = "Ugyldig oppgave.";
  }

  if (Object.keys(fieldErrors).length > 0 || !parsed.success) {
    return { status: "error", fieldErrors };
  }

  const result = await savePuzzle({
    id,
    publishDate,
    level: level as PuzzleLevel,
    status: status as PuzzleStatus,
    groups: parsed.data.groups,
  });

  if (!result.ok) {
    return { status: "error", fieldErrors: {}, formError: result.error };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

function formError(message: string): FormState {
  return { status: "error", fieldErrors: {}, formError: message };
}

/**
 * Generates a puzzle with the configured AI model and saves it as
 * `suggested`, then opens it in the editor for review. Nothing goes live until
 * it is approved.
 *
 * - Without `id`: fills an empty `(publishDate, level)` slot.
 * - With `id`: replaces the groups of an existing puzzle that is not approved
 *   (keeping its date and level).
 */
export async function generatePuzzleAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSession();

  const rawId = String(formData.get("id") ?? "").trim();
  let id: number | undefined;
  let publishDate: string;
  let level: PuzzleLevel;

  if (rawId !== "") {
    id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) return formError("Ugyldig oppgave.");

    const existing = await getPuzzleById(id);
    if (!existing) return formError("Fant ikke oppgaven.");
    if (existing.status === "approved") {
      return formError(
        "Godkjente oppgaver kan ikke genereres på nytt. Sett den til utkast først.",
      );
    }
    publishDate = existing.publishDate;
    level = existing.level;
  } else {
    publishDate = String(formData.get("publishDate") ?? "").trim();
    const rawLevel = String(formData.get("level") ?? "");

    const fieldErrors: Record<string, string> = {};
    if (!isValidPublishDate(publishDate)) {
      fieldErrors.publishDate = "Datoen må være en gyldig dato (ÅÅÅÅ-MM-DD).";
    }
    if (!isPuzzleLevel(rawLevel)) fieldErrors.level = "Velg et gyldig nivå.";
    if (Object.keys(fieldErrors).length > 0 || !isPuzzleLevel(rawLevel)) {
      return { status: "error", fieldErrors };
    }
    level = rawLevel;

    // Check before calling the model so a taken slot costs no tokens.
    if ((await findPuzzleId(publishDate, level)) !== null) {
      return formError(
        `Det finnes allerede en oppgave på nivå «${LEVEL_LABELS[level].toLowerCase()}» ${publishDate}. Åpne den for å generere på nytt.`,
      );
    }
  }

  let resolved: ReturnType<typeof resolveModel>;
  try {
    resolved = resolveModel();
  } catch (error) {
    if (error instanceof AiConfigError) return formError(error.message);
    throw error;
  }

  const avoidThemes = await listRecentGroupNames(AVOID_RECENT_PUZZLES, id);
  const generated = await generatePuzzle({
    level,
    model: resolved.model,
    avoidThemes,
  });
  if (!generated.ok) return formError(generated.error);

  console.info(
    `Generated ${level} puzzle for ${publishDate} with ${formatModelSpec(resolved.spec)} in ${generated.attempts} attempt(s)`,
  );

  const saved = await savePuzzle({
    id,
    publishDate,
    level,
    status: "suggested",
    groups: generated.groups,
  });
  if (!saved.ok) return formError(saved.error);

  revalidatePath("/admin");
  redirect(`/admin/puzzles/${saved.id}?generert=1`);
}

/** Approves, drafts or marks a puzzle as suggested from the overview. */
export async function setStatusAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertSession();

  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "");

  const result = await setPuzzleStatus(id, status as PuzzleStatus);
  if (!result.ok) {
    return { status: "error", fieldErrors: {}, formError: result.error };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { status: "idle", fieldErrors: {} };
}
