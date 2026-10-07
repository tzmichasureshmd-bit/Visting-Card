import type {
  CardType,
  CatalogueItem,
  CtaType,
  OfferItem,
  PortfolioItem,
  ReviewItem,
  SectionKey,
  TestimonialItem,
  ThemeConfig,
  VideoItem,
} from "@/lib/cards/types";
import type { PlanLimits } from "@/lib/plan-limits";

/**
 * The builder's edit model.
 *
 * Deliberately separate from `CardData` (the *rendered* view): the editor needs
 * draft rows, ids, plan context and the raw theme configs for the style picker,
 * none of which belong on the public renderer — and the renderer's resolved
 * shape must not carry editor-only state.
 *
 * Everything here is plain JSON so the server component can hand it to the
 * client builder as props without a serializer.
 */

export interface EditorCard {
  id: string;
  username: string;
  fullName: string;
  designation: string | null;
  company: string | null;
  bio: string | null;
  photoUrl: string | null;
  coverUrl: string | null;
  logoUrl: string | null;
  type: CardType;
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
  viewCount: number;
  publishedAt: string | null;
  status: "draft" | "published" | "suspended";
  showBusinessHours: boolean;
  openToEnquiries: boolean;
  openToAppointments: boolean;
  themeId: string | null;
}

export interface EditorSection {
  key: SectionKey;
  enabled: boolean;
  position: number;
}

export interface EditorSocial {
  id: string;
  platform: string;
  url: string;
  label: string | null;
  position: number;
}

export interface EditorService {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number | null;
  ctaType: CtaType;
  ctaLabel: string | null;
  ctaValue: string | null;
  position: number;
}

export interface EditorProduct {
  id: string;
  name: string;
  description: string | null;
  originalPrice: number | null;
  salePrice: number | null;
  ctaType: CtaType;
  ctaLabel: string | null;
  ctaValue: string | null;
  position: number;
}

/** One day of the weekly grid, as `HH:MM` strings the form can edit directly. */
export interface EditorHour {
  dayOfWeek: number;
  isOpen: boolean;
  opensAt: string | null;
  closesAt: string | null;
  is24h: boolean;
}

export interface EditorPayment {
  upiId: string;
  payeeName: string | null;
  note: string | null;
  isActive: boolean;
}

export interface EditorGalleryItem {
  id: string;
  imageUrl: string;
  caption: string | null;
}

export interface EditorTheme {
  id: string;
  slug: string;
  name: string;
  isPremium: boolean;
  /** Raw seeded config, resolved by `resolveTheme()` when the style is picked. */
  config: Record<string, unknown>;
}

/**
 * Collections the builder does not yet have a form for.
 *
 * They are loaded anyway so the live preview is the *real* card: a preview that
 * silently dropped the owner's portfolio or reviews would be showing something
 * other than what a visitor gets, which defeats the point of a preview.
 */
export interface EditorExtras {
  catalogues: CatalogueItem[];
  portfolio: PortfolioItem[];
  videos: VideoItem[];
  reviews: ReviewItem[];
  testimonials: TestimonialItem[];
  offers: OfferItem[];
}

export interface EditorState {
  card: EditorCard;
  sections: EditorSection[];
  socials: EditorSocial[];
  services: EditorService[];
  products: EditorProduct[];
  hours: EditorHour[];
  payment: EditorPayment | null;
  gallery: EditorGalleryItem[];
  themes: EditorTheme[];
  /** Pass-through collections with no builder form yet. */
  extras: EditorExtras;
  /** The card's current theme, already merged with saved overrides. */
  theme: ThemeConfig;
  plan: { slug: string; name: string; limits: PlanLimits };
}
