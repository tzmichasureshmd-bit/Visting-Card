import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/cards/theme";
import { allowsSection, parsePlanLimits, type PlanLimits } from "@/lib/plan-limits";
import {
  SECTION_KEYS,
  type BusinessHour,
  type CardData,
  type CardSection,
  type CardType,
  type CtaType,
  type SectionKey,
} from "@/lib/cards/types";

/**
 * Read model for the public card.
 *
 * One function turns ~15 rows across 15 tables into the single flat `CardData`
 * the renderer consumes. Everything plan-dependent is resolved here too, so the
 * component tree never asks "is this allowed?" — it just renders what it is
 * given (section 73: keep the render path free of policy).
 *
 * Security note: this runs with the *anon* key and no cookies. Row Level Security
 * is what makes this safe — `cards` and every content table only expose rows whose
 * parent card is published. The owner's subscription is not publicly readable, so
 * plan gating comes from the narrow `public_card_gate` RPC instead.
 */

/** Trim and drop empties in one pass: a blank text column is `null`, not "". */
function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * An image URL that is actually renderable.
 *
 * Only absolute https URLs and root-relative paths are accepted. This is the
 * boundary that keeps a `javascript:` or `data:` value out of an `<Image src>`,
 * and it turns blank/garbage rows into `null` so the renderer skips them instead
 * of emitting a broken image.
 */
function image(value: unknown): string | null {
  const url = text(value);
  if (!url) return null;
  return url.startsWith("https://") || url.startsWith("/") ? url : null;
}

function int(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null;
}

