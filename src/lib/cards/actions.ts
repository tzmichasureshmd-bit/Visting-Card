"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { requireUser } from "@/lib/auth/session";
import { countUserCards, getUserPlan } from "@/lib/cards/limits";
import {
  businessHourRowSchema,
  cardUpdateSchema,
  onboardingSchema,
  paymentSchema,
  productRowSchema,
  profileUpdateSchema,
  sectionKeySchema,
  serviceRowSchema,
  socialRowSchema,
} from "@/lib/cards/schema";
import { LEAD_STATUSES, SECTION_KEYS, type LeadStatus, type SectionKey } from "@/lib/cards/types";
import { allowsSection, limitReached, lockedReason } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fail, fieldErrors, readThemeSlug, type ActionResult } from "@/lib/validation";
import { suggestUsernames, validateUsername } from "@/lib/utils";

/**
 * Card write layer — the only place `cards` and its content tables are
 * mutated from the app.
 *
 * Every action follows the same shape:
 *
 *   1. rate limit on the client IP
 *   2. authenticate with `requireUser()` (redirects anonymous callers to login)
 *   3. parse input through the Zod schemas in `@/lib/cards/schema`
 *   4. resolve the account's plan limits and enforce them before inserting
 *   5. write, then translate any database error into copy written for a person
 *
 * RLS is the second line of defence, not the first: each action also scopes its
 * statements to the caller's own card, so a wrong id fails as "not found"
 * rather than silently succeeding through a policy gap.
 *
 * Deliberately no `revalidatePath` and no timers here — navigation after a
 * write is done by the client (`router.refresh()` or a `redirect()`), which
 * keeps these actions safe to run during a build.
 */

const WINDOW_MS = 60_000;

/**
 * `FormData.get` returns `null` for a missing field (and a `File` if a file
 * input shares the name); the Zod string schemas expect strings, so every text
 * field is read through this.
 */
function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function limit(key: string, max: number): Promise<string | null> {
  const h = await headers();
  const result = rateLimit(`${key}:${clientIp(h)}`, max, WINDOW_MS);
  if (!result.allowed) {
    return `Too many attempts. Please wait ${result.retryAfter} seconds and try again.`;
  }
  return null;
}

/** Parse-or-fail, producing the same failure shape as the auth actions. */
function parse<T>(
  schema: { safeParse(input: unknown): { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } },
  input: unknown,
): { data: T } | { failure: ActionResult<never> } {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data };

  const fields = fieldErrors(result.error as never);
  const first = result.error.issues[0]?.message ?? "Please check the details below.";
  return { failure: fail(Object.keys(fields).length ? "Please check the details below." : first, Object.keys(fields).length ? fields : undefined) };
}

interface OwnedCard {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  card: { id: string; username: string; status: string; full_name: string };
}

/**
 * Authenticate, then fetch one of the caller's cards.
 *
 * RLS already hides other people's cards; selecting by id after `requireUser()`
 * turns "not yours" and "does not exist" into the same safe answer.
 */
async function ownedCard(cardId: string): Promise<OwnedCard | { failure: ActionResult<never> }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select("id, username, status, full_name")
    .eq("id", cardId)
    // `cards_read` also exposes other people's *published* cards, so scoping to
    // the caller keeps "not yours" and "does not exist" the same answer.
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { failure: fail("We could not load that card. Please try again.") };
  }
  if (!data) {
    return { failure: fail("That card could not be found.") };
  }

  return { supabase, userId: user.id, card: data };
}

function isFailure(
  value: OwnedCard | { failure: ActionResult<never> },
): value is { failure: ActionResult<never> } {
  return "failure" in value;
}

/* ── Images ────────────────────────────────────────────────────────────────── */

const IMAGE_TYPES: Record<string, { types: string[]; maxBytes: number }> = {
  avatars: { types: ["image/jpeg", "image/png", "image/webp", "image/avif"], maxBytes: 5 * 1024 * 1024 },
  gallery: { types: ["image/jpeg", "image/png", "image/webp", "image/avif"], maxBytes: 10 * 1024 * 1024 },
};

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/** Validate a picked image and return the storage path convention for it. */
function readImage(
  file: unknown,
  bucket: keyof typeof IMAGE_TYPES,
  pathFor: (ext: string) => string,
): { path: string; file: File } | { failure: string } | null {
  if (!(file instanceof File) || file.size === 0) return null;

  const rules = IMAGE_TYPES[bucket];
  if (!rules.types.includes(file.type)) {
    return { failure: "Please choose a JPG, PNG, WebP or AVIF image." };
  }
  if (file.size > rules.maxBytes) {
    const mb = Math.round(rules.maxBytes / (1024 * 1024));
    return { failure: `That image is over ${mb} MB. Please choose a smaller file.` };
  }

  return { path: pathFor(EXTENSIONS[file.type] ?? "jpg"), file };
}

