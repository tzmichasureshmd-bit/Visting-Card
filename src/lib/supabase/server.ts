import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { serverConfig } from "@/lib/env";

/**
 * Request-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers.
 *
 * Next.js 16: `cookies()` returns a Promise and must be awaited.
 *
 * The `setAll` callback is how @supabase/ssr refreshes the auth token. Next.js
 * only permits cookie mutation in a Server Action or Route Handler, so during a
 * plain Server Component render it throws — that is expected and we swallow it
 * here, because the refreshed value is persisted by the `proxy.ts` pass that
 * runs before the render (see `updateSession`).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    serverConfig.supabaseUrl,
    serverConfig.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Read-only context (Server Component render). The proxy already
            // wrote refreshed cookies; nothing further to do here.
          }
        },
      },
    },
  );
}

/**
 * Anonymous, cookie-free client.
 *
 * For public read and ingest paths — the card renderer and the analytics beacon —
 * where the request carries no session and must not read or refresh auth cookies.
 * Keeping this separate matters for two reasons: it avoids a cookie write attempt
 * on a route that has no business setting cookies, and it keeps the anon key out
 * of any request-scoped auth state.
 */
export async function createPublicClient() {
  return createSupabaseClient(serverConfig.supabaseUrl, serverConfig.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * Service-role client. Bypasses RLS and therefore must only ever be created
 * after an explicit authorization check inside a Server Action or Route Handler.
 */
export function createAdminClient() {
  return createSupabaseClient(serverConfig.supabaseUrl, serverConfig.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}