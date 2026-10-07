import type {
  AccentMode,
  AvatarShape,
  ButtonStyle,
  CardData,
  Density,
  Hero,
  Layout,
  NameStyle,
  Palette,
  SectionStyle,
  SectionTitleStyle,
  ThemeConfig,
} from "@/lib/cards/types";

/**
 * The themes (section 34).
 *
 * What makes these different is `layout` / `hero` / `density` / `sectionStyle` —
 * the renderer branches on those, so switching theme changes the page structure,
 * not merely its colours. `minimal` has no cover and hairline dividers;
 * `portfolio` runs an editorial type scale; `business` is deliberately dense.
 *
 * The eight layouts are the primary structural axis. Each one changes where the
 * identity sits and how sections flow beneath it, so a `showcase` card and a
 * `ledger` card are not recolours of one another:
 *
 *   centered   stacked avatar over centred identity
 *   banner     cover image, avatar pulled up over the edge
 *   split      avatar beside the identity from `sm` up
 *   editorial  centred with an inflated type scale
 *   showcase   full-bleed photo hero, identity overlaid
 *   poster     oversized name as the hero, avatar demoted
 *   ledger     dense one-row identity with a ruled meta column
 *   mosaic     compact identity, sections in an asymmetric bento grid
 */

export const DEFAULT_PALETTE: Palette = {
  bg: "#ffffff",
  surface: "#ffffff",
  fg: "#18181b",
  muted: "#71717a",
  border: "#e4e4e7",
  accent: "#18181b",
  accentFg: "#ffffff",
  accentSoft: "#f4f4f5",
};

export const DEFAULT_THEME: ThemeConfig = {
  layout: "centered",
  hero: "none",
  density: "comfortable",
  avatarShape: "circle",
  avatarSize: "lg",
  buttonStyle: "soft",
  sectionStyle: "divided",
  cardStyle: "flat",
  nameStyle: "normal",
  sectionTitleStyle: "normal",
  accentMode: "bold",
  showCover: false,
  showTrustRow: false,
  imageRatio: "4/3",
  fontScale: 1,
  palette: DEFAULT_PALETTE,
};

/** Every accepted value per axis, so the renderer and the normaliser agree. */
export const LAYOUTS = [
  "centered",
  "banner",
  "split",
  "editorial",
  "showcase",
  "poster",
  "ledger",
  "mosaic",
] as const satisfies readonly Layout[];

export const HEROES = [
  "none",
  "cover",
  "solid",
  "gradient",
  "photo",
  "accent",
] as const satisfies readonly Hero[];

export const NAME_STYLES = [
  "normal",
  "caps",
  "serif",
] as const satisfies readonly NameStyle[];

export const SECTION_TITLE_STYLES = [
  "normal",
  "caps",
  "rule",
  "underline",
] as const satisfies readonly SectionTitleStyle[];

export const ACCENT_MODES = [
  "bold",
  "tint",
  "line",
] as const satisfies readonly AccentMode[];

const asEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;

const asBool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/** Only accept hex colours so user input cannot inject arbitrary CSS. */
function asColour(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : fallback;
}

/**
 * Merge stored theme config (seeded) with a user's saved overrides, then
 * validate every field. Anything unrecognised falls back to the default, so a
 * bad row can never produce a broken page.
 */