async function uploadImage(
  supabase: OwnedCard["supabase"],
  bucket: keyof typeof IMAGE_TYPES,
  path: string,
  file: File,
): Promise<{ url: string } | { failure: string }> {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) {
    console.error("[cards] upload failed", error.message);
    return { failure: "That image could not be uploaded. Please try another file." };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

/* ── Usernames ─────────────────────────────────────────────────────────────── */

/** Derived candidates for a new card: name → slug, then gentle suffixes. */
function derivedUsernames(fullName: string): string[] {
  const base =
    fullName
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "";

  const prefixed = /^[a-z]/.test(base) || !base ? base : `card-${base}`;
  const stem = (prefixed.slice(0, 24).replace(/-+$/, "") || "my-card");

  const candidates = [stem, `${stem}-card`, `${stem}-1`];
  return candidates.filter((candidate) => "value" in validateUsername(candidate));
}

/** Detect Postgres' unique-violation — the username someone else already holds. */
function isDuplicate(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

/* ── Create ────────────────────────────────────────────────────────────────── */

/** Sections seeded for every new card. Empty sections never render, so seeding
 *  the sensible set keeps the card clean while making the builder's section
 *  list immediately useful. */
const DEFAULT_SECTIONS: readonly SectionKey[] = [
  "about",
  "contact",
  "social",
  "services",
  "products",
  "gallery",
  "location",
  "business_hours",
  "reviews",
  "enquiry",
  "payment",
];

/** The style every card falls back to when no valid choice was made. */
const DEFAULT_THEME_SLUG = "minimal";

/**
 * Onboarding step 2 — creates the card.
 *
 * The username is derived from the name rather than asked for: the brief wants
 * two short steps, and a handle can be changed later in the builder. Candidates
 * are attempted against the unique index, so a collision simply moves to the
 * next suffix — no pre-read, no race.
 */
export async function createCardAction(
  _prev: ActionResult<{ cardId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ cardId: string }>> {
  const blocked = await limit("card-create", 5);
  if (blocked) return fail(blocked);

  const user = await requireUser();
  const parsed = parse(onboardingSchema, {
    fullName: text(formData, "fullName"),
    designation: text(formData, "designation"),
    bio: text(formData, "bio"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    city: text(formData, "city"),
  });
  if ("failure" in parsed) return parsed.failure;
  const values = parsed.data;

  const supabase = await createClient();
  const plan = await getUserPlan(supabase, user.id);
  const used = await countUserCards(supabase, user.id);

  if (limitReached(plan.limits.max_cards, used)) {
    const allowed = plan.limits.max_cards;
    return fail(
      `Your ${plan.name} plan includes ${allowed} card${allowed === 1 ? "" : "s"}. Upgrade to create another one.`,
    );
  }

  // The style a brand-new card starts on: the one picked in the template
  // gallery, or the default. `resolveTheme` covers a null id, but starting from
  // a real theme makes the builder's style picker meaningful.
  const requestedSlug = readThemeSlug(text(formData, "themeSlug")) || DEFAULT_THEME_SLUG;
  const { data: themeRows } = await supabase
    .from("themes")
    .select("id, slug, is_premium")
    .in("slug", [requestedSlug, DEFAULT_THEME_SLUG])
    .eq("is_active", true);

  // A premium style the plan cannot use falls back to the default instead of
  // failing: someone who clicked a Pro template while on the free plan should
  // still get their card, just on a style their plan includes.
  const themeId =
    themeRows?.find(
      (row) => row.slug === requestedSlug && (!row.is_premium || plan.limits.premium_themes),
    )?.id ??
    themeRows?.find((row) => row.slug === DEFAULT_THEME_SLUG)?.id ??
    null;

  const basePayload = {
    user_id: user.id,
    full_name: values.fullName,
    designation: values.designation || null,
    bio: values.bio || null,
    phone: values.phone || null,
    whatsapp: values.whatsapp || null,
    email: values.email || null,
    city: values.city || null,
    type: "personal",
    status: "draft",
    theme_id: themeId,
  } as const;

  const candidates = derivedUsernames(values.fullName);
  if (candidates.length === 0) {
    // Unreachable in practice (the stem always yields a valid fallback), but a
    // name that somehow produces no candidate must not loop silently.
    candidates.push(`my-card-${Date.now().toString(36).slice(-4)}`);
  }
  let cardId: string | null = null;
  let lastError: { message: string } | null = null;

  for (const username of candidates) {
    const { data, error } = await supabase
      .from("cards")
      .insert({ ...basePayload, username })
      .select("id")
      .single();

    if (data) {
      cardId = data.id;
      break;
    }
    if (isDuplicate(error)) continue;
    lastError = error;
    break;
  }

  if (!cardId) {
    console.error("[cards] create failed", lastError?.message, lastError);
    if (lastError) return fail("We could not create your card. Please try again.");
    return fail("That username is already taken. Please try again.");
  }

  // Seed the default sections. A failure here would leave an empty section
  // list (the builder re-creates rows on demand), so it must not undo the card.
  const { error: sectionError } = await supabase.from("card_sections").insert(
    DEFAULT_SECTIONS.map((key, index) => ({
      card_id: cardId,
      section_key: key,
      position: (index + 1) * 10,
      is_enabled: true,
    })),
  );
  if (sectionError) console.error("[cards] default sections failed", sectionError.message);

  // Optional profile photo, uploaded after the card exists because the storage
  // path convention embeds the card id.
  const photo = readImage(formData.get("photo"), "avatars", (ext) =>
    `${user.id}/${cardId}/avatar-${Date.now()}.${ext}`,
  );
  if (photo && "failure" in photo) return fail(photo.failure);
  if (photo) {
    const uploaded = await uploadImage(supabase, "avatars", photo.path, photo.file);
    if ("url" in uploaded) {
      await supabase.from("cards").update({ photo_url: uploaded.url }).eq("id", cardId);
    }
    // An upload failure is not worth failing the whole signup: the card exists
    // and the photo can be added from the builder.
  }

  return { ok: true, data: { cardId } };
}

/* ── Update ────────────────────────────────────────────────────────────────── */

/**
 * Builder → "Your details".
 *
 * Same fields as onboarding plus the card id and an optional username change.
 * A taken username comes back with real suggestions rather than a bare error.
 */
export async function updateCardAction(
  _prev: ActionResult<{ cardId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ cardId: string }>> {
  const blocked = await limit("card-update", 30);
  if (blocked) return fail(blocked);

  const parsed = parse(cardUpdateSchema, {
    cardId: text(formData, "cardId"),
    fullName: text(formData, "fullName"),
    username: text(formData, "username"),
    designation: text(formData, "designation"),
    company: text(formData, "company"),
    bio: text(formData, "bio"),
    phone: text(formData, "phone"),
    whatsapp: text(formData, "whatsapp"),
    email: text(formData, "email"),
    website: text(formData, "website"),
    address: text(formData, "address"),
    city: text(formData, "city"),
    state: text(formData, "state"),
    pincode: text(formData, "pincode"),
  });
  if ("failure" in parsed) return parsed.failure;
  const values = parsed.data;

  const owner = await ownedCard(values.cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card } = owner;

  let username = card.username;
  const requested = values.username.trim().toLowerCase();
  if (requested && requested !== card.username) {
    const check = validateUsername(requested);
    if ("error" in check) {
      return fail("Please check the details below.", { username: check.error });
    }
    username = check.value;
  }

  const { data, error } = await supabase
    .from("cards")
    .update({
      username,
      full_name: values.fullName,
      designation: values.designation || null,
      company: values.company || null,
      bio: values.bio || null,
      phone: values.phone || null,
      whatsapp: values.whatsapp || null,
      email: values.email || null,
      website: values.website || null,
      address: values.address || null,
      city: values.city || null,
      state: values.state || null,
      pincode: values.pincode || null,
    })
    .eq("id", card.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isDuplicate(error)) {
      const suggestions = suggestUsernames(requested, values.fullName);
      return fail(
        suggestions.length
          ? `The username “${requested}” is taken. Try: ${suggestions.slice(0, 3).join(", ")}`
          : "That username is already taken. Please choose another.",
        { username: "That username is already taken." },
      );
    }
    console.error("[cards] update failed", error.message);
    return fail("We could not save your changes. Please try again.");
  }
  if (!data) return fail("That card could not be found.");

  return { ok: true, data: { cardId: card.id }, message: "Saved." };
}

/* ── Style ─────────────────────────────────────────────────────────────────── */

/**
 * Apply one of the seeded styles by slug.
 *
 * Switching resets `theme_overrides` as well: the style picker sells a complete
 * look, and stale colour overrides from the previous style would silently
 * defeat it. Premium styles are gated against the account's plan.
 */
export async function setCardThemeAction(
  cardId: string,
  themeSlug: string,
): Promise<ActionResult<{ themeSlug: string }>> {
  const blocked = await limit("card-theme", 30);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase } = owner;

  const { data: theme, error } = await supabase
    .from("themes")
    .select("id, is_premium")
    .eq("slug", themeSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return fail("We could not load that style. Please try again.");
  if (!theme) return fail("That style is not available.");

  if (theme.is_premium) {
    const plan = await getUserPlan(supabase, owner.userId);
    if (!plan.limits.premium_themes) {
      return fail("Premium styles are available on the Pro plan and above.");
    }
  }

  const { error: updateError } = await supabase
    .from("cards")
    .update({ theme_id: theme.id, theme_overrides: {} })
    .eq("id", cardId);

  if (updateError) {
    console.error("[cards] theme update failed", updateError.message);
    return fail("We could not save that style. Please try again.");
  }

  return { ok: true, data: { themeSlug } };
}

/* ── Sections ──────────────────────────────────────────────────────────────── */

/**
 * Add or remove one section from the card.
 *
 * Enabling checks the plan first (a catalogue section on the Free plan fails
 * with the shared `lockedReason` copy), and the row is upserted rather than
 * assumed: a section can be toggled before any row exists.
 */
export async function setSectionEnabledAction(
  cardId: string,
  key: SectionKey,
  enabled: boolean,
): Promise<ActionResult<{ key: SectionKey; enabled: boolean }>> {
  const blocked = await limit("card-section", 60);
  if (blocked) return fail(blocked);

  const parsedKey = sectionKeySchema.safeParse(key);
  if (!parsedKey.success) return fail("That section does not exist.");

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, userId } = owner;

  if (enabled) {
    const plan = await getUserPlan(supabase, userId);
    if (!allowsSection(plan.limits, parsedKey.data)) {
      return fail(lockedReason(plan.limits, parsedKey.data) ?? "This section is not in your plan.");
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("card_sections")
    .update({ is_enabled: enabled })
    .eq("card_id", cardId)
    .eq("section_key", parsedKey.data)
    .select("id");

  if (updateError) {
    console.error("[cards] section update failed", updateError.message);
    return fail("We could not save that section. Please try again.");
  }

  if (updated && updated.length > 0) {
    return { ok: true, data: { key: parsedKey.data, enabled } };
  }

  // No row yet — place it at the end of the current order.
  const { data: last } = await supabase
    .from("card_sections")
    .select("position")
    .eq("card_id", cardId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = ((last?.position as number | undefined) ?? 0) + 10;
  const { error: insertError } = await supabase.from("card_sections").insert({
    card_id: cardId,
    section_key: parsedKey.data,
    position,
    is_enabled: enabled,
  });

  if (insertError) {
    console.error("[cards] section insert failed", insertError.message);
    return fail("We could not add that section. Please try again.");
  }

  return { ok: true, data: { key: parsedKey.data, enabled } };
}

/**
 * Persist a new section order.
 *
 * `keys` is the complete list in its intended order, which makes the write
 * idempotent and lets the panel treat a drag as a whole-order replacement rather
 * than a stream of position deltas that can half-apply.
 *
 * Two invariants are enforced here rather than trusted from the client: every key
 * must be a real section key, and none may repeat. Anything outside
 * `SECTION_KEYS` is rejected outright rather than skipped — a partial save would
 * silently drop sections the owner can see in the builder.
 *
 * Sections the owner has never touched have no row, so they are upserted with
 * `is_enabled: true`, matching `isSectionEnabled`'s default for a missing row.
 */
export async function reorderCardSectionsAction(
  cardId: string,
  keys: string[],
): Promise<ActionResult<{ order: SectionKey[] }>> {
  const blocked = await limit("card-section", 60);
  if (blocked) return fail(blocked);

  const parsed = z.array(sectionKeySchema).safeParse(keys);
  if (!parsed.success) return fail("That section order is not valid.");
  if (parsed.data.length !== SECTION_KEYS.length) {
    return fail("Please send every section in the new order.");
  }
  if (new Set(parsed.data).size !== parsed.data.length) {
    return fail("That section order repeats a section.");
  }

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase } = owner;

  const { data: existing } = await supabase
    .from("card_sections")
    .select("section_key, is_enabled")
    .eq("card_id", cardId);

  const enabledByKey = new Map(
    (existing ?? []).map((row) => [
      String(row.section_key),
      Boolean(row.is_enabled),
    ]),
  );

  const rows = parsed.data.map((key, index) => ({
    card_id: cardId,
    section_key: key,
    // Gaps of 10 leave room to insert later without renumbering the whole list.
    position: (index + 1) * 10,
    // Preserve whatever the toggle set; default to enabled for a section that
    // has never been toggled, which is what the renderer assumes today.
    is_enabled: enabledByKey.get(key) ?? true,
  }));

  const { error } = await supabase
    .from("card_sections")
    .upsert(rows, { onConflict: "card_id,section_key" });

  if (error) {
    console.error("[cards] section reorder failed", error.message);
    return fail("We could not save the new order. Please try again.");
  }

  return { ok: true, data: { order: parsed.data } };
}

/** Every section key with its current toggle state — feeds the builder panel. */
export async function getCardSections(
  cardId: string,
): Promise<ActionResult<{ enabled: SectionKey[] }>> {
  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase } = owner;

  const { data, error } = await supabase
    .from("card_sections")
    .select("section_key, is_enabled")
    .eq("card_id", cardId);

  if (error) return fail("We could not load your sections.");

  const enabled = (data ?? [])
    .filter((row) => row.is_enabled !== false)
    .map((row) => row.section_key)
    .filter((key): key is SectionKey => (SECTION_KEYS as readonly string[]).includes(key));

  return { ok: true, data: { enabled } };
}

/* ── Content: social links ─────────────────────────────────────────────────── */

export async function saveSocialLinksAction(input: {
  cardId: string;
  rows: unknown;
}): Promise<ActionResult<{ count: number }>> {
  const blocked = await limit("card-social", 30);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(input.cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card } = owner;

  const parsed = parse(
    socialRowSchema.array().max(20, "You can add up to 20 links."),
    input.rows,
  );
  if ("failure" in parsed) return parsed.failure;

  const { error: deleteError } = await supabase
    .from("social_links")
    .delete()
    .eq("card_id", card.id);
  if (deleteError) {
    console.error("[cards] social links replace failed", deleteError.message);
    return fail("We could not save your links. Please try again.");
  }

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("social_links").insert(
      parsed.data.map((row, index) => ({
        card_id: card.id,
        platform: row.platform || "custom",
        url: row.url,
        label: row.label || null,
        position: (index + 1) * 10,
      })),
    );
    if (error) {
      console.error("[cards] social links insert failed", error.message);
      return fail("We could not save your links. Please try again.");
    }
  }

  return { ok: true, data: { count: parsed.data.length } };
}

/* ── Content: services ─────────────────────────────────────────────────────── */

export async function saveServicesAction(input: {
  cardId: string;
  rows: unknown;
}): Promise<ActionResult<{ count: number }>> {
  const blocked = await limit("card-services", 30);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(input.cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card, userId } = owner;

  const plan = await getUserPlan(supabase, userId);
  const max = plan.limits.max_services < 0 ? 100 : plan.limits.max_services;
  const parsed = parse(
    serviceRowSchema.array().max(max, `Your ${plan.name} plan allows up to ${max} services.`),
    input.rows,
  );
  if ("failure" in parsed) return parsed.failure;

  const { error: deleteError } = await supabase.from("services").delete().eq("card_id", card.id);
  if (deleteError) {
    console.error("[cards] services replace failed", deleteError.message);
    return fail("We could not save your services. Please try again.");
  }

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("services").insert(
      parsed.data.map((row, index) => ({
        card_id: card.id,
        name: row.name,
        description: row.description || null,
        price_paise: row.pricePaise ?? null,
        cta_type: row.ctaType,
        cta_label: row.ctaLabel || null,
        cta_value: row.ctaValue || null,
        position: (index + 1) * 10,
      })),
    );
    if (error) {
      console.error("[cards] services insert failed", error.message);
      return fail("We could not save your services. Please try again.");
    }
  }

  return { ok: true, data: { count: parsed.data.length } };
}

/* ── Content: products ─────────────────────────────────────────────────────── */

export async function saveProductsAction(input: {
  cardId: string;
  rows: unknown;
}): Promise<ActionResult<{ count: number }>> {
  const blocked = await limit("card-products", 30);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(input.cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card, userId } = owner;

  const plan = await getUserPlan(supabase, userId);
  const max = plan.limits.max_products < 0 ? 100 : plan.limits.max_products;
  const parsed = parse(
    productRowSchema.array().max(max, `Your ${plan.name} plan allows up to ${max} products.`),
    input.rows,
  );
  if ("failure" in parsed) return parsed.failure;

  const { error: deleteError } = await supabase.from("products").delete().eq("card_id", card.id);
  if (deleteError) {
    console.error("[cards] products replace failed", deleteError.message);
    return fail("We could not save your products. Please try again.");
  }

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("products").insert(
      parsed.data.map((row, index) => ({
        card_id: card.id,
        name: row.name,
        description: row.description || null,
        original_price: row.originalPrice ?? null,
        sale_price: row.salePrice ?? null,
        cta_type: row.ctaType,
        cta_label: row.ctaLabel || null,
        cta_value: row.ctaValue || null,
        position: (index + 1) * 10,
      })),
    );
    if (error) {
      console.error("[cards] products insert failed", error.message);
      return fail("We could not save your products. Please try again.");
    }
  }

  return { ok: true, data: { count: parsed.data.length } };
}

/* ── Content: UPI payment ──────────────────────────────────────────────────── */

/** Upsert (or clear) the card's single UPI configuration. */
export async function savePaymentAction(
  _prev: ActionResult<{ active: boolean }> | null,
  formData: FormData,
): Promise<ActionResult<{ active: boolean }>> {
  const blocked = await limit("card-payment", 30);
  if (blocked) return fail(blocked);

  const parsed = parse(paymentSchema, {
    cardId: text(formData, "cardId"),
    upiId: text(formData, "upiId"),
    payeeName: text(formData, "payeeName"),
    note: text(formData, "note"),
    isActive: text(formData, "isActive") || "true",
  });
  if ("failure" in parsed) return parsed.failure;
  const values = parsed.data;

  const owner = await ownedCard(values.cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card, userId } = owner;

  const plan = await getUserPlan(supabase, userId);
  if (!allowsSection(plan.limits, "payment")) {
    return fail(lockedReason(plan.limits, "payment") ?? "UPI payments are not in your plan.");
  }

  // No UPI id means no section: remove the row rather than keep a blank config
  // that would satisfy `sectionHasContent` checks with nothing to show.
  if (!values.upiId) {
    const { error } = await supabase.from("payment_configs").delete().eq("card_id", card.id);
    if (error) {
      console.error("[cards] payment clear failed", error.message);
      return fail("We could not save your payment settings. Please try again.");
    }
    return { ok: true, data: { active: false } };
  }

  const { error } = await supabase.from("payment_configs").upsert(
    {
      card_id: card.id,
      upi_id: values.upiId,
      payee_name: values.payeeName || null,
      note: values.note || null,
      is_active: values.isActive,
    },
    { onConflict: "card_id" },
  );

  if (error) {
    console.error("[cards] payment upsert failed", error.message);
    return fail("We could not save your payment settings. Please try again.");
  }

  return { ok: true, data: { active: values.isActive } };
}

/* ── Content: business hours ───────────────────────────────────────────────── */

function toMinutes(value: string | null): number | null {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return Math.min(1439, hours * 60 + minutes);
}

/** Replace the weekly hours grid (7 rows, one per day). */
export async function saveBusinessHoursAction(input: {
  cardId: string;
  rows: unknown;
}): Promise<ActionResult<{ count: number }>> {
  const blocked = await limit("card-hours", 30);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(input.cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card } = owner;

  const parsed = parse(
    businessHourRowSchema.array().max(7, "A week has seven days."),
    input.rows,
  );
  if ("failure" in parsed) return parsed.failure;

  const { error: deleteError } = await supabase
    .from("business_hours")
    .delete()
    .eq("card_id", card.id);
  if (deleteError) {
    console.error("[cards] hours replace failed", deleteError.message);
    return fail("We could not save your hours. Please try again.");
  }

  if (parsed.data.length > 0) {
    const { error } = await supabase.from("business_hours").insert(
      parsed.data.map((row) => {
        const opensAt = row.is24h ? 0 : toMinutes(row.opensAt);
        const closesAt = row.is24h ? 1439 : toMinutes(row.closesAt);
        return {
          card_id: card.id,
          day_of_week: row.dayOfWeek,
          is_open: row.isOpen,
          opens_at: row.isOpen ? opensAt : null,
          closes_at: row.isOpen ? closesAt : null,
          is_24h: row.isOpen && (row.is24h || (opensAt === 0 && closesAt === 1439)),
        };
      }),
    );
    if (error) {
      console.error("[cards] hours insert failed", error.message);
      return fail("We could not save your hours. Please try again.");
    }
  }

  return { ok: true, data: { count: parsed.data.length } };
}

/* ── Photos ────────────────────────────────────────────────────────────────── */

/**
 * Set (or clear) the profile photo from the builder.
 * Returns the new URL so the live preview updates without a full reload.
 */
export async function uploadProfilePhotoAction(
  cardId: string,
  formData: FormData,
): Promise<ActionResult<{ photoUrl: string | null }>> {
  const blocked = await limit("card-photo", 20);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, userId, card } = owner;

  if (formData.get("remove") === "true") {
    const { error } = await supabase
      .from("cards")
      .update({ photo_url: null })
      .eq("id", card.id);
    if (error) return fail("We could not remove that photo. Please try again.");
    return { ok: true, data: { photoUrl: null } };
  }

  const photo = readImage(formData.get("photo"), "avatars", (ext) =>
    `${userId}/${card.id}/avatar-${Date.now()}.${ext}`,
  );
  if (photo && "failure" in photo) return fail(photo.failure);
  if (!photo) return fail("Please choose an image to upload.");

  const uploaded = await uploadImage(supabase, "avatars", photo.path, photo.file);
  if ("failure" in uploaded) return fail(uploaded.failure);

  const { error } = await supabase
    .from("cards")
    .update({ photo_url: uploaded.url })
    .eq("id", card.id);
  if (error) return fail("We could not save that photo. Please try again.");

  return { ok: true, data: { photoUrl: uploaded.url } };
}

