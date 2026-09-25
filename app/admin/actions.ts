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
import {
  isValidPublishDate,
  savePuzzle,
  setPuzzleStatus,
} from "@/lib/puzzle/mutations";
import { puzzleSchema } from "@/lib/puzzle/schema";
import type {
  Difficulty,
  PuzzleGroupData,
  PuzzleStatus,
} from "@/lib/puzzle/types";
import type { FormState, LoginState } from "./form-state";

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

  const { groups, publishDate, status, rawId } = parsePuzzleForm(formData);

  const fieldErrors: Record<string, string> = {};
  if (!isValidPublishDate(publishDate)) {
    fieldErrors.publishDate = "Datoen må være en gyldig dato (ÅÅÅÅ-MM-DD).";
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