export function resolveTheme(
  stored: Record<string, unknown> | null | undefined,
  overrides: Record<string, unknown> | null | undefined,
): ThemeConfig {
  const merged: Record<string, unknown> = {
    ...(stored ?? {}),
    ...(overrides ?? {}),
  };

  const rawPalette = (merged.palette ?? {}) as Record<string, unknown>;

return {
    layout: asEnum<Layout>(merged.layout, LAYOUTS, "centered"),
    hero: asEnum<Hero>(merged.hero, HEROES, "none"),
    density: asEnum<Density>(
      merged.density,
      ["compact", "comfortable", "spacious"],
      "comfortable",
    ),
    avatarShape: asEnum<AvatarShape>(
      merged.avatarShape,
      ["circle", "rounded", "square"],
      "circle",
    ),
    avatarSize: asEnum<ThemeConfig["avatarSize"]>(merged.avatarSize, ["md", "lg", "xl"], "lg"),
    buttonStyle: asEnum<ButtonStyle>(
      merged.buttonStyle,
      ["solid", "outline", "soft", "pill"],
      "soft",
    ),
    sectionStyle: asEnum<SectionStyle>(
      merged.sectionStyle,
      ["card", "divided", "plain", "panel"],
      "divided",
    ),
    cardStyle: asEnum<ThemeConfig["cardStyle"]>(merged.cardStyle, ["elevated", "outlined", "flat"], "flat"),
    nameStyle: asEnum<NameStyle>(merged.nameStyle, NAME_STYLES, "normal"),
    sectionTitleStyle: asEnum<SectionTitleStyle>(
      merged.sectionTitleStyle,
      SECTION_TITLE_STYLES,
      "normal",
    ),
    accentMode: asEnum<AccentMode>(merged.accentMode, ACCENT_MODES, "bold"),
    showCover: asBool(merged.showCover, false),
    showTrustRow: asBool(merged.showTrustRow, false),
    // Aspect-ratio utilities are generated by Tailwind, so this must stay a
    // literal it can see.
    imageRatio: merged.imageRatio === "16/9" ? "16/9" : "4/3",
    fontScale: Math.min(1.25, Math.max(0.9, asNumber(merged.fontScale, 1))),
    palette: {
      bg: asColour(rawPalette.bg, DEFAULT_PALETTE.bg),
      surface: asColour(rawPalette.surface, DEFAULT_PALETTE.surface),
      fg: asColour(rawPalette.fg, DEFAULT_PALETTE.fg),
      muted: asColour(rawPalette.muted, DEFAULT_PALETTE.muted),
      border: asColour(rawPalette.border, DEFAULT_PALETTE.border),
      accent: asColour(rawPalette.accent, DEFAULT_PALETTE.accent),
      accentFg: asColour(rawPalette.accentFg, DEFAULT_PALETTE.accentFg),
      accentSoft: asColour(rawPalette.accentSoft, DEFAULT_PALETTE.accentSoft),
    },
  };
}

/**
 * A `style` object for the card root, scoped under `.dv-card` so these custom
 * properties cannot leak into the dashboard or the landing page.
 */
export function themeStyle(theme: ThemeConfig): React.CSSProperties {
  return {
    "--c-bg": theme.palette.bg,
    "--c-surface": theme.palette.surface,
    "--c-fg": theme.palette.fg,
    "--c-muted": theme.palette.muted,
    "--c-border": theme.palette.border,
    "--c-accent": theme.palette.accent,
    "--c-accent-fg": theme.palette.accentFg,
    "--c-accent-soft": theme.palette.accentSoft,
    "--c-font-scale": String(theme.fontScale),
  } as React.CSSProperties;
}

/** Density-driven vertical rhythm, so "spacious" is a real layout choice. */
export function sectionSpacing(density: Density): string {
  return {
    compact: "py-4",
    comfortable: "py-6",
    spacious: "py-8",
  }[density];
}

export function gutterWidth(density: Density): string {
  return { compact: "max-w-md", comfortable: "max-w-lg", spacious: "max-w-xl" }[density];
}

/** Vertical rhythm for the identity block. */
export function identityGap(density: Density): string {
  return {
    compact: "gap-2.5",
    comfortable: "gap-3.5",
    spacious: "gap-5",
  }[density];
}

export function avatarClass(shape: AvatarShape): string {
  return {
    circle: "rounded-full",
    rounded: "rounded-2xl",
    square: "rounded-md",
  }[shape];
}