/** Add one gallery image. Inserted with the dimensions left for a future pass. */
export async function addGalleryImageAction(
  cardId: string,
  formData: FormData,
): Promise<ActionResult<{ imageUrl: string }>> {
  const blocked = await limit("card-gallery", 20);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, userId, card } = owner;

  const plan = await getUserPlan(supabase, owner.userId);
  const max = plan.limits.max_gallery_items;

  if (max >= 0) {
    const { count } = await supabase
      .from("gallery_items")
      .select("id", { count: "exact", head: true })
      .eq("card_id", card.id);
    if ((count ?? 0) >= max) {
      return fail(`Your ${plan.name} plan allows up to ${max} gallery images.`);
    }
  }

  const image = readImage(formData.get("image"), "gallery", (ext) =>
    `${userId}/${card.id}/gallery-${Date.now()}.${ext}`,
  );
  if (image && "failure" in image) return fail(image.failure);
  if (!image) return fail("Please choose an image to upload.");

  const uploaded = await uploadImage(supabase, "gallery", image.path, image.file);
  if ("failure" in uploaded) return fail(uploaded.failure);

  const { data: last } = await supabase
    .from("gallery_items")
    .select("position")
    .eq("card_id", card.id)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("gallery_items").insert({
    card_id: card.id,
    image_url: uploaded.url,
    position: ((last?.position as number | undefined) ?? 0) + 10,
  });
  if (error) {
    console.error("[cards] gallery insert failed", error.message);
    return fail("We could not add that image. Please try again.");
  }

  return { ok: true, data: { imageUrl: uploaded.url } };
}

