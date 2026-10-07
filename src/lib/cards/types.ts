/**
 * The shape the public card renderer consumes.
 *
 * This is deliberately a *flat, resolved* view rather than the raw database
 * rows. The renderer should not know about joins, plan gating or storage keys —
 * the query layer resolves all of that once, so the render path stays fast
 * (section 73) and the component tree stays simple.
 */

export type CardType = "personal" | "professional" | "business" | "creator" | "company";

export type CtaType = "whatsapp" | "call" | "website" | "enquiry" | "buy_now";

export interface Palette {
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  border: string;
  accent: string;
  accentFg: string;
  accentSoft: string;
}

export type Layout =
  | "centered"
  | "banner"
  | "split"
  | "editorial"
  | "showcase"
  | "poster"
  | "ledger"
  | "mosaic";
export type Hero = "none" | "cover" | "solid" | "gradient" | "photo" | "accent";
export type Density = "compact" | "comfortable" | "spacious";
export type AvatarShape = "circle" | "rounded" | "square";
export type ButtonStyle = "solid" | "outline" | "soft" | "pill";
export type SectionStyle = "card" | "divided" | "plain" | "panel";
/** How the person's name is set: sentence case, all caps, or a serif display. */
export type NameStyle = "normal" | "caps" | "serif";
/** How section headings are set, so the page's typographic voice is configurable. */
export type SectionTitleStyle = "normal" | "caps" | "rule" | "underline";
/** How far the accent colour is allowed to travel. */
export type AccentMode = "bold" | "tint" | "line";

/**
 * Normalised theme, whatever the stored `themes.config` JSON looks like.
 *
 * Every field is additive and has a default, so a card saved against an older
 * config keeps rendering — `resolveTheme` fills the new axes from its defaults.
 */
export interface ThemeConfig {
  layout: Layout;
  hero: Hero;
  density: Density;
  avatarShape: AvatarShape;
  avatarSize: "md" | "lg" | "xl";
  buttonStyle: ButtonStyle;
  sectionStyle: SectionStyle;
  cardStyle: "elevated" | "outlined" | "flat";
  nameStyle: NameStyle;
  sectionTitleStyle: SectionTitleStyle;
  accentMode: AccentMode;
  showCover: boolean;
  showTrustRow: boolean;
  imageRatio: string;
  fontScale: number;
  palette: Palette;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  position: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  pricePaise: number | null;
  ctaType: CtaType;
  ctaLabel: string | null;
  ctaValue: string | null;
  position: number;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  originalPrice: number | null;
  salePrice: number | null;
  ctaType: CtaType;
  ctaLabel: string | null;
  ctaValue: string | null;
  position: number;
}

export interface CatalogueItem {
  id: string;
  catalogueId: string;
  title: string;
  category: string;
  description: string | null;
  coverUrl: string | null;
  items: {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    pricePaise: number | null;
    offerPaise: number | null;
    ctaType: CtaType;
    ctaLabel: string | null;
    position: number;
  }[];
  position: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  externalUrl: string | null;
  category: string | null;
  position: number;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
  width: number | null;
  height: number | null;
  position: number;
}

export interface VideoItem {
  id: string;
  title: string;
  url: string;
  kind: string;
  thumbnailUrl: string | null;
  position: number;
}

export interface BusinessHour {
  dayOfWeek: number;
  isOpen: boolean;
  opensAt: number | null;
  closesAt: number | null;
  is24h: boolean;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  rating: number;
  body: string | null;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorDesignation: string | null;
  authorCompany: string | null;
  authorAvatar: string | null;
  body: string;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  badge: string | null;
  expiresAt: string | null;
  position: number;
}

export interface UpiConfig {
  upiId: string | null;
  payeeName: string | null;
  note: string | null;
  isActive: boolean;
}

/** Section keys, in their default display order (section 10). */
export const SECTION_KEYS = [
  "about",
  "contact",
  "social",
  "services",
  "products",
  "catalogue",
  "portfolio",
  "gallery",
  "video",
  "payment",
  "location",
  "business_hours",
  "reviews",
  "testimonials",
  "offers",
  "enquiry",
  "appointment",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/**
 * The `lead_status` enum, mirrored from the database.
 *
 * Lives here rather than in the action so the inbox's filter, its labels and the
 * status update all read the same list. A filter that passed a raw query string to
 * `.eq("status", ...)` would turn `?status=nonsense` into a Postgres enum error
 * rather than an empty list.
 */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "interested",
  "converted",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** Display names for the inbox filter, paired with each status. */
export const LEAD_STATUS_LABELS: ReadonlyArray<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
];

/** Narrow an untrusted value to a real status, defaulting to `new`. */
export function readLeadStatus(value: unknown): LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value as string)
    ? (value as LeadStatus)
    : "new";
}

export interface CardSection {
  key: SectionKey;
  enabled: boolean;
  position: number;
  config: Record<string, unknown>;
}

export interface CardData {
  id: string;
  username: string;
  type: CardType;
  fullName: string;
  designation: string | null;
  company: string | null;
  bio: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  logoUrl: string | null;

  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;

  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;

  showBusinessHours: boolean;
  openToEnquiries: boolean;
  openToAppointments: boolean;

  /** False when the owner's plan does not remove Tzmicha It Solutions branding. */
  showBranding: boolean;

  theme: ThemeConfig;
  sections: CardSection[];
  socialLinks: SocialLink[];
  services: ServiceItem[];
  products: ProductItem[];
  catalogues: CatalogueItem[];
  portfolio: PortfolioItem[];
  gallery: GalleryItem[];
  videos: VideoItem[];
  businessHours: BusinessHour[];
  reviews: ReviewItem[];
  testimonials: TestimonialItem[];
  offers: OfferItem[];
  payment: UpiConfig | null;

  viewCount: number;
  publishedAt: string | null;
}

/** Narrow helper used by the renderer and the CTA resolver. */
export function isSectionEnabled(card: CardData, key: SectionKey): boolean {
  const section = card.sections.find((s) => s.key === key);
  // Sections default to enabled; only an explicit `false` disables one.
  return section ? section.enabled : true;
}

/** Resolved CTA destination for a service / product / catalogue row. */
export function resolveCta(
  card: CardData,
  ctaType: CtaType,
  ctaValue: string | null,
  defaultMessage?: string,
): { href: string; external: boolean } | null {
  const phone = card.whatsapp ?? card.phone;

  switch (ctaType) {
    case "whatsapp":
      return phone
        ? {
            href: `https://wa.me/91${phone}?text=${encodeURIComponent(
              defaultMessage ?? `Hi ${card.fullName}, I found your card.`,
            )}`,
            external: true,
          }
        : null;
    case "call":
      return phone ? { href: `tel:+91${phone}`, external: false } : null;
    case "website": {
      const url = ctaValue ?? card.website;
      if (!url) return null;
      const normalised = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      return { href: normalised, external: true };
    }
    case "enquiry":
      return { href: `#enquiry`, external: false };
    case "buy_now": {
      if (ctaValue) {
        const normalised = /^https?:\/\//i.test(ctaValue)
          ? ctaValue
          : `https://${ctaValue}`;
        return { href: normalised, external: true };
      }
      return phone
        ? {
            href: `https://wa.me/91${phone}?text=${encodeURIComponent(
              `Hi ${card.fullName}, I would like to buy from your card.`,
            )}`,
            external: true,
          }
        : null;
    }
    default:
      return null;
  }
}