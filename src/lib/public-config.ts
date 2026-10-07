/**
 * Public configuration. Safe to reference from Client Components.
 *
 * Every key here is `NEXT_PUBLIC_`-prefixed, so Next.js inlines them at build
 * time as complete static expressions — which is why this is an explicit object
 * literal rather than a dynamic `process.env[key]` lookup.
 *
 * This lives in its own module on purpose: `@/lib/env` imports `server-only`, and
 * a single `server-only` dependency anywhere in the import graph is enough to
 * make Turbopack refuse to ship the module to the browser. Anything a Client
 * Component needs to read must come from here instead of from `env.ts`.
 */
export const publicConfig = {
  appUrl: (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  ),
  /**
   * The address shown everywhere the site asks someone to get in touch — the
   * contact page, the legal pages, the publish panel and the footer.
   *
   * One value, read from the environment, so a real address is configured rather
   * than hardcoded in six pages. The default matches the company the product is
   * sold as; override it with `NEXT_PUBLIC_SUPPORT_EMAIL` to point somewhere else.
   */
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@tzmicha.com",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};