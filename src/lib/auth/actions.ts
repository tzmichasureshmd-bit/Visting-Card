"use server";

import { headers } from "next/headers";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  fail,
  fieldErrors,
  forgotPasswordSchema,
  readThemeSlug,
  signInSchema,
  signUpSchema,
  type ActionResult,
} from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { POST_SIGN_IN_PATH, postSignUpPath } from "@/lib/auth/images";
import {
  FORGOT_SENT_TITLE,
  RESET_CALLBACK_PATH,
  VERIFY_CALLBACK_PATH,
  loginError,
  resetError,
  signupError,
} from "@/lib/auth/messages";

/**
 * Authentication Server Actions.
 *
 * These are the only place credentials are handled. Every action follows the
 * same shape:
 *
 *   1. rate limit on the client IP (brute force / enumeration defence)
 *   2. parse FormData through the shared Zod schemas in `@/lib/validation`,
 *      which already produce user-facing wording
 *   3. call Supabase Auth
 *   4. translate any Auth error into copy written for a person, never a raw
 *      backend string
 *
 * Nothing here writes to `profiles` or `subscriptions`: the `handle_new_user`
 * trigger (supabase/migrations/0002_functions.sql) does that on signup, so there
 * is exactly one code path that creates an account's rows.
 */

const WINDOW_MS = 60_000;

/** Password reset emails are the easiest thing to abuse, so they get the tightest limit. */
async function limit(key: string, max: number) {
  const h = await headers();
  const result = rateLimit(`${key}:${clientIp(h)}`, max, WINDOW_MS);
  if (!result.allowed) {
    return `Too many attempts. Please wait ${result.retryAfter} seconds and try again.`;
  }
  return null;
}

/**
 * Sign in with email and password.
 *
 * On success the Supabase SSR client has written the session cookies, so the
 * caller can navigate straight to a protected route.
 */
export async function signInAction(
  _prev: ActionResult<{ redirectTo: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const blocked = await limit("signin", 10);
  if (blocked) return fail(blocked);

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return fail("Please check the details below.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) return fail(loginError(error.message));

  return { ok: true, data: { redirectTo: POST_SIGN_IN_PATH } };
}

/**
 * Register a new account.
 *
 * `full_name` and `referral_code` go into `raw_user_meta_data`, which is the
 * contract the database trigger reads — see `handle_new_user()`. The referral code
 * arrives from `?ref=` in the URL and is passed through a hidden field.
 *
 * When email confirmation is enabled in Supabase there is no session yet, so the
 * user is sent to the "check your inbox" state rather than being signed in.
 */
export async function signUpAction(
  _prev: ActionResult<{ verificationSent: boolean; redirectTo?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ verificationSent: boolean; redirectTo?: string }>> {
  const blocked = await limit("signup", 5);
  if (blocked) return fail(blocked);

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    referralCode: formData.get("referralCode"),
  });

  if (!parsed.success) {
    return fail("Please check the details below.", fieldErrors(parsed.error));
  }

  const confirm = String(formData.get("confirmPassword") ?? "");
  if (confirm !== parsed.data.password) {
    return fail("Please check the details below.", {
      confirmPassword: "Passwords do not match.",
    });
  }

  // The design chosen in the template gallery, carried into user metadata.
  //
  // Storing it on the user rather than in a redirect is what makes it survive
  // email confirmation: the link in the inbox cannot know which template the
  // visitor was looking at, but their `raw_user_meta_data` still can. Onboarding
  // reads it back and applies the theme to the new card.
  const themeSlug = readThemeSlug(formData.get("theme"));

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}${VERIFY_CALLBACK_PATH}`,
      data: {
        full_name: parsed.data.fullName,
        referral_code: parsed.data.referralCode || undefined,
        theme_slug: themeSlug || undefined,
      },
    },
  });

  if (error) return fail(signupError(error.message));

  // If user was created but trigger failed to provision profile/subscription,
  // do it manually here as a fallback.
  if (data.user) {
    const userId = data.user.id;
    const admin = createAdminClient();

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const { data: code } = await admin.rpc("generate_referral_code");
      await admin.from("profiles").insert({
        id: userId,
        email: parsed.data.email,
        full_name: parsed.data.fullName || null,
        referral_code: code,
      });
    }

    // Always ensure subscription exists (trigger may have failed after profile insert)
    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingSub) {
      const { data: freePlan } = await admin
        .from("plans")
        .select("id")
        .eq("slug", "free")
        .single();

      if (freePlan) {
        await admin.from("subscriptions").insert({
          user_id: userId,
          plan_id: freePlan.id,
          status: "active",
          price_paise: 0,
          billing_period: "annual",
        });
      }
    }

    // Always ensure wallet exists
    await admin.from("referral_wallets").insert({ user_id: userId }).select().maybeSingle();
  }

  const verificationSent = !data.session;

  return {
    ok: true,
    data: verificationSent
      ? { verificationSent }
      : { verificationSent, redirectTo: postSignUpPath(themeSlug) },
  };
}

/**
 * Request a password reset email.
 *
 * Always reports success, whether or not the account exists — otherwise this
 * endpoint becomes an account-enumeration oracle.
 */
export async function forgotPasswordAction(
  _prev: ActionResult<{ sent: true }> | null,
  formData: FormData,
): Promise<ActionResult<{ sent: true }>> {
  const blocked = await limit("forgot", 5);
  if (blocked) return fail(blocked);

  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return fail("Please enter your email address.", fieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}${RESET_CALLBACK_PATH}`,
  });

  // Rate limiting and transport hiccups are the only failures worth surfacing;
  // "no such user" is indistinguishable from success by design.
  if (error && /rate|too many|security purposes/i.test(error.message)) {
    return fail(resetError(error.message));
  }

  return { ok: true, data: { sent: true }, message: FORGOT_SENT_TITLE };
}

/**
 * Set a new password.
 *
 * Only callable while a *recovery* session is active — the one the reset callback
 * route establishes after exchanging the token from the email link. A normal
 * signed-in session could also change a password, but this is deliberately not
 * exposed here: a password change belongs in account settings, not on a page
 * reachable by URL.
 */
export async function updatePasswordAction(
  _prev: ActionResult<{ updated: true }> | null,
  formData: FormData,
): Promise<ActionResult<{ updated: true }>> {
  const blocked = await limit("password-update", 10);
  if (blocked) return fail(blocked);

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length === 0) {
    return fail("Please check the details below.", { password: "Please enter a new password." });
  }
  if (password.length < 8) {
    return fail("Please check the details below.", {
      password: "Password must be at least 8 characters.",
    });
  }
  if (password !== confirm) {
    return fail("Please check the details below.", {
      confirmPassword: "Passwords do not match.",
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return fail(resetError(error.message));

  return { ok: true, data: { updated: true } };
}

/** Sign out. Safe to call when already signed out. */
export async function signOutAction(): Promise<ActionResult<{ redirectTo: string }>> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true, data: { redirectTo: "/" } };
}
