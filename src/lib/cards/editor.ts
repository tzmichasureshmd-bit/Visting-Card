import "server-only";

import { resolveTheme } from "@/lib/cards/theme";
import type {
  EditorCard,
  EditorExtras,
  EditorGalleryItem,
  EditorHour,
  EditorPayment,
  EditorProduct,
  EditorSection,
  EditorService,
  EditorSocial,
  EditorState,
  EditorTheme,
} from "@/lib/cards/editor-types";
import {
  SECTION_KEYS,
  type CardType,
  type CtaType,
  type SectionKey,
} from "@/lib/cards/types";
import { getUserPlan } from "@/lib/cards/limits";
import { createClient } from "@/lib/supabase/server";

/**
 * Editor read model: everything the builder needs for one card, in one pass.
 *
 * Unlike `getPublicCard` this runs on the owner's cookie-scoped session, so it
 * can read drafts and the account's own subscription. Ownership is still RLS's
 * job (`cards_read` → `can_manage_card`), with an explicit `user_id` filter on
 * top so a wrong id is simply "not found".
 */

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asCta(value: unknown): CtaType {
  return value === "whatsapp" ||
    value === "call" ||
    value === "website" ||
    value === "buy_now" ||
    value === "enquiry"
    ? value
    : "enquiry";
}

