import { NextResponse, type NextRequest } from "next/server";

import { createServerClient } from "@supabase/ssr";

import { serverConfig } from "@/lib/env";

/**
 * Supabase session refresh.
 *
 * Next.js 16: `middleware.ts` is now `proxy.ts`. This runs on the Node runtime.
 *
 * The refresh pass is mandatory, not an optimisation — @supabase/ssr stores the
 * session in cookies with a short expiry, and if nothing calls
 * `getUser()`/revalidates on each request the user is signed out at the end of
 * the access token's life with no way to notice. Calling `getUser()` here also
 * means Server Components and Server Actions downstream always see a fresh
 * session.
 *
 * Public routes are still refreshed (so a signed-in user visiting /login is
 * recognised) — the matcher is narrow purely to avoid doing this work for static
 * assets.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // No credentials: skip entirely rather than constructing a client that would
  // throw. Lets the marketing pages render in a fresh checkout.
  if (!serverConfig.isSupabaseConfigured) {
    response.headers.set("x-pathname", request.nextUrl.pathname);
    return response;
  }

  const supabase = createServerClient(
    serverConfig.supabaseUrl,
    serverConfig.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the request so downstream Server Components see the new
          // values in this same pass.
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          // And onto the response, so the browser actually stores them.
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser()` revalidates with the auth server. `getSession()` alone would only
  // read the cookie and would happily trust a stale or tampered payload.
  await supabase.auth.getUser();

  // Expose the pathname to Server Components via a request header so layouts
  // can conditionally skip the app shell (e.g. the full-screen card builder).
  response.headers.set("x-pathname", request.nextUrl.pathname);

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - _next/static, _next/image (build output)
     *  - favicon and other static files
     *  - the analytics beacon, which is unauthenticated by design
     */
    "/((?!_next/static|_next/image|favicon.ico|api/track|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