/** Remove a gallery image row. The storage object is deleted best-effort. */
export async function removeGalleryImageAction(
  itemId: string,
): Promise<ActionResult<{ removed: true }>> {
  const blocked = await limit("card-gallery", 20);
  if (blocked) return fail(blocked);

  // Authenticate first — the user id is the source of truth, never the client.
  const user = await requireUser();
  const supabase = await createClient();

  // Fetch the gallery item AND its card's owner in one query.
  // If the item does not exist, or the card does not belong to this user,
  // both cases return null — IDOR is structurally impossible.
  const { data: row } = await supabase
    .from("gallery_items")
    .select("id, image_url, card_id, cards!inner(user_id)")
    .eq("id", itemId)
    .eq("cards.user_id", user.id)
    .maybeSingle();

  if (!row) return fail("That image could not be found.");

  const { error } = await supabase.from("gallery_items").delete().eq("id", itemId);
  if (error) return fail("We could not remove that image. Please try again.");

  // Best-effort storage cleanup.
  const marker = "/object/public/gallery/";
  const index = row.image_url?.indexOf(marker) ?? -1;
  if (index >= 0) {
    const path = row.image_url.slice(index + marker.length);
    await supabase.storage.from("gallery").remove([path]);
  }

  return { ok: true, data: { removed: true } };
}

