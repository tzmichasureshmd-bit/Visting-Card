import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/cards/theme";
import { serverConfig } from "@/lib/env";
import type { ThemeConfig } from "@/lib/cards/types";

/**
 * The themes, for the marketing showcase and the template gallery.
 *
 * The `themes` table is publicly readable, so the live configs are preferred and
 * an admin adding a theme gets it on the landing page without a deploy.
 * `FALLBACK_THEMES` mirrors `supabase/seed.sql` and exists so the marketing
 * pages render in a fresh checkout with no credentials configured.
 *
 * Each theme is passed through `resolveTheme`, the same normaliser the card uses,
 * so a preview can never render differently from the real card.
 */

export interface ThemeShowcase {
  slug: string;
  name: string;
  category: string;
  description: string;
  isPremium: boolean;
  config: ThemeConfig;
}

/**
 * Mirrors the `themes` rows in `supabase/seed.sql`.
 *
 * Stored as raw partial configs rather than resolved `ThemeConfig`s so this file
 * cannot drift from the seed in a way that only shows up in one of the two.
 * `toShowcase` runs each through `resolveTheme` to fill any missing axis.
 */
const RAW_THEMES: ReadonlyArray<
  Omit<ThemeShowcase, "config"> & { config: Record<string, unknown> }
> = [
  {
    slug: "minimal",
    name: "Minimal",
    category: "general",
    description:
      "Quiet and focused. No cover image, centred identity, hairline dividers. Best for consultants and freelancers who let their work speak.",
    isPremium: false,
    config: {
      layout: "centered",
      hero: "none",
      density: "comfortable",
      avatarShape: "circle",
      avatarSize: "lg",
      buttonStyle: "soft",
      sectionStyle: "divided",
      cardStyle: "flat",
      showCover: false,
      fontScale: 1,
      palette: {
        bg: "#ffffff",
        surface: "#ffffff",
        fg: "#18181b",
        muted: "#71717a",
        border: "#e4e4e7",
        accent: "#18181b",
        accentFg: "#ffffff",
        accentSoft: "#f4f4f5",
      },
    },
  },
  {
    slug: "professional",
    name: "Professional",
    category: "general",
    description:
      "Cover banner with a left-aligned identity and outlined actions. The default corporate look — credible without being loud.",
    isPremium: false,
    config: {
      layout: "banner",
      hero: "cover",
      density: "comfortable",
      avatarShape: "rounded",
      avatarSize: "lg",
      buttonStyle: "outline",
      sectionStyle: "card",
      cardStyle: "elevated",
      showCover: true,
      fontScale: 1,
      palette: {
        bg: "#f8fafc",
        surface: "#ffffff",
        fg: "#0f172a",
        muted: "#64748b",
        border: "#e2e8f0",
        accent: "#2563eb",
        accentFg: "#ffffff",
        accentSoft: "#eff6ff",
      },
    },
  },
  {
    slug: "luxury",
    name: "Luxury",
    category: "general",
    description:
      "Deep charcoal with a warm gold accent, wide margins and generous type. Suits premium services, jewellery, hospitality.",
    isPremium: true,
    config: {
      layout: "editorial",
      hero: "solid",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "xl",
      buttonStyle: "solid",
      sectionStyle: "plain",
      cardStyle: "outlined",
      showCover: false,
      fontScale: 1.08,
      palette: {
        bg: "#121212",
        surface: "#1c1c1c",
        fg: "#f5f5f4",
        muted: "#a8a29e",
        border: "#2e2e2e",
        accent: "#c9a227",
        accentFg: "#1c1c1c",
        accentSoft: "#2a2415",
      },
    },
  },
  {
    slug: "dark",
    name: "Dark",
    category: "general",
    description:
      "A high-contrast dark surface with an electric accent. Makes photography and bright product shots pop.",
    isPremium: true,
    config: {
      layout: "split",
      hero: "gradient",
      density: "comfortable",
      avatarShape: "rounded",
      avatarSize: "lg",
      buttonStyle: "pill",
      sectionStyle: "card",
      cardStyle: "elevated",
      showCover: true,
      fontScale: 1,
      palette: {
        bg: "#0b0f19",
        surface: "#141a28",
        fg: "#f8fafc",
        muted: "#94a3b8",
        border: "#1f2937",
        accent: "#22d3ee",
        accentFg: "#04222a",
        accentSoft: "#0e2a33",
      },
    },
  },
  {
    slug: "creative",
    name: "Creative",
    category: "general",
    description:
      "Offset split hero, punchy colour and pill buttons. Built for photographers, artists and personal brands.",
    isPremium: true,
    config: {
      layout: "split",
      hero: "gradient",
      density: "comfortable",
      avatarShape: "circle",
      avatarSize: "xl",
      buttonStyle: "pill",
      sectionStyle: "divided",
      cardStyle: "flat",
      showCover: false,
      fontScale: 1.05,
      palette: {
        bg: "#fdf4ff",
        surface: "#ffffff",
        fg: "#18181b",
        muted: "#71717a",
        border: "#f0e0ff",
        accent: "#c026d3",
        accentFg: "#ffffff",
        accentSoft: "#fae8ff",
      },
    },
  },
  {
    slug: "business",
    name: "Business",
    category: "general",
    description:
      "Compact and information-dense. Small type scale, tight rows, maximum usable space — for businesses listing many items.",
    isPremium: false,
    config: {
      layout: "banner",
      hero: "cover",
      density: "compact",
      avatarShape: "square",
      avatarSize: "md",
      buttonStyle: "solid",
      sectionStyle: "card",
      cardStyle: "outlined",
      showCover: true,
      fontScale: 0.96,
      palette: {
        bg: "#ffffff",
        surface: "#ffffff",
        fg: "#111827",
        muted: "#6b7280",
        border: "#e5e7eb",
        accent: "#059669",
        accentFg: "#ffffff",
        accentSoft: "#ecfdf5",
      },
    },
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    category: "food",
    description:
      "Warm tones, large imagery and a photo-forward menu. Built for cafés, bakeries and food businesses.",
    isPremium: true,
    config: {
      layout: "banner",
      hero: "cover",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "lg",
      buttonStyle: "solid",
      sectionStyle: "card",
      cardStyle: "elevated",
      showCover: true,
      fontScale: 1.04,
      imageRatio: "4/3",
      palette: {
        bg: "#fffbf5",
        surface: "#ffffff",
        fg: "#1c1917",
        muted: "#78716c",
        border: "#f0e6d8",
        accent: "#c2410c",
        accentFg: "#ffffff",
        accentSoft: "#fff1e7",
      },
    },
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    category: "property",
    description:
      "Wide banners and large listing imagery, with a strong enquiry affordance. For brokers, builders and property consultants.",
    isPremium: true,
    config: {
      layout: "banner",
      hero: "cover",
      density: "comfortable",
      avatarShape: "rounded",
      avatarSize: "md",
      buttonStyle: "solid",
      sectionStyle: "card",
      cardStyle: "outlined",
      showCover: true,
      fontScale: 1,
      imageRatio: "16/9",
      palette: {
        bg: "#ffffff",
        surface: "#f8fafc",
        fg: "#0f172a",
        muted: "#64748b",
        border: "#e2e8f0",
        accent: "#0f766e",
        accentFg: "#ffffff",
        accentSoft: "#f0fdfa",
      },
    },
  },
  {
    slug: "medical",
    name: "Medical",
    category: "health",
    description:
      "Calm blue-green palette, high contrast and clear trust signals. Tuned for clinics, dentists, therapists and labs.",
    isPremium: true,
    config: {
      layout: "centered",
      hero: "solid",
      density: "comfortable",
      avatarShape: "circle",
      avatarSize: "lg",
      buttonStyle: "solid",
      sectionStyle: "card",
      cardStyle: "elevated",
      showCover: false,
      fontScale: 1,
      showTrustRow: true,
      palette: {
        bg: "#f7fcfc",
        surface: "#ffffff",
        fg: "#0f2e2a",
        muted: "#5f7d78",
        border: "#d7e9e6",
        accent: "#0d9488",
        accentFg: "#ffffff",
        accentSoft: "#ecfdf9",
      },
    },
  },
  {
    slug: "portfolio",
    name: "Portfolio",
    category: "general",
    description:
      "Editorial type scale with a project grid as the centre of gravity. For designers, studios and makers.",
    isPremium: true,
    config: {
      layout: "editorial",
      hero: "none",
      density: "spacious",
      avatarShape: "square",
      avatarSize: "lg",
      buttonStyle: "outline",
      sectionStyle: "plain",
      cardStyle: "flat",
      showCover: false,
      fontScale: 1.12,
      palette: {
        bg: "#ffffff",
        surface: "#fafafa",
        fg: "#09090b",
        muted: "#71717a",
        border: "#e4e4e7",
        accent: "#7c3aed",
        accentFg: "#ffffff",
        accentSoft: "#f5f3ff",
      },
    },
  },
  {
    slug: "spotlight",
    name: "Spotlight",
    category: "creative",
    description:
      "Full-bleed photo hero with the identity layered over it and the actions first. The highest-impact choice for photographers and personal brands.",
    isPremium: true,
    config: {
      layout: "showcase",
      hero: "photo",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "xl",
      buttonStyle: "solid",
      sectionStyle: "plain",
      cardStyle: "flat",
      nameStyle: "normal",
      sectionTitleStyle: "caps",
      accentMode: "bold",
      showCover: true,
      imageRatio: "16/9",
      fontScale: 1.05,
      palette: {
        bg: "#0a0a0a",
        surface: "#171717",
        fg: "#fafafa",
        muted: "#a1a1aa",
        border: "#262626",
        accent: "#f59e0b",
        accentFg: "#1a1408",
        accentSoft: "#241c0e",
      },
    },
  },
  {
    slug: "gallery",
    name: "Gallery",
    category: "creative",
    description:
      "Showcase layout tuned for visual work: wide imagery, muted section headings and generous spacing so the pictures lead.",
    isPremium: true,
    config: {
      layout: "showcase",
      hero: "photo",
      density: "spacious",
      avatarShape: "square",
      avatarSize: "lg",
      buttonStyle: "outline",
      sectionStyle: "plain",
      cardStyle: "outlined",
      nameStyle: "serif",
      sectionTitleStyle: "caps",
      accentMode: "tint",
      showCover: true,
      imageRatio: "16/9",
      fontScale: 1.02,
      palette: {
        bg: "#ffffff",
        surface: "#fafaf9",
        fg: "#1c1917",
        muted: "#78716c",
        border: "#e7e5e4",
        accent: "#0f766e",
        accentFg: "#ffffff",
        accentSoft: "#f0fdfa",
      },
    },
  },
  {
    slug: "poster",
    name: "Poster",
    category: "creative",
    description:
      "The name set as the artwork at display size, with the photo demoted. For people whose name is the brand.",
    isPremium: false,
    config: {
      layout: "poster",
      hero: "none",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "md",
      buttonStyle: "soft",
      sectionStyle: "plain",
      cardStyle: "flat",
      nameStyle: "serif",
      sectionTitleStyle: "rule",
      accentMode: "line",
      showCover: false,
      imageRatio: "4/3",
      fontScale: 1.15,
      palette: {
        bg: "#fffdf8",
        surface: "#ffffff",
        fg: "#14110c",
        muted: "#7a7266",
        border: "#e8e0d2",
        accent: "#b45309",
        accentFg: "#ffffff",
        accentSoft: "#fdf6e9",
      },
    },
  },
  {
    slug: "masthead",
    name: "Masthead",
    category: "editorial",
    description:
      "All-caps name with wide tracking over a hairline rule. Reads like a newspaper byline — editorial, deliberate, unhurried.",
    isPremium: false,
    config: {
      layout: "poster",
      hero: "none",
      density: "comfortable",
      avatarShape: "square",
      avatarSize: "md",
      buttonStyle: "outline",
      sectionStyle: "divided",
      cardStyle: "flat",
      nameStyle: "caps",
      sectionTitleStyle: "caps",
      accentMode: "line",
      showCover: false,
      imageRatio: "16/9",
      fontScale: 1.1,
      palette: {
        bg: "#ffffff",
        surface: "#ffffff",
        fg: "#111111",
        muted: "#6b6b6b",
        border: "#d9d9d9",
        accent: "#dc2626",
        accentFg: "#ffffff",
        accentSoft: "#fef2f2",
      },
    },
  },
  {
    slug: "ledger",
    name: "Ledger",
    category: "business",
    description:
      "Dense single-row identity closed by an accent rule. Built for people who list a lot and want it all reachable fast.",
    isPremium: false,
    config: {
      layout: "ledger",
      hero: "none",
      density: "compact",
      avatarShape: "square",
      avatarSize: "md",
      buttonStyle: "solid",
      sectionStyle: "divided",
      cardStyle: "outlined",
      nameStyle: "normal",
      sectionTitleStyle: "caps",
      accentMode: "bold",
      showCover: false,
      imageRatio: "4/3",
      fontScale: 0.98,
      palette: {
        bg: "#ffffff",
        surface: "#f8fafc",
        fg: "#0f172a",
        muted: "#64748b",
        border: "#cbd5e1",
        accent: "#1d4ed8",
        accentFg: "#ffffff",
        accentSoft: "#eff6ff",
      },
    },
  },
  {
    slug: "bento",
    name: "Bento",
    category: "product",
    description:
      "A compact identity followed by sections on a two-column bento grid. Good for a card that mixes short sections and long ones.",
    isPremium: true,
    config: {
      layout: "mosaic",
      hero: "none",
      density: "compact",
      avatarShape: "rounded",
      avatarSize: "md",
      buttonStyle: "soft",
      sectionStyle: "panel",
      cardStyle: "elevated",
      nameStyle: "normal",
      sectionTitleStyle: "caps",
      accentMode: "bold",
      showCover: false,
      imageRatio: "16/9",
      fontScale: 1,
      palette: {
        bg: "#f8fafc",
        surface: "#ffffff",
        fg: "#0f172a",
        muted: "#64748b",
        border: "#e2e8f0",
        accent: "#7c3aed",
        accentFg: "#ffffff",
        accentSoft: "#f5f3ff",
      },
    },
  },
  {
    slug: "mosaic-dark",
    name: "Mosaic Dark",
    category: "product",
    description:
      "The bento grid on a dark surface with a cyan edge. Compact, technical, and easy to scan on a phone.",
    isPremium: true,
    config: {
      layout: "mosaic",
      hero: "none",
      density: "comfortable",
      avatarShape: "rounded",
      avatarSize: "md",
      buttonStyle: "pill",
      sectionStyle: "panel",
      cardStyle: "flat",
      nameStyle: "normal",
      sectionTitleStyle: "caps",
      accentMode: "bold",
      showCover: false,
      imageRatio: "4/3",
      fontScale: 1,
      palette: {
        bg: "#09090b",
        surface: "#18181b",
        fg: "#fafafa",
        muted: "#a1a1aa",
        border: "#27272a",
        accent: "#22d3ee",
        accentFg: "#083344",
        accentSoft: "#0e2a33",
      },
    },
  },
  {
    slug: "atelier",
    name: "Atelier",
    category: "luxury",
    description:
      "A tall accent band over a spaced, serif-led identity with outlined actions. For studios and high-end services.",
    isPremium: true,
    config: {
      layout: "banner",
      hero: "accent",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "xl",
      buttonStyle: "outline",
      sectionStyle: "plain",
      cardStyle: "outlined",
      nameStyle: "serif",
      sectionTitleStyle: "rule",
      accentMode: "tint",
      showCover: false,
      showTrustRow: true,
      imageRatio: "4/3",
      fontScale: 1.1,
      palette: {
        bg: "#faf7f2",
        surface: "#ffffff",
        fg: "#1c1917",
        muted: "#79716b",
        border: "#e7ded2",
        accent: "#8b5e3c",
        accentFg: "#ffffff",
        accentSoft: "#f4ece2",
      },
    },
  },
  {
    slug: "noir",
    name: "Noir",
    category: "luxury",
    description:
      "Near-black with a single hairline accent and no accent tint anywhere in the copy. As restrained as a card gets.",
    isPremium: true,
    config: {
      layout: "editorial",
      hero: "none",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "xl",
      buttonStyle: "outline",
      sectionStyle: "divided",
      cardStyle: "outlined",
      nameStyle: "serif",
      sectionTitleStyle: "underline",
      accentMode: "line",
      showCover: false,
      imageRatio: "4/3",
      fontScale: 1.14,
      palette: {
        bg: "#0b0b0c",
        surface: "#131314",
        fg: "#f5f5f4",
        muted: "#8f8d88",
        border: "#26262a",
        accent: "#e7c37a",
        accentFg: "#14140f",
        accentSoft: "#1e1c16",
      },
    },
  },
  {
    slug: "clinic",
    name: "Clinic",
    category: "health",
    description:
      "Calm teal on a soft white, with a trust row and underlined headings. Reads as reassurance before a first appointment.",
    isPremium: false,
    config: {
      layout: "split",
      hero: "solid",
      density: "comfortable",
      avatarShape: "circle",
      avatarSize: "lg",
      buttonStyle: "solid",
      sectionStyle: "card",
      cardStyle: "elevated",
      nameStyle: "normal",
      sectionTitleStyle: "underline",
      accentMode: "bold",
      showCover: false,
      showTrustRow: true,
      imageRatio: "4/3",
      fontScale: 1,
      palette: {
        bg: "#f6fbfb",
        surface: "#ffffff",
        fg: "#0f2e2a",
        muted: "#5f7d78",
        border: "#d7e9e6",
        accent: "#0d9488",
        accentFg: "#ffffff",
        accentSoft: "#ecfdf9",
      },
    },
  },
  {
    slug: "kiosk",
    name: "Kiosk",
    category: "food",
    description:
      "Warm, saturated and photo-forward with pill actions and generous spacing. Built for a counter, a café or a bakery.",
    isPremium: true,
    config: {
      layout: "banner",
      hero: "photo",
      density: "spacious",
      avatarShape: "circle",
      avatarSize: "xl",
      buttonStyle: "pill",
      sectionStyle: "card",
      cardStyle: "elevated",
      nameStyle: "normal",
      sectionTitleStyle: "caps",
      accentMode: "bold",
      showCover: true,
      imageRatio: "4/3",
      fontScale: 1.06,
      palette: {
        bg: "#fffaf3",
        surface: "#ffffff",
        fg: "#292524",
        muted: "#78716c",
        border: "#f3e3cd",
        accent: "#ea580c",
        accentFg: "#ffffff",
        accentSoft: "#fff1e3",
      },
    },
  },
  {
    slug: "estate",
    name: "Estate",
    category: "property",
    description:
      "Wide 16:9 imagery with underlined headings and a muted accent. Laid out to make a listing feel like a brochure.",
    isPremium: true,
    config: {
      layout: "banner",
      hero: "photo",
      density: "comfortable",
      avatarShape: "rounded",
      avatarSize: "lg",
      buttonStyle: "solid",
      sectionStyle: "card",
      cardStyle: "outlined",
      nameStyle: "normal",
      sectionTitleStyle: "underline",
      accentMode: "tint",
      showCover: true,
      showTrustRow: true,
      imageRatio: "16/9",
      fontScale: 1.02,
      palette: {
        bg: "#ffffff",
        surface: "#f8fafc",
        fg: "#0f172a",
        muted: "#64748b",
        border: "#e2e8f0",
        accent: "#0f766e",
        accentFg: "#ffffff",
        accentSoft: "#f0fdfa",
      },
    },
  },
];

