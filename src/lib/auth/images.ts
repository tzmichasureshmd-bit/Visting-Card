/**
 * Authentication art direction.
 *
 * ONE place to swap the artwork AND the per-page identity. Every auth route
 * reads its background, accent colour, layout and editorial copy from here, so
 * replacing the photography later means dropping files into
 * `public/images/auth/` and changing four `src` strings — no component edits.
 *
 * The paths below point at JPG placeholders that ship with the repo (smooth
 * gradient fields, generated at 1920×1280). They are real files, so layout,
 * contrast and `object-fit` behaviour can be reviewed today. Final photography
 * only has to replace the file: keeping the same base names means the filename
 * is the only thing that changes.
 *
 * Each page is deliberately distinct — different hue, different composition,
 * different copy — while `AUTH_TAGLINE`, the card and the header keep the DV
 * brand consistent across all four.
 *
 * `alt` is empty on purpose: a decorative background must never be announced,
 * and the card's own heading already identifies the page.
 */

export type AuthVariant = "login" | "signup" | "forgot" | "reset";

export interface AuthImage {
  /** Path under /public. */
  src: string;
  /**
   * Focal point for `object-position`, as a CSS keyword pair.
   *
   * Photography is cropped differently per viewport — a 21:9 desktop crop and a
   * 9:16 phone crop cannot share a centre point — so this is per-page rather
   * than global.
   */
  position: string;
  /**
   * Overlay strength, 0 to 1.
   *
   * Tuned per image so the artwork stays clearly visible (brief: no flat black
   * wash) while form labels keep a 4.5:1 contrast ratio. Raise this if a future
   * photograph is brighter than the placeholder.
   */
  overlay: number;
  /** Whether the overlay is dark or light, for images with a pale subject. */
  overlayTone: "dark" | "light";
  /** Radial vignette strength, 0 to 1. Darkens the edges behind the card. */
  vignette: number;

  /**
   * Composition.
   *
   * `split` puts the editorial statement beside the card (wide screens; they
   * stack on phones). `centered` is the quieter single-column arrangement used
   * by the two one-field recovery pages.
   */
  layout: "split" | "centered";
  /** Which side the statement sits on in a split layout. */
  side: "left" | "right";

  /**
   * Per-page accent, in both themes.
   *
   * `light` / `dark` are the solid colour used inside the card (focus borders,
   * labels, link accents) where the surface flips with the theme; the statement
   * always sits on the photograph and therefore always uses `dark`.
   */
  accent: { light: string; dark: string };
  /** Same accent as an rgba glow, used for the focus ring and card bloom. */
  ring: { light: string; dark: string };
  /** Two hues for the floating background orbs. */
  orbs: [string, string];

  /** Editorial copy beside the card: an index, a display line and one sub-line. */
  index: string;
  lead: string;
  /** The one word set in the serif italic accent. */
  emphasis: string;
  rest: string;
  sub: string;
}

export const AUTH_IMAGES: Record<AuthVariant, AuthImage> = {
  // 01 — Sign in. Cool navy/indigo, statement left: calm and familiar.
  login: {
    src: "/images/auth/login.jpg",
    position: "center 45%",
    overlay: 0.26,
    overlayTone: "dark",
    vignette: 0.4,
    layout: "split",
    side: "left",
    accent: { light: "#4f46e5", dark: "#a5b4fc" },
    ring: { light: "rgba(79, 70, 229, 0.18)", dark: "rgba(165, 180, 252, 0.22)" },
    orbs: ["#6366f1", "#38bdf8"],
    index: "01 — Sign in",
    lead: "Your card is ",
    emphasis: "waiting",
    rest: ".",
    sub: "Sign in to pick up where you left off.",
  },
  // 02 — Create account. Warm plum/rose, statement right: open and inviting.
  signup: {
    src: "/images/auth/signup.jpg",
    position: "center 40%",
    overlay: 0.24,
    overlayTone: "dark",
    vignette: 0.44,
    layout: "split",
    side: "right",
    accent: { light: "#e11d48", dark: "#fda4af" },
    ring: { light: "rgba(225, 29, 72, 0.18)", dark: "rgba(253, 164, 175, 0.22)" },
    orbs: ["#f43f5e", "#a855f7"],
    index: "02 — Create account",
    lead: "One link. ",
    emphasis: "Everything",
    rest: " connected.",
    sub: "Free to start, and it stays free.",
  },
  // 03 — Recover access. Teal/petrol, centred: quiet and reassuring.
  forgot: {
    src: "/images/auth/forgot.jpg",
    position: "center 45%",
    overlay: 0.28,
    overlayTone: "dark",
    vignette: 0.42,
    layout: "centered",
    side: "left",
    accent: { light: "#0f766e", dark: "#5eead4" },
    ring: { light: "rgba(15, 118, 110, 0.18)", dark: "rgba(94, 234, 212, 0.22)" },
    orbs: ["#14b8a6", "#38bdf8"],
    index: "03 — Recover access",
    lead: "It happens to ",
    emphasis: "everyone",
    rest: ".",
    sub: "Two minutes and you're back in.",
  },
  // 04 — New password. Graphite/periwinkle, centred: a clean slate.
  reset: {
    src: "/images/auth/reset.jpg",
    position: "center 45%",
    overlay: 0.27,
    overlayTone: "dark",
    vignette: 0.4,
    layout: "centered",
    side: "left",
    accent: { light: "#6d28d9", dark: "#c4b5fd" },
    ring: { light: "rgba(109, 40, 217, 0.18)", dark: "rgba(196, 181, 253, 0.22)" },
    orbs: ["#818cf8", "#e2e8f0"],
    index: "04 — New password",
    lead: "A ",
    emphasis: "fresh",
    rest: " start.",
    sub: "Set a new password and you're done.",
  },
};

/**
 * Where a successful sign-in lands.
 *
 * Centralised because three separate flows (login, verified-email callback,
 * reset completion) all need to agree on it, and changing it later should be a
 * one-line edit rather than a search.
 */
export const POST_SIGN_IN_PATH = "/dashboard";

/** Where a newly registered user lands, before onboarding is complete. */
export const POST_SIGN_UP_PATH = "/onboarding";

/**
 * The same destination, carrying a chosen design.
 *
 * The query string is what carries the design for users whose project has email
 * confirmation off. Those with confirmation on never navigate here at all — the
 * link in their inbox lands on the dashboard — so the same value is *also*
 * written into user metadata by `signUpAction` and read back in onboarding.
 * Both routes are needed: this one covers the direct hop, the metadata one
 * covers the email hop.
 */
export function postSignUpPath(themeSlug?: string): string {
  if (!themeSlug) return POST_SIGN_UP_PATH;
  return `${POST_SIGN_UP_PATH}?theme=${encodeURIComponent(themeSlug)}`;
}

/** One short brand line, shown under the statement on login and sign-up. */
export const AUTH_TAGLINE = "Your business. One link. Everything connected.";