/* ── Account ───────────────────────────────────────────────────────────────── */

/**
 * Update the signed-in user's own profile row.
 *
 * Only the fields a person actually owns are writable: `full_name` and `phone`.
 * `role`, `status`, `referral_code` and `referred_by` are excluded on purpose —
 * those are set by the database trigger or by staff, and an action that accepted
 * them would be a privilege-escalation path dressed as a settings form.
 *
 * The update is scoped with `.eq("id", user.id)` as well as relying on
 * `profiles_update_self`, so it cannot be pointed at another account even if the
 * policy is later loosened.
 */
export async function updateProfileAction(
  _prev: ActionResult<{ saved: true }> | null,
  formData: FormData,
): Promise<ActionResult<{ saved: true }>> {
  const blocked = await limit("profile-update", 20);
  if (blocked) return fail(blocked);

  const user = await requireUser();

  const parsed = parse(profileUpdateSchema, {
    fullName: text(formData, "fullName"),
    phone: text(formData, "phone"),
  });
  if ("failure" in parsed) return parsed.failure;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName || null,
      phone: parsed.data.phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[cards] profile update failed", error.message);
    return fail("We could not save your details. Please try again.");
  }

  return { ok: true, data: { saved: true } };
}

/* ── Leads ─────────────────────────────────────────────────────────────────── */