function byPosition<T extends { position: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

/** Only renderable image URLs — the same `https:` / root-relative boundary as the public read model. */
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

function cardType(value: unknown): CardType {
  return value === "personal" ||
    value === "professional" ||
    value === "business" ||
    value === "creator" ||
    value === "company"
    ? value
    : "personal";
}

/** Only `is_active` rows, so an inactive extra never shows up in the preview. */
function active<T extends { is_active?: boolean | null }>(rows: T[] | null): T[] {
  return (rows ?? []).filter((row) => row.is_active !== false);
}

/** Minutes → "HH:MM". */
function toTime(minutes: number | null): string | null {
  if (minutes === null || !Number.isFinite(minutes)) return null;
  const clamped = Math.min(1439, Math.max(0, Math.trunc(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function sectionKey(value: string): SectionKey | null {
  return (SECTION_KEYS as readonly string[]).includes(value) ? (value as SectionKey) : null;
}

export async function getEditorState(
  cardId: string,
  userId: string,
): Promise<EditorState | null> {
  const supabase = await createClient();

  const [
    cardResult,
    themesResult,
    sectionsResult,
    socialsResult,
    servicesResult,
    productsResult,
    paymentResult,
    hoursResult,
    galleryResult,
    catalogueResult,
    portfolioResult,
    videoResult,
    reviewResult,
    testimonialResult,
    offerResult,
  ] = await Promise.all([
      supabase
        .from("cards")
        .select(
          `id, type, username, full_name, designation, company, bio, photo_url,
           cover_url, logo_url,
           phone, whatsapp, email, website, address, city, state, country, pincode,
           latitude, longitude,
           status, published_at, view_count, theme_id, theme_overrides,
           show_business_hours, open_to_enquiries, open_to_appointments,
           themes ( slug, config )`,
        )
        .eq("id", cardId)
        .eq("user_id", userId)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("themes")
        .select("id, slug, name, is_premium, config")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase.from("card_sections").select("section_key, position, is_enabled").eq("card_id", cardId),
      supabase.from("social_links").select("id, platform, url, label, position").eq("card_id", cardId),
      supabase
        .from("services")
        .select("id, name, description, price_paise, cta_type, cta_label, cta_value, position")
        .eq("card_id", cardId),
      supabase
        .from("products")
        .select("id, name, description, original_price, sale_price, cta_type, cta_label, cta_value, position")
        .eq("card_id", cardId),
      supabase
        .from("payment_configs")
        .select("upi_id, payee_name, note, is_active")
        .eq("card_id", cardId)
        .maybeSingle(),
      supabase.from("business_hours").select("day_of_week, is_open, opens_at, closes_at").eq("card_id", cardId),
      supabase.from("gallery_items").select("id, image_url, caption, position").eq("card_id", cardId),
      supabase
        .from("catalogues")
        .select("id, title, category, description, cover_url, position, is_active, catalogue_items ( id, name, description, image_url, price_paise, offer_paise, cta_type, cta_label, position, is_active )")
        .eq("card_id", cardId),
      supabase
        .from("portfolio_items")
        .select("id, title, description, image_url, video_url, external_url, category, position, is_active")
        .eq("card_id", cardId),
      supabase
        .from("videos")
        .select("id, title, url, kind, thumbnail_url, position, is_active")
        .eq("card_id", cardId),
      supabase
        .from("reviews")
        .select("id, author_name, author_avatar, rating, body, is_active")
        .eq("card_id", cardId),
      supabase
        .from("testimonials")
        .select("id, author_name, author_designation, author_company, author_avatar, body, is_active")
        .eq("card_id", cardId),
      supabase
        .from("offers")
        .select("id, title, description, badge, expires_at, position, is_active")
        .eq("card_id", cardId),
    ]);

  const cardRow = cardResult.data;
  if (cardResult.error) {
    console.error("[cards] editor card lookup failed", cardResult.error.message);
    return null;
  }
  if (!cardRow) return null;

  const firstError = [
    themesResult, sectionsResult, socialsResult, servicesResult, productsResult,
    paymentResult, hoursResult, galleryResult, catalogueResult, portfolioResult,
    videoResult, reviewResult, testimonialResult, offerResult,
  ].find((result) => result.error)?.error;
  if (firstError) console.error("[cards] editor content lookup failed", firstError.message);

  // `themes` is many-to-one, so PostgREST returns an object, not an array.
  const activeTheme = (cardRow.themes ?? null) as { slug?: string; config?: unknown } | null;
  const themeOverrides = (cardRow.theme_overrides ?? null) as Record<string, unknown> | null;

  const themes: EditorTheme[] = (themesResult.data ?? []).map((row) => ({
    id: row.id as string,
    slug: String(row.slug),
    name: String(row.name),
    isPremium: row.is_premium === true,
    config: (row.config ?? {}) as Record<string, unknown>,
  }));

  // The card's own theme config, even if the theme row was deactivated later.
  const currentConfig =
    (activeTheme?.config ?? themes.find((t) => t.id === cardRow.theme_id)?.config ?? null) as
      | Record<string, unknown>
      | null;

  const sections: EditorSection[] = (sectionsResult.data ?? [])
    .map((row) => ({ key: sectionKey(String(row.section_key)), enabled: row.is_enabled !== false, position: Number(row.position) || 0 }))
    .filter((row): row is EditorSection => row.key !== null)
    .sort((a, b) => a.position - b.position);

  const socials: EditorSocial[] = byPosition(
    (socialsResult.data ?? []).map((row) => ({
      id: String(row.id),
      platform: text(row.platform) ?? "custom",
      url: text(row.url) ?? "",
      label: text(row.label),
      position: Number(row.position) || 0,
    })),
  );

  const services: EditorService[] = byPosition(
    (servicesResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: text(row.name) ?? "",
      description: text(row.description),
      pricePaise: typeof row.price_paise === "number" ? row.price_paise : null,
      ctaType: asCta(row.cta_type),
      ctaLabel: text(row.cta_label),
      ctaValue: text(row.cta_value),
      position: Number(row.position) || 0,
    })),
  );

  const products: EditorProduct[] = byPosition(
    (productsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: text(row.name) ?? "",
      description: text(row.description),
      originalPrice: typeof row.original_price === "number" ? row.original_price : null,
      salePrice: typeof row.sale_price === "number" ? row.sale_price : null,
      ctaType: asCta(row.cta_type),
      ctaLabel: text(row.cta_label),
      ctaValue: text(row.cta_value),
      position: Number(row.position) || 0,
    })),
  );

  const paymentRow = paymentResult.data;
  const payment: EditorPayment | null = paymentRow
    ? {
        upiId: text(paymentRow.upi_id) ?? "",
        payeeName: text(paymentRow.payee_name),
        note: text(paymentRow.note),
        isActive: paymentRow.is_active !== false,
      }
    : null;

  const hours: EditorHour[] = (hoursResult.data ?? [])
    .map((row): EditorHour => {
      const opens = typeof row.opens_at === "number" ? row.opens_at : null;
      const closes = typeof row.closes_at === "number" ? row.closes_at : null;
      const is24h = row.is_open !== false && opens === 0 && closes === 1439;
      return {
        dayOfWeek: Number(row.day_of_week) || 0,
        isOpen: row.is_open !== false,
        opensAt: toTime(opens ?? 540),
        closesAt: toTime(closes ?? 1110),
        is24h,
      };
    })
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const gallery: EditorGalleryItem[] = byPosition(
    (galleryResult.data ?? [])
      .map((row) => ({
        id: String(row.id),
        imageUrl: text(row.image_url) ?? "",
        caption: text(row.caption),
        position: Number(row.position) || 0,
      }))
      .filter((row) => row.imageUrl !== ""),
  ).map((row) => ({ id: row.id, imageUrl: row.imageUrl, caption: row.caption }));

  // Collections with no builder form yet, shaped exactly as the public read
  // model so the preview is the real renderer fed real rows.
  const extras: EditorExtras = {
    catalogues: byPosition(active(catalogueResult.data)).map((row) => ({
      id: String(row.id),
      catalogueId: String(row.id),
      title: text(row.title) ?? "Catalogue",
      category: text(row.category) ?? "products",
      description: text(row.description),
      coverUrl: image(row.cover_url),
      position: int(row.position) ?? 0,
      items: byPosition(active(row.catalogue_items ?? [])).map((item) => ({
        id: String(item.id),
        name: text(item.name) ?? "Item",
        description: text(item.description),
        imageUrl: image(item.image_url),
        pricePaise: int(item.price_paise),
        offerPaise: int(item.offer_paise),
        ctaType: asCta(item.cta_type),
        ctaLabel: text(item.cta_label),
        position: int(item.position) ?? 0,
      })),
    })),

    portfolio: byPosition(active(portfolioResult.data)).map((row) => ({
      id: String(row.id),
      title: text(row.title) ?? "Project",
      description: text(row.description),
      imageUrl: image(row.image_url),
      videoUrl: text(row.video_url),
      externalUrl: text(row.external_url),
      category: text(row.category),
      position: int(row.position) ?? 0,
    })),

    videos: byPosition(active(videoResult.data))
      .map((row) => ({
        id: String(row.id),
        title: text(row.title) ?? "Video",
        url: text(row.url) ?? "",
        kind: text(row.kind) ?? "intro",
        thumbnailUrl: image(row.thumbnail_url),
        position: int(row.position) ?? 0,
      }))
      .filter((row) => row.url !== ""),

    reviews: active(reviewResult.data).map((row) => ({
      id: String(row.id),
      authorName: text(row.author_name) ?? "Customer",
      authorAvatar: image(row.author_avatar),
      rating: Math.min(5, Math.max(1, int(row.rating) ?? 5)),
      body: text(row.body),
    })),

    testimonials: active(testimonialResult.data).map((row) => ({
      id: String(row.id),
      authorName: text(row.author_name) ?? "Client",
      authorDesignation: text(row.author_designation),
      authorCompany: text(row.author_company),
      authorAvatar: image(row.author_avatar),
      body: text(row.body) ?? "",
    })),

    // An expired offer must not be advertised, so it is dropped here rather than
    // relying on the client to hide it.
    offers: byPosition(
      active(offerResult.data)
        .filter((row) => {
          const expires = typeof row.expires_at === "string" ? Date.parse(row.expires_at) : NaN;
          return Number.isNaN(expires) || expires > Date.now();
        })
        .map((row) => ({
          id: String(row.id),
          title: text(row.title) ?? "Offer",
          description: text(row.description),
          badge: text(row.badge),
          expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
          position: int(row.position) ?? 0,
        })),
    ),
  };

  const plan = await getUserPlan(supabase, userId);

  const card: EditorCard = {
    id: String(cardRow.id),
    username: text(cardRow.username) ?? "",
    type: cardType(cardRow.type),
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
    viewCount: int(cardRow.view_count) ?? 0,
    publishedAt: typeof cardRow.published_at === "string" ? cardRow.published_at : null,
    status: cardRow.status === "published" ? "published" : cardRow.status === "suspended" ? "suspended" : "draft",
    showBusinessHours: cardRow.show_business_hours !== false,
    openToEnquiries: cardRow.open_to_enquiries !== false,
    openToAppointments: cardRow.open_to_appointments !== false,
    themeId: typeof cardRow.theme_id === "string" ? cardRow.theme_id : null,
  };

  return {
    card,
    sections,
    socials,
    services,
    products,
    hours,
    payment,
    gallery,
    themes,
    extras,
    theme: resolveTheme(currentConfig, themeOverrides),
    plan: { slug: plan.slug, name: plan.name, limits: plan.limits },
  };
}
