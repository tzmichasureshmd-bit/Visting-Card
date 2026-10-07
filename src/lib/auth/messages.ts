/**
 * Error-message translation.
 *
 * The brief requires that raw backend errors are never shown. Supabase Auth
 * returns technical strings like "Invalid login credentials" (which is
 * deliberately vague, to stop account enumeration) and "User already registered",
 * neither of which should be rendered verbatim or shown next to a specific field.
 *
 * Every message the app can receive is mapped to copy written for the person
 * signing in. Anything unmapped becomes a neutral fallback, so a future Supabase
 * error string can never leak through to the UI.
 */

const LOGIN: Record<string, string> = {
  "invalid login credentials": "That email or password is incorrect.",
  "email not confirmed": "Please confirm your email address first. Check your inbox for the link.",
  "email invalid": "Please enter a valid email address.",
  "user not found": "That email or password is incorrect.",
};

const SIGNUP: Record<string, string> = {
  "user already registered": "An account with this email already exists. Try signing in instead.",
  "email not confirmed": "Please confirm your email address first. Check your inbox for the link.",
  "email address not allowed": "Please use a different email address.",
  "password should be at least 8 characters": "Please use at least 8 characters.",
  "unable to validate email address": "That email address does not look valid.",
  "signup disabled": "New sign-ups are temporarily unavailable. Please try again shortly.",
  "database error saving new user": "Account setup failed. Please try again in a moment.",
  "unexpected failure": "Something went wrong on our side. Please try again.",
};

const RESET: Record<string, string> = {
  "password should be at least 8 characters": "Please use at least 8 characters.",
  "new password should be different from the old password": "Please choose a password you have not used here before.",
  "password found in dataset of common passwords": "Please choose a less common password.",
  "same as previous password": "Please choose a password you have not used here before.",
  "auth session missing": "This reset link is no longer valid. Please request a new one.",
  "token has expired or is invalid": "This reset link has expired. Please request a new one.",
  otp_expired: "This reset link has expired. Please request a new one.",
};

const RATE_LIMIT = "Too many attempts. Please wait a minute and try again.";

function pick(table: Record<string, string>, raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/\.$/, "");
  return table[key] ?? null;
}

const GENERIC = "Something went wrong. Please try again.";

/** Sign-in failure. */
export function loginError(raw: string): string {
  return pick(LOGIN, raw) ?? GENERIC;
}

/** Sign-up failure. */
export function signupError(raw: string): string {
  if (/rate|too many|security purposes/i.test(raw)) return RATE_LIMIT;
  return pick(SIGNUP, raw) ?? GENERIC;
}

/**
 * Password-reset failure.
 *
 * A rate-limit response is folded in here rather than handled per-call site,
 * because Supabase reports throttling as an ordinary error string and the user
 * should see the same sentence either way.
 */
export function resetError(raw: string): string {
  if (/rate|too many|security purposes/i.test(raw)) return RATE_LIMIT;
  return pick(RESET, raw) ?? GENERIC;
}

/** Default `redirectTo` targets for the email links Supabase sends. */
export function redirectTarget(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL ?? ""}${path}`.replace(/\/+$/, "");
}

/** Shared wording for the confirmation screen after a reset email is sent. */
export const FORGOT_SENT_TITLE = "Check your inbox";
export const FORGOT_SENT_BODY =
  "If an account exists for that email, a reset link is on its way. The link expires in one hour.";

export const RESET_SUCCESS_TITLE = "Password updated successfully.";
export const RESET_SUCCESS_BODY = "You can now sign in with your new password.";

/** Shown when a user arrives at /reset-password without a valid recovery session. */
export const RESET_EXPIRED_TITLE = "This link is no longer valid";
export const RESET_EXPIRED_BODY =
  "Reset links expire after an hour and can only be used once. Request a new one to continue.";

/**
 * Maps the recovery token from the email link onto a route the user can reach.
 *
 * The callback exchanges the token server-side and redirects to `/reset-password`
 * with the resulting session already in cookies, so the form itself never handles
 * a URL fragment.
 */
export const RESET_CALLBACK_PATH = "/auth/callback/reset";

/** Where a confirmed email address should land. */
export const VERIFY_CALLBACK_PATH = "/auth/callback/verify";

/** Friendly alias used by the auth shell for error text tone. */
export const errorTone = "danger" as const;