function float(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function ctaType(value: unknown): CtaType {
  switch (value) {
    case "whatsapp":
    case "call":
    case "website":
    case "buy_now":
    case "enquiry":
      return value;
    default:
      return "enquiry";
  }
}

function byPosition<T extends { position?: number | null }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

/** Only `is_active` rows, applied defensively in case RLS ever widens. */
function active<T extends { is_active?: boolean | null }>(rows: T[] | null): T[] {
  return (rows ?? []).filter((row) => row.is_active !== false);
}

/**
 * Clamp to a plan limit. `-1` means unlimited, so `0` is passed through.
 * Used on read as well as in the editor: a downgrade must visibly trim the live
 * card rather than leave a paywalled section showing to visitors.
 */
function clamp<T>(rows: T[], limit: number | undefined): T[] {
  if (limit === undefined || limit < 0) return rows;
  return rows.slice(0, limit);
}

export class CardNotFoundError extends Error {
  constructor(username: string) {
    super(`No published card for "${username}"`);
    this.name = "CardNotFoundError";
  }
}

export async function getPublicCard(username: string): Promise<CardData> {
  const supabase = await createPublicClient();
  const slug = username.trim().toLowerCase();

  if (!slug) throw new CardNotFoundError(username);

  // Round 1: the card row itself, plus its theme in the same round trip.
  const { data: cardRow, error: cardError } = await supabase
    .from("cards")
    .select(
      `
        id, user_id, type, username, full_name, designation, company, bio,
        photo_url, cover_url, logo_url,
        phone, whatsapp, email, website,
        address, city, state, country, pincode, latitude, longitude,
        theme_id, theme_overrides,
        show_business_hours, open_to_enquiries, open_to_appointments,
        status, published_at, view_count,
        themes ( config )
      `,
    )
    .eq("username", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();

  if (cardError) {
    console.error("[cards] card lookup failed", cardError.message);
    throw new CardNotFoundError(slug);
  }
  if (!cardRow) throw new CardNotFoundError(slug);

  const cardId = cardRow.id as string;

  // Round 2: content rows and the plan gate, all in parallel.
  const [
    gate,
    sections,
    socialLinks,
    businessHours,
    paymentConfig,
    services,
    products,
    catalogues,
    portfolio,
    gallery,
    videos,
    reviews,
    testimonials,
    offers,
  ] = await Promise.all([
    supabase.rpc("public_card_gate", { p_card_id: cardId }),
    supabase.from("card_sections").select("section_key, position, is_enabled, config").eq("card_id", cardId),
    supabase.from("social_links").select("id, platform, url, label, position, is_active").eq("card_id", cardId),
    supabase.from("business_hours").select("day_of_week, is_open, opens_at, closes_at").eq("card_id", cardId),
    supabase.from("payment_configs").select("upi_id, payee_name, note, is_active").eq("card_id", cardId).maybeSingle(),
    supabase.from("services").select("id, name, description, image_url, price_paise, cta_type, cta_label, cta_value, position, is_active").eq("card_id", cardId),
    supabase.from("products").select("id, name, description, image_url, original_price, sale_price, cta_type, cta_label, cta_value, position, is_active").eq("card_id", cardId),
    supabase
      .from("catalogues")
      .select("id, title, category, description, cover_url, position, is_active, catalogue_items ( id, name, description, image_url, price_paise, offer_paise, cta_type, cta_label, position, is_active )")
      .eq("card_id", cardId),
    supabase.from("portfolio_items").select("id, title, description, image_url, video_url, external_url, category, position, is_active").eq("card_id", cardId),
    supabase.from("gallery_items").select("id, image_url, caption, width, height, position").eq("card_id", cardId),
    supabase.from("videos").select("id, title, url, kind, thumbnail_url, position, is_active").eq("card_id", cardId),
    supabase.from("reviews").select("id, author_name, author_avatar, rating, body, is_active").eq("card_id", cardId),
    supabase.from("testimonials").select("id, author_name, author_designation, author_company, author_avatar, body, is_active").eq("card_id", cardId),
    supabase.from("offers").select("id, title, description, badge, expires_at, position, is_active").eq("card_id", cardId),
  ]);

  const firstError = [
    sections, socialLinks, businessHours, services, products,
    catalogues, portfolio, gallery, videos, reviews, testimonials, offers,
  ].find((result) => result.error)?.error;
  if (firstError) {
    console.error("[cards] content query failed", firstError.message);
  }

  const limits: PlanLimits = parsePlanLimits(gate.data);

  // An expired offer must not be advertised, so it is dropped here rather than
  // relying on the client to hide it.
  const now = Date.now();
  const liveOffers = active(offers.data).filter((offer) => {
    const expires = typeof offer.expires_at === "string" ? Date.parse(offer.expires_at) : NaN;
    return Number.isNaN(expires) || expires > now;
  });

  const mappedSections: CardSection[] = byPosition(
    (sections.data ?? [])
      .filter((row) => (SECTION_KEYS as readonly string[]).includes(row.section_key))
      .map((row) => ({
        key: row.section_key as SectionKey,
        enabled: row.is_enabled !== false,
        position: int(row.position) ?? 0,
        config: (row.config ?? {}) as Record<string, unknown>,
      })),
  );

  const mappedCatalogues = byPosition(active(catalogues.data ?? [])).map((row) => ({
    id: row.id as string,
    catalogueId: row.id as string,
    title: text(row.title) ?? "Catalogue",
    category: text(row.category) ?? "products",
    description: text(row.description),
    coverUrl: image(row.cover_url),
    position: int(row.position) ?? 0,
    items: byPosition(active(row.catalogue_items ?? [])).map((item) => ({
      id: item.id as string,
      name: text(item.name) ?? "Item",
      description: text(item.description),
      imageUrl: image(item.image_url),
      pricePaise: int(item.price_paise),
      offerPaise: int(item.offer_paise),
      ctaType: ctaType(item.cta_type),
      ctaLabel: text(item.cta_label),
      position: int(item.position) ?? 0,
    })),
  }));

  // Catalogue items are pooled across catalogues, so the cap applies to the sum.
  const cappedCatalogues =
    limits.max_catalogue_items < 0
      ? mappedCatalogues
      : (() => {
          let budget = limits.max_catalogue_items;
          return mappedCatalogues
            .map((catalogue) => {
              const items = catalogue.items.slice(0, Math.max(0, budget));
              budget -= items.length;
              return { ...catalogue, items };
            })
            .filter((catalogue) => catalogue.items.length > 0);
        })();

  // `themes` is a many-to-one embed, so PostgREST returns a single object rather
  // than an array even though the relationship is written as `themes (...)`.
  const themeRow = (cardRow.themes ?? null) as { config?: unknown } | null;

  const card: CardData = {
    id: cardId,
    username: (text(cardRow.username) ?? slug) as string,
    type: (cardRow.type as CardType) ?? "personal",
    fullName: text(cardRow.full_name) ?? "Unnamed",
    designation: text(cardRow.designation),
    company: text(cardRow.company),
    bio: text(cardRow.bio),
    photoUrl: image(cardRow.photo_url),
    coverUrl: image(cardRow.cover_url),
    logoUrl: image(cardRow.logo_url),

    phone: text(cardRow.phone)?.replace(/\D/g, "") ?? null,
    whatsapp: text(cardRow.whatsapp)?.replace(/\D/g, "") ?? null,
    email: text(cardRow.email),
    website: text(cardRow.website),

    address: text(cardRow.address),
    city: text(cardRow.city),
    state: text(cardRow.state),
    country: text(cardRow.country),
    pincode: text(cardRow.pincode),
    latitude: float(cardRow.latitude),
    longitude: float(cardRow.longitude),

    showBusinessHours: cardRow.show_business_hours !== false,
    openToEnquiries: cardRow.open_to_enquiries !== false,
    openToAppointments: cardRow.open_to_appointments !== false,

    showBranding: !limits.remove_branding,

    theme: resolveTheme(
      (themeRow?.config ?? null) as Record<string, unknown> | null,
      (cardRow.theme_overrides ?? null) as Record<string, unknown> | null,
    ),

    sections: mappedSections
      .map((section) => ({
        ...section,
        // A section the plan no longer covers is switched off here, so a
        // downgrade hides it on the live card immediately.
        enabled: section.enabled && allowsSection(limits, section.key),
      }))
      .filter((section) => section.enabled),

    socialLinks: byPosition(active(socialLinks.data ?? [])).map((row) => ({
      id: row.id as string,
      platform: text(row.platform) ?? "custom",
      url: text(row.url) ?? "#",
      label: text(row.label),
      position: int(row.position) ?? 0,
    })),

    services: clamp(
      byPosition(active(services.data ?? [])).map((row) => ({
        id: row.id as string,
        name: text(row.name) ?? "Service",
        description: text(row.description),
        imageUrl: image(row.image_url),
        pricePaise: int(row.price_paise),
        ctaType: ctaType(row.cta_type),
        ctaLabel: text(row.cta_label),
        ctaValue: text(row.cta_value),
        position: int(row.position) ?? 0,
      })),
      limits.max_services,
    ),

    products: clamp(
      byPosition(active(products.data ?? [])).map((row) => ({
        id: row.id as string,
        name: text(row.name) ?? "Product",
        description: text(row.description),
        imageUrl: image(row.image_url),
        originalPrice: int(row.original_price),
        salePrice: int(row.sale_price),
        ctaType: ctaType(row.cta_type),
        ctaLabel: text(row.cta_label),
        ctaValue: text(row.cta_value),
        position: int(row.position) ?? 0,
      })),
      limits.max_products,
    ),

    catalogues: cappedCatalogues,

    portfolio: clamp(
      byPosition(active(portfolio.data ?? [])).map((row) => ({
        id: row.id as string,
        title: text(row.title) ?? "Project",
        description: text(row.description),
        imageUrl: image(row.image_url),
        videoUrl: text(row.video_url),
        externalUrl: text(row.external_url),
        category: text(row.category),
        position: int(row.position) ?? 0,
      })),
      limits.max_portfolio_items,
    ),

    gallery: clamp(
      byPosition(gallery.data ?? [])
        .map((row) => ({
          id: row.id as string,
          imageUrl: image(row.image_url) ?? "",
          caption: text(row.caption),
          width: int(row.width),
          height: int(row.height),
          position: int(row.position) ?? 0,
        }))
        // A gallery row without a real URL cannot render, so drop it rather than
        // emit a broken image.
        .filter((item) => item.imageUrl !== ""),
      limits.max_gallery_items,
    ),

    videos: byPosition(active(videos.data ?? []))
      .map((row) => ({
        id: row.id as string,
        title: text(row.title) ?? "Video",
        url: text(row.url) ?? "",
        kind: text(row.kind) ?? "intro",
        thumbnailUrl: image(row.thumbnail_url),
        position: int(row.position) ?? 0,
      }))
      .filter((item) => item.url !== ""),

    // Business hours have a natural order (the day number), not a `position`.
    businessHours: (businessHours.data ?? [])
      .map((row): BusinessHour => ({
        dayOfWeek: int(row.day_of_week) ?? 0,
        isOpen: row.is_open !== false,
        opensAt: int(row.opens_at),
        closesAt: int(row.closes_at),
        is24h: row.is_open !== false && int(row.opens_at) === 0 && int(row.closes_at) === 1439,
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek),

    reviews: active(reviews.data ?? []).map((row) => ({
      id: row.id as string,
      authorName: text(row.author_name) ?? "Customer",
      authorAvatar: image(row.author_avatar),
      rating: Math.min(5, Math.max(1, int(row.rating) ?? 5)),
      body: text(row.body),
    })),

    testimonials: active(testimonials.data ?? []).map((row) => ({
      id: row.id as string,
      authorName: text(row.author_name) ?? "Client",
      authorDesignation: text(row.author_designation),
      authorCompany: text(row.author_company),
      authorAvatar: image(row.author_avatar),
      body: text(row.body) ?? "",
    })),

    offers: byPosition(
      liveOffers.map((row) => ({
        id: row.id as string,
        title: text(row.title) ?? "Offer",
        description: text(row.description),
        badge: text(row.badge),
        expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
        position: int(row.position) ?? 0,
      })),
    ),

    payment: paymentConfig.data
      ? {
          upiId: text(paymentConfig.data.upi_id),
          payeeName: text(paymentConfig.data.payee_name),
          note: text(paymentConfig.data.note),
          isActive: paymentConfig.data.is_active !== false,
        }
      : null,

    viewCount: int(cardRow.view_count) ?? 0,
    publishedAt: typeof cardRow.published_at === "string" ? cardRow.published_at : null,
  };

  return card;
}
