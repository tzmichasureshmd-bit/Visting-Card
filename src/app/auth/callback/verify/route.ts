import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { POST_SIGN_IN_PATH } from "@/lib/auth/images";

/**
 * Email-confirmation landing route.
 *
 * Supabase's confirm link redirects here with the token in the query string (and
 * older templates use the fragment). `exchangeCodeForSession` turns that into a
 * real session and writes the cookies, so the user lands authenticated.
 *
 * Failure is not punished: the user is sent to /login with a note rather than an
 * error page, because the overwhelmingly common cause is simply clicking the link
 * twice.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=verification", origin));
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL("/login?error=verification", origin));
    }
  } catch {
    return NextResponse.redirect(new URL("/login?error=verification", origin));
  }

  return NextResponse.redirect(new URL(POST_SIGN_IN_PATH, origin));
}