export function avatarSizeClass(size: ThemeConfig["avatarSize"]): string {
  return { md: "size-16", lg: "size-20", xl: "size-28" }[size];
}

/**
 * Avatar size for `poster`, which demotes the photo so the name can carry the
 * hero, and `ledger`/`mosaic`, which sit the avatar on one horizontal row.
 */
export function avatarSizeForLayout(theme: ThemeConfig): string {
  if (theme.layout === "poster") return "size-16";
  if (theme.layout === "ledger") return "size-14";
  if (theme.layout === "mosaic") return "size-16";
  return avatarSizeClass(theme.avatarSize);
}

export function buttonClass(style: ButtonStyle): string {
  return {
    solid: "bg-[var(--c-accent)] text-[var(--c-accent-fg)] hover:brightness-110",
    outline:
      "border border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-accent-soft)]",
    soft: "bg-[var(--c-accent-soft)] text-[var(--c-accent)] hover:brightness-95",
    pill: "bg-[var(--c-accent)] text-[var(--c-accent-fg)] hover:brightness-110 rounded-full",
  }[style];
}

export function sectionSurface(style: SectionStyle): string {
  return {
    card: "rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)]",
    divided: "border-t border-[var(--c-border)]",
    plain: "",
    panel: "rounded-2xl bg-[var(--c-accent-soft)]",
  }[style];
}

/** Inner padding for the section body, which differs per style. */
export function sectionBodyPad(style: SectionStyle, density: Density): string {
  const pad = { compact: "py-4", comfortable: "py-5", spacious: "py-6" }[density];
  if (style === "card") return `px-4 ${pad} pb-4`;
  if (style === "panel") return `px-4 ${pad}`;
  if (style === "divided") return `px-1 ${pad}`;
  return `px-1 ${pad}`;
}

/**
 * Typography for the person's name.
 *
 * `poster` leans on this: the name is set large in a serif or all caps, so the
 * identity block reads as a poster rather than a profile. `caps` deliberately
 * tightens the tracking so long names still fit one line.
 */
export function nameClass(style: NameStyle): string {
  return {
    normal: "font-semibold tracking-tight",
    caps: "font-semibold tracking-[0.14em] uppercase",
    serif: "font-serif font-normal tracking-[-0.01em]",
  }[style];
}

/** Section-heading treatment — the page's typographic voice, per theme. */
export function sectionTitleClass(style: SectionTitleStyle): string {
  return {
    normal: "",
    caps: "text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)]",
    rule: "flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)] before:h-px before:flex-1 before:bg-[var(--c-border)]",
    underline: "underline decoration-2 underline-offset-4 decoration-[var(--c-accent)]",
  }[style];
}

/**
 * How strongly the accent colour may be used for interactive text.
 *
 * `bold` is the default: accent-coloured labels and buttons. `tint` keeps the
 * accent out of body copy and defers emphasis to weight, which reads calmer for
 * a card that is mostly text. `line` confines the accent to rules and fills, so
 * it never tints a label.
 */
export function accentTextClass(mode: AccentMode): string {
  return { bold: "text-[var(--c-accent)]", tint: "", line: "" }[mode];
}

/** The rule/underline element that `line` accent mode relies on. */
export function accentRuleClass(mode: AccentMode): string {
  return mode === "line" ? "bg-[var(--c-accent)]" : "bg-[var(--c-border)]";
}

export function itemCardClass(style: ThemeConfig["cardStyle"]): string {
  return {
    elevated: "rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-sm",
    outlined: "rounded-xl border border-[var(--c-border)]",
    flat: "rounded-xl bg-[var(--c-accent-soft)]",
  }[style];
}

/** True when the palette is dark enough to need light-on-dark text on the hero. */
export function isDarkPalette(theme: ThemeConfig): boolean {
  const hex = theme.palette.bg.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Rec. 709 luma.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45;
}

/** Convenience: the resolved theme for a card. */
export function cardTheme(card: CardData): ThemeConfig {
  return card.theme;
}