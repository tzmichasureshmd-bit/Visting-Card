import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Password-reset landing route.
 *
 * The reset email's `redirectTo` points here. Supabase appends a `code`; this
 * exchanges it for a *recovery* session and forwards to `/reset-password`, which
 * renders the new-password form only because that session is present.
 *
 * Note this deliberately does not sign the user in properly — a recovery session
 * is scoped so it can only change the password. Once `updateUser({ password })`
 * succeeds, `/reset-password` sends them to /login to establish a normal session.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  const failure = new URL("/reset-password?expired=1", origin);

  if (!code) return NextResponse.redirect(failure);

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) return NextResponse.redirect(failure);
  } catch {
    return NextResponse.redirect(failure);
  }

  return NextResponse.redirect(new URL("/reset-password", origin));
}
