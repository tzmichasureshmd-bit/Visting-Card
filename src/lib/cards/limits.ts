import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { FREE_PLAN_LIMITS, parsePlanLimits, type PlanLimits } from "@/lib/plan-limits";

/**
 * The signed-in user's own plan, read server-side.
 *
 * The public card gets its limits from the `public_card_gate` RPC (the owner's
 * subscription is not publicly readable). This is the counterpart for writes:
 * the builder and the card actions ask "what does this account's plan allow?"
 * before inserting anything, so an upgrade is never silently ignored and a
 * downgrade never over-provisions.
 *
 * Only `active` and `grace` subscriptions confer their plan's limits —
 * `pending` means a payment has not completed yet, and the rest are terminal.
 * Anything else falls back to the Free plan, which is also the answer when
 * Supabase is unreachable: never over-promise on a failed read.
 */

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface UserPlan {
  /** The `plans.slug` row the subscription points at, or `"free"`. */
  slug: string;
  /** Human-readable plan name for the dashboard, or `"Free"`. */
  name: string;
  limits: PlanLimits;
}

const FALLBACK: UserPlan = { slug: "free", name: "Free", limits: FREE_PLAN_LIMITS };

export async function getUserPlan(
  supabase: ServerClient,
  userId: string,
): Promise<UserPlan> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status, plans ( slug, name, limits )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return FALLBACK;

    const status = String(data.status);
    if (status !== "active" && status !== "grace") return FALLBACK;

    // The embed is a single row (many-to-one), matching PostgREST's shape.
    const plan = data.plans as { slug?: string; name?: string; limits?: unknown } | null;
    if (!plan) return FALLBACK;

    return {
      slug: String(plan.slug ?? "free"),
      name: String(plan.name ?? "Free"),
      limits: parsePlanLimits(plan.limits),
    };
  } catch (error) {
    console.error("[cards] plan lookup failed", error);
    return FALLBACK;
  }
}

/**
 * How many cards the account currently has.
 *
 * RLS means this only ever counts the caller's own cards (drafts included —
 * `can_manage_card` covers them), which is exactly the number the limit is
 * about. Another account's cards are invisible here, and that is correct.
 */
export async function countUserCards(
  supabase: ServerClient,
  userId: string,
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (error) {
      console.error("[cards] card count failed", error.message);
      return 0;
    }
    return count ?? 0;
  } catch (error) {
    console.error("[cards] card count failed", error);
    return 0;
  }
}

/** The raw subscription_status enum values the database can produce. */
export const SUBSCRIPTION_STATUSES = [
  "active",
  "pending",
  "grace",
  "expired",
  "cancelled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function isSubscriptionStatus(value: unknown): value is SubscriptionStatus {
  return SUBSCRIPTION_STATUSES.includes(value as SubscriptionStatus);
}

export interface SubscriptionSummary {
  status: SubscriptionStatus;
  /** Human label for the UI. It is derived, never stored. */
  label: string;
  /** The subscription the status belongs to, or null when there is none. */
  periodEnd: string | null;
  graceUntil: string | null;
}

/**
 * The account's current subscription state, read server-side.
 *
 * Unlike `getUserPlan` — which collapses everything into a plan and a limit —
 * this keeps the *status* intact, so the billing UI can be honest about where a
 * payment stands instead of guessing. It reads the owner's own row through RLS
 * (`subscriptions_owner_read`), so nothing private ever leaves the session.
 *
 * No status row at all, or a read error, reports `none` rather than pretending.
 * The subscription status enum (`0001_schema.sql`) only ever contains the five
 * values above, so any other value is normalised to `none` instead of being
 * rendered verbatim.
 */
export async function getSubscriptionStatus(
  supabase: ServerClient,
  userId: string,
): Promise<SubscriptionSummary | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status, current_period_end, grace_until")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    if (!isSubscriptionStatus(data.status)) return null;

    const labelByStatus: Record<SubscriptionStatus, string> = {
      active: "Active",
      pending: "Payment pending",
      grace: "Grace period",
      expired: "Expired",
      cancelled: "Cancelled",
    };

    return {
      status: data.status,
      label: labelByStatus[data.status],
      periodEnd: data.current_period_end ?? null,
      graceUntil: data.grace_until ?? null,
    };
  } catch (error) {
    console.error("[cards] subscription status lookup failed", error);
    return null;
  }
}