/**
 * The `lead_status` enum, shared with the inbox so a value the UI offers is
 * always a value this action accepts. Zod re-checks it regardless: the form is
 * client-controlled.
 */
const leadStatusSchema = z.enum(LEAD_STATUSES);

/**
 * Move a lead through its pipeline.
 *
 * Only the status is writable from here. Name, phone and message came from a
 * visitor, and an owner editing their own contact details is how a lead record
 * stops matching the person who actually enquired.
 *
 * `converted_at` is stamped on the first move to `converted` and never cleared, so
 * "how long did it take to convert" stays answerable after the lead moves on.
 */
export async function setLeadStatusAction(
  leadId: string,
  status: string,
): Promise<ActionResult<{ leadId: string; status: LeadStatus }>> {
  const blocked = await limit("card-lead", 60);
  if (blocked) return fail(blocked);

  const parsed = leadStatusSchema.safeParse(status);
  if (!parsed.success) return fail("That is not a lead status.");

  const user = await requireUser();
  const supabase = await createClient();

  // Scoped by the caller's card, so a lead on someone else's card is not found
  // rather than silently updated through a policy gap.
  const { data: lead } = await supabase
    .from("leads")
    .select("id, card_id, status, cards ( user_id )")
    .eq("id", leadId)
    .maybeSingle();

  const ownerId = (lead?.cards as { user_id?: string } | null)?.user_id;
  if (!lead || ownerId !== user.id) return fail("That lead could not be found.");

  const patch: { status: LeadStatus; converted_at?: string } = { status: parsed.data };
  if (parsed.data === "converted" && lead.status !== "converted") {
    patch.converted_at = new Date().toISOString();
  }

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);

  if (error) {
    console.error("[cards] lead status update failed", error.message);
    return fail("We could not update that lead. Please try again.");
  }

  return { ok: true, data: { leadId, status: parsed.data } };
}