/** Resolve one raw row into the showcase shape the renderer consumes. */
function toShowcase(theme: (typeof RAW_THEMES)[number]): ThemeShowcase {
  return { ...theme, config: resolveTheme(theme.config, null) };
}

export const FALLBACK_THEMES: ThemeShowcase[] = RAW_THEMES.map(toShowcase);

/** Distinct categories present in the catalogue, for the gallery's filter row. */
export const FALLBACK_THEME_CATEGORIES: string[] = [
  ...new Set(RAW_THEMES.map((theme) => theme.category)),
].sort();

/**
 * Themes for the showcase, in seed order.
 *
 * Falls back to the seeded list rather than throwing: a marketing page that cannot
 * render because the database is briefly down is worse than one showing the
 * default themes.
 */
export async function getShowcaseThemes(): Promise<ThemeShowcase[]> {
  if (!serverConfig.isSupabaseConfigured) return FALLBACK_THEMES;

  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from("themes")
      .select("slug, name, category, description, is_premium, config, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return FALLBACK_THEMES;

    return data.map((row) => ({
      slug: String(row.slug),
      name: String(row.name),
      category: String(row.category ?? "general"),
      description: String(row.description ?? ""),
      isPremium: row.is_premium === true,
      config: resolveTheme(
        (row.config ?? null) as Record<string, unknown> | null,
        null,
      ),
    }));
  } catch (error) {
    console.error("[themes] falling back to seeded themes", error);
    return FALLBACK_THEMES;
  }
}

/** One theme by slug, for the template detail page. Null when it does not exist. */
export async function getShowcaseTheme(slug: string): Promise<ThemeShowcase | null> {
  const themes = await getShowcaseThemes();
  return themes.find((theme) => theme.slug === slug) ?? null;
}