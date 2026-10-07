import type { SectionKey } from "@/lib/cards/types";

/**
 * The single reader for `plans.limits`.
 *
 * The seed file documents this exact shape (see the comment above the plan
 * inserts). Keeping every limit behind this module means a new plan or a changed
 * column never has to be chased across the editor, the gate and the public
 * renderer — and it gives one place to enforce "plan X cannot use feature Y".
 *
 * `-1` is the seeded convention for "unlimited".
 */

export interface PlanLimits {
  max_cards: number;
  max_services: number;
  max_products: number;
  max_gallery_items: number;
  max_portfolio_items: number;
  max_catalogue_items: number;
  max_team_members: number;
  analytics: boolean;
  analytics_retention_days: number;
  custom_domain: boolean;
  remove_branding: boolean;
  lead_management: boolean;
  catalogue: boolean;
  appointment_booking: boolean;
  upi_payments: boolean;
  premium_themes: boolean;
  video: boolean;
  referral_access: boolean;
  reseller_access: boolean;
}

const UNLIMITED = -1;

/** Used before a subscription is known: the Free plan, so nothing is over-promised. */
export const FREE_PLAN_LIMITS: PlanLimits = {
  max_cards: 1,
  max_services: 5,
  max_products: 5,
  max_gallery_items: 10,
  max_portfolio_items: 3,
  max_catalogue_items: 20,
  max_team_members: 0,
  analytics: true,
  analytics_retention_days: 30,
  custom_domain: false,
  remove_branding: false,
  lead_management: true,
  catalogue: false,
  appointment_booking: true,
  upi_payments: true,
  premium_themes: false,
  video: false,
  referral_access: true,
  reseller_access: false,
};

/** Parse a `limits` jsonb blob, falling back field-by-field to the free plan. */
export function parsePlanLimits(raw: unknown): PlanLimits {
  if (!raw || typeof raw !== "object") return FREE_PLAN_LIMITS;
  const input = raw as Record<string, unknown>;

  const num = (key: keyof PlanLimits, fallback: number): number =>
    typeof input[key] === "number" && Number.isFinite(input[key] as number)
      ? (input[key] as number)
      : fallback;

  const bool = (key: keyof PlanLimits, fallback: boolean): boolean =>
    typeof input[key] === "boolean" ? (input[key] as boolean) : fallback;

  return {
    max_cards: num("max_cards", FREE_PLAN_LIMITS.max_cards),
    max_services: num("max_services", FREE_PLAN_LIMITS.max_services),
    max_products: num("max_products", FREE_PLAN_LIMITS.max_products),
    max_gallery_items: num("max_gallery_items", FREE_PLAN_LIMITS.max_gallery_items),
    max_portfolio_items: num("max_portfolio_items", FREE_PLAN_LIMITS.max_portfolio_items),
    max_catalogue_items: num("max_catalogue_items", FREE_PLAN_LIMITS.max_catalogue_items),
    max_team_members: num("max_team_members", FREE_PLAN_LIMITS.max_team_members),
    analytics: bool("analytics", FREE_PLAN_LIMITS.analytics),
    analytics_retention_days: num(
      "analytics_retention_days",
      FREE_PLAN_LIMITS.analytics_retention_days,
    ),
    custom_domain: bool("custom_domain", FREE_PLAN_LIMITS.custom_domain),
    remove_branding: bool("remove_branding", FREE_PLAN_LIMITS.remove_branding),
    lead_management: bool("lead_management", FREE_PLAN_LIMITS.lead_management),
    catalogue: bool("catalogue", FREE_PLAN_LIMITS.catalogue),
    appointment_booking: bool(
      "appointment_booking",
      FREE_PLAN_LIMITS.appointment_booking,
    ),
    upi_payments: bool("upi_payments", FREE_PLAN_LIMITS.upi_payments),
    premium_themes: bool("premium_themes", FREE_PLAN_LIMITS.premium_themes),
    video: bool("video", FREE_PLAN_LIMITS.video),
    referral_access: bool("referral_access", FREE_PLAN_LIMITS.referral_access),
    reseller_access: bool("reseller_access", FREE_PLAN_LIMITS.reseller_access),
  };
}

/** `-1` means unlimited, so it can never be treated as "nothing left". */
export function limitReached(limit: number, used: number): boolean {
  if (limit === UNLIMITED) return false;
  return used >= limit;
}

/** How many more of something a plan allows, or `null` for unlimited. */
export function remaining(limit: number, used: number): number | null {
  if (limit === UNLIMITED) return null;
  return Math.max(0, limit - used);
}

/**
 * Sections that require a paid capability, keyed by the plan flag that unlocks
 * them. The editor disables these controls, and the public renderer hides the
 * section — so a downgrade takes effect on the live card immediately rather than
 * leaving a paywalled section visible to visitors.
 */
export const SECTION_FEATURE: Partial<Record<SectionKey, keyof PlanLimits>> = {
  catalogue: "catalogue",
  video: "video",
  payment: "upi_payments",
  appointment: "appointment_booking",
  portfolio: "max_portfolio_items",
};

/** True when `limits` permits the section. */
export function allowsSection(limits: PlanLimits, key: SectionKey): boolean {
  const feature = SECTION_FEATURE[key];
  if (!feature) return true;

  if (typeof limits[feature] === "boolean") {
    return limits[feature] === true;
  }

  // Numeric gates (e.g. portfolio items) are allowed as long as one slot exists.
  return (limits[feature] as number) > 0;
}

/** Human-readable upgrade hint for a locked section, used in the editor. */
export function lockedReason(limits: PlanLimits, key: SectionKey): string | null {
  if (allowsSection(limits, key)) return null;
  const feature = SECTION_FEATURE[key];
  switch (feature) {
    case "catalogue":
      return "A digital catalogue is available on the Starter plan and above.";
    case "video":
      return "Adding a video is available on the Starter plan and above.";
    case "upi_payments":
      return "UPI payment collection is available on the Free plan and above.";
    case "appointment_booking":
      return "Appointment requests are available on the Free plan and above.";
    default:
      return "This section is not included in your current plan.";
  }
}
