import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { serverConfig } from "@/lib/env";

/**
 * Session helpers for protected routes.
 *
 * Deliberately small: `requireUser()` is the whole gate. It is called at the top
 * of a Server Component, so an anonymous visitor is redirected before any data
 * query runs — the query is then safe to write without re-checking ownership,
 * because RLS (`profiles_select_self`, `cards_read`) is the second line of
 * defence, not the first.
 *
 * When Supabase is not configured (a fresh clone with no `.env.local`) this
 * cannot authenticate anyone, so it also redirects rather than throwing a
 * `MissingEnvError` at a reviewer who only wanted to see the site.
 */
export async function requireUser(): Promise<{ id: string; email: string }> {
  if (!serverConfig.isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");

  return { id: data.user.id, email: data.user.email ?? "" };
}

/**
 * Same as `requireUser()` but for routes that must be *anonymous* — /login,
 * /signup. A signed-in user landing here is sent onward instead of being shown a
 * form they have already completed.
 *
 * Reads the cookie rather than calling `getUser()`. This is a convenience
 * redirect, not a security boundary — a wrong answer just means the visitor sees
 * a login form — and skipping the round trip keeps the sign-in page as fast as
 * possible. `proxy.ts` has already revalidated the token on this request, and the
 * pages that matter still use `requireUser()`.
 */
export async function requireGuest(redirectTo: string): Promise<void> {
  if (!serverConfig.isSupabaseConfigured) return;

  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session) redirect(redirectTo);
}

/**
 * Gate for staff-only routes.
 *
 * Two steps, in this order, because they fail differently and the difference
 * matters to an admin:
 *
 *  1. Authentication — an anonymous visitor is sent to `/login`, since they might
 *     simply need an account.
 *  2. Authorisation — a signed-in user without the flag is sent to their
 *     dashboard, *not* shown an error. The `role` column on `profiles` is read
 *     directly rather than calling the `is_admin()` SQL function, because that
 *     function is `security definer` and exists for RLS policies; the server
 *     component has a real service-agnostic session and the row read is honest
 *     about what it checked.
 *
 * A non-admin reaching this returns a redirect, so there is no admin UI to hide in
 * the first place — the page's data queries never run for them.
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  if (!serverConfig.isSupabaseConfigured) redirect("/login");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  return { id: data.user.id, email: data.user.email ?? "" };
}