/* ── Publish ───────────────────────────────────────────────────────────────── */

/**
 * Toggle the card between `draft` and `published`.
 *
 * Only a published card is readable by the public (`getPublicCard` and the
 * `is_card_public` gate both filter on status), so this is the single switch
 * that puts the link live or takes it down — immediately, with no cache to
 * invalidate.
 */
export async function setCardPublishedAction(
  cardId: string,
  published: boolean,
): Promise<ActionResult<{ status: "draft" | "published" }>> {
  const blocked = await limit("card-publish", 20);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card } = owner;

  if (card.status === "suspended") {
    return fail("This card is suspended. Please contact support to reactivate it.");
  }

  const status = published ? "published" : "draft";
  const { error } = await supabase
    .from("cards")
    .update({
      status,
      published_at: published ? new Date().toISOString() : card.status === "published" ? null : undefined,
    })
    .eq("id", card.id);

  if (error) {
    console.error("[cards] publish failed", error.message);
    return fail(published ? "We could not publish your card." : "We could not unpublish your card.");
  }

  return { ok: true, data: { status } };
}

/* -- Cover / Logo upload --------------------------------------------------- */

export async function uploadCoverPhotoAction(
  cardId: string,
  formData: FormData,
): Promise<ActionResult<{ coverUrl: string | null }>> {
  const blocked = await limit("card-photo", 20);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, userId, card } = owner;

  if (formData.get("remove") === "true") {
    const { error } = await supabase.from("cards").update({ cover_url: null }).eq("id", card.id);
    if (error) return fail("We could not remove that cover. Please try again.");
    return { ok: true, data: { coverUrl: null } };
  }

  const photo = readImage(formData.get("photo"), "avatars", (ext) =>
    `${userId}/${card.id}/cover-${Date.now()}.${ext}`,
  );
  if (photo && "failure" in photo) return fail(photo.failure);
  if (!photo) return fail("Please choose an image to upload.");

  const uploaded = await uploadImage(supabase, "avatars", photo.path, photo.file);
  if ("failure" in uploaded) return fail(uploaded.failure);

  const { error } = await supabase
    .from("cards")
    .update({ cover_url: uploaded.url })
    .eq("id", card.id);
  if (error) return fail("We could not save that cover. Please try again.");

  return { ok: true, data: { coverUrl: uploaded.url } };
}

