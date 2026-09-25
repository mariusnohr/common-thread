/** Shared form state for the admin server actions and their client forms. */

export type FormState = {
  status: "idle" | "error";
  fieldErrors: Record<string, string>;
  formError?: string;
};

export const EMPTY_FORM_STATE: FormState = {
  status: "idle",
  fieldErrors: {},
};

export type LoginState = {
  error?: string;
};

export const EMPTY_LOGIN_STATE: LoginState = {};
