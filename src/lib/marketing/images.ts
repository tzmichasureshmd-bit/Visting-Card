/**
 * Marketing art direction.
 *
 * ONE place to swap the landing artwork. Every marketing section reads its
 * imagery from here, so replacing the placeholders later means dropping files
 * into `public/images/dvcard/` and changing four `src` strings — no component
 * edits, no scattered hard-coded paths.
 *
 * The paths below point at JPG placeholders that ship with the repo (smooth
 * gradient fields, generated at 1920×1280). They are real files, so layout,
 * contrast and `object-fit` behaviour can be reviewed today. Final photography
 * only has to replace the file: keeping the same base names means the filename
 * is the only thing that changes.
 *
 * Per-image rules:
 *  - `alt` is written for meaningful images (steps, profile) and left empty for
 *    purely decorative backdrops — a decorative panel must never be announced.
 *  - `overlay` / `overlayTone` keep text readable on top of the artwork without
 *    flattening it to black (brief: no heavy image overlays).
 *  - `position` is the focal point, tuned per crop like the auth artwork.
 */

export interface MarketingImage {
  /** Path under /public. */
  src: string;
  /**
   * Alt text. Every current file is a decorative gradient placeholder, so all of
   * them are empty — they illustrate steps rather than carry meaning, and the
   * step's own heading already names it. Set this when final artwork lands if
   * the image ends up conveying information the text does not.
   */
  alt: string;
  /** Focal point for `object-position`, as a CSS keyword pair. */
  position: string;
  /**
   * Overlay strength, 0 to 1.
   *
   * Only used where type sits on top of the image. Decorative panels keep 0 so
   * the artwork stays exactly as designed.
   */
  overlay: number;
  /** Whether the overlay is dark or light, for pale subjects. */
  overlayTone: "dark" | "light";
}

export const MARKETING_IMAGES = {
  /**
   * Hero backdrop — deep indigo/violet field behind the landing headline.
   * Dark overlay because the headline and CTA sit on top of it.
   */
  hero: {
    src: "/images/dvcard/hero.jpg",
    alt: "",
    position: "center 40%",
    overlay: 0.34,
    overlayTone: "dark",
  },
  /**
   * Step 1 panel — "Create your Digital Visiting Card". Warm amber/sand, decorative.
   */
  createCard: {
    src: "/images/dvcard/create-card.jpg",
    alt: "",
    position: "center",
    overlay: 0,
    overlayTone: "dark",
  },
  /**
   * Share step panel — one link, QR, WhatsApp. Teal/emerald, decorative.
   */
  shareCard: {
    src: "/images/dvcard/share-card.jpg",
    alt: "",
    position: "center",
    overlay: 0,
    overlayTone: "dark",
  },
  /**
   * Profile panel — what a finished public card looks like. Graphite/cool
   * blue, decorative.
   */
  profile: {
    src: "/images/dvcard/profile.jpg",
    alt: "",
    position: "center 45%",
    overlay: 0,
    overlayTone: "dark",
  },
} as const satisfies Record<string, MarketingImage>;

export type MarketingImageKey = keyof typeof MARKETING_IMAGES;