export async function uploadLogoAction(
  cardId: string,
  formData: FormData,
): Promise<ActionResult<{ logoUrl: string | null }>> {
  const blocked = await limit("card-photo", 20);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, userId, card } = owner;

  if (formData.get("remove") === "true") {
    const { error } = await supabase.from("cards").update({ logo_url: null }).eq("id", card.id);
    if (error) return fail("We could not remove that logo. Please try again.");
    return { ok: true, data: { logoUrl: null } };
  }

  const photo = readImage(formData.get("photo"), "avatars", (ext) =>
    `${userId}/${card.id}/logo-${Date.now()}.${ext}`,
  );
  if (photo && "failure" in photo) return fail(photo.failure);
  if (!photo) return fail("Please choose an image to upload.");

  const uploaded = await uploadImage(supabase, "avatars", photo.path, photo.file);
  if ("failure" in uploaded) return fail(uploaded.failure);

  const { error } = await supabase
    .from("cards")
    .update({ logo_url: uploaded.url })
    .eq("id", card.id);
  if (error) return fail("We could not save that logo. Please try again.");

  return { ok: true, data: { logoUrl: uploaded.url } };
}

/* -- Card delete / duplicate ----------------------------------------------- */

export async function deleteCardAction(
  cardId: string,
): Promise<ActionResult<{ deleted: true }>> {
  const blocked = await limit("card-delete", 10);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, card } = owner;

  const { error } = await supabase
    .from("cards")
    .update({ deleted_at: new Date().toISOString(), status: "draft" })
    .eq("id", card.id);

  if (error) {
    console.error("[cards] delete failed", error.message);
    return fail("We could not delete that card. Please try again.");
  }

  return { ok: true, data: { deleted: true } };
}

export async function duplicateCardAction(
  cardId: string,
): Promise<ActionResult<{ newCardId: string }>> {
  const blocked = await limit("card-create", 5);
  if (blocked) return fail(blocked);

  const owner = await ownedCard(cardId);
  if (isFailure(owner)) return owner.failure;
  const { supabase, userId } = owner;

  const plan = await getUserPlan(supabase, userId);
  const used = await countUserCards(supabase, userId);
  if (limitReached(plan.limits.max_cards, used)) {
    return fail(`Your ${plan.name} plan includes ${plan.limits.max_cards} card(s). Upgrade to duplicate.`);
  }

  const { data: src, error: srcErr } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", userId)
    .maybeSingle();
  if (srcErr || !src) return fail("That card could not be found.");

  const base = `${String(src.username)}-copy`;
  const candidates = [base, `${base}-1`, `${base}-2`, `${base}-3`];
  let newCardId: string | null = null;

  for (const username of candidates) {
    const { data, error } = await supabase
      .from("cards")
      .insert({
        user_id: userId,
        username,
        type: src.type,
        full_name: `${String(src.full_name)} (Copy)`,
        designation: src.designation,
        company: src.company,
        bio: src.bio,
        phone: src.phone,
        whatsapp: src.whatsapp,
        email: src.email,
        website: src.website,
        address: src.address,
        city: src.city,
        state: src.state,
        country: src.country,
        pincode: src.pincode,
        theme_id: src.theme_id,
        theme_overrides: src.theme_overrides,
        status: "draft",
      })
      .select("id")
      .single();
    if (data) { newCardId = data.id; break; }
    if (error?.code !== "23505") { console.error("[cards] duplicate failed", error?.message); break; }
  }

  if (!newCardId) return fail("We could not duplicate that card. Please try again.");

  const { data: sections } = await supabase
    .from("card_sections")
    .select("section_key, position, is_enabled, config")
    .eq("card_id", cardId);
  if (sections?.length) {
    await supabase.from("card_sections").insert(
      sections.map((s) => ({ ...s, card_id: newCardId })),
    );
  }

  const { data: socials } = await supabase
    .from("social_links")
    .select("platform, url, label, position, is_active")
    .eq("card_id", cardId);
  if (socials?.length) {
    await supabase.from("social_links").insert(
      socials.map((s) => ({ ...s, card_id: newCardId })),
    );
  }

  return { ok: true, data: { newCardId } };
}
