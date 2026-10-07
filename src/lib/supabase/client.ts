"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for Client Components.
 *
 * This uses the anon key only. Row Level Security is the authority here — the
 * database rejects anything the signed-in user is not entitled to, so a
 * compromised browser cannot reach another tenant's rows.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}