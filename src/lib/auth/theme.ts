import { cookies } from "next/headers";

/**
 * Dark-mode detection for the auth routes.
 *
 * The auth card uses fixed light/dark surfaces rather than the app's `--surface`
 * tokens, because the text sits on a photograph that does not change with the
 * theme. That means the server has to know which mode to render, and the cookie
 * is the only source available during a Server Component render — the
 * `next-themes` class is written client-side.
 *
 * Falls back to dark, because these pages always sit over a dark photograph and
 * white text is the safe default if the cookie is absent.
 */
export async function isDarkMode(): Promise<boolean> {
  const store = await cookies();
  const theme = store.get("theme")?.value;
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return true;
}
