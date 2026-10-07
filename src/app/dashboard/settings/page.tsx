import type { Metadata } from "next";
import Link from "next/link";
import { Copy, ShieldCheck } from "lucide-react";

import { ProfileForm } from "@/components/dashboard/profile-form";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { Badge } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/session";
import { getSubscriptionStatus, getUserPlan } from "@/lib/cards/limits";
import { createClient } from "@/lib/supabase/server";
import type { PlanLimits } from "@/lib/plan-limits";
import type { SubscriptionSummary } from "@/lib/cards/limits";

export const metadata: Metadata = {
  title: "Settings",
  description: "Your account details, plan and referral code.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Account settings.
 *
 * Reads the profile through the cookie-scoped client (`profiles_select_self`
 * returns the caller's own row only), and the plan and subscription status
 * through the same session. All three are the account's own rows under RLS.
 *
 * Billing is shown as a comparison link rather than a fake checkout button: the
 * payment routes are not wired up in this codebase, and a "Manage billing"
 * button that goes nowhere is worse than an honest note. What *is* shown — the
 * subscription status and period — is read straight from the `subscriptions`
 * table, so it can never claim a payment that did not happen.
 */
export default async function SettingsPage() {
  const user = await requireUser();

  const supabase = await createClient();
  const [profileResult, plan, subscription] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, referral_code")
      .eq("id", user.id)
      .maybeSingle(),
    getUserPlan(supabase, user.id),
    getSubscriptionStatus(supabase, user.id),
  ]);

  let fullName = "";
  let phone = "";
  let referralCode: string | null = null;

  if (profileResult.error) {
    console.error("[settings] profile read failed", profileResult.error.message);
  } else {
    fullName = String(profileResult.data?.full_name ?? "");
    phone = String(profileResult.data?.phone ?? "");
    referralCode = profileResult.data?.referral_code ?? null;
  }

  const planName = plan.name;
  const planSummary = summarise(plan.limits);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account details, plan and security.</p>
      </div>
      <div>
        <section aria-labelledby="details-heading" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="details-heading" className="text-[15px] font-semibold text-fg">
            Your details
          </h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
            Your email ({user.email}) is used to sign in and cannot be changed here.
          </p>
          <div className="mt-5">
            <ProfileForm fullName={fullName} phone={phone} />
          </div>
        </section>

        <section aria-labelledby="plan-heading" className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="plan-heading" className="text-[15px] font-semibold text-fg">
                Your plan
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{planSummary}</p>
            </div>
            <Badge tone="info">{planName}</Badge>
          </div>

          {statusLine(subscription) ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              {statusLine(subscription)}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link
              href="/#pricing"
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              Compare plans
            </Link>
            <p className="text-[12.5px] text-subtle">
              Card checkout is not wired up yet, so upgrading happens from the pricing
              page.
            </p>
          </div>
        </section>

        {referralCode ? (
          <section aria-labelledby="referral-heading" className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
            <h2 id="referral-heading" className="text-[15px] font-semibold text-fg">
              Referral code
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Share it and you earn a share of every paid plan the person buys.{" "}
              <Link href="/referral" className="text-fg underline underline-offset-2">
                How it works
              </Link>
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 font-mono text-sm text-fg">
              {referralCode}
              <Copy className="size-3.5 text-subtle" aria-hidden />
            </p>
          </section>
        ) : null}

        <section aria-labelledby="security-heading" className="mt-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="security-heading" className="text-[15px] font-semibold text-fg">
            Security
          </h2>
          <p className="mt-1 flex items-start gap-2 text-[13px] leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            Changing your password or email needs a fresh sign-in, so it is done from
            the login pages rather than from a form that would appear to work without
            re-verifying you.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Link
              href="/forgot-password"
              className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              Reset your password
            </Link>
            <SignOutButton />
          </div>
        </section>
      </div>
    </div>
  );
}

/** The plan's headline limits in one sentence. */
function summarise(limits: PlanLimits): string {
  const cards = limits.max_cards === -1 ? "Unlimited cards" : `${limits.max_cards} card`;
  const themes = limits.premium_themes ? "premium themes included" : "free themes only";
  const gallery =
    limits.max_gallery_items === -1
      ? "unlimited gallery images"
      : `${limits.max_gallery_items} gallery images`;
  const analytics = limits.analytics
    ? `analytics kept for ${limits.analytics_retention_days} days`
    : "no analytics history";
  return `${cards}, ${themes}, ${gallery}, ${analytics}.`;
}

/**
 * One truthful sentence about the live subscription, straight from the
 * `subscriptions` table. `null` (no row) is reported as a plain statement rather
 * than hidden — a visitor to this page deserves to know there is no subscription
 * instead of a silently blank billing card.
 */
function statusLine(subscription: SubscriptionSummary | null): string | null {
  const formatDate = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
          new Date(iso),
        )
      : null;

  if (!subscription) {
    return "You are on the free plan — there is no active subscription on this account.";
  }

  switch (subscription.status) {
    case "active":
      return `Subscription active. ${
        formatDate(subscription.periodEnd) ? `The current period ends ${formatDate(subscription.periodEnd)}.` : ""
      }`;
    case "pending":
      return "Your payment is pending verification. Once it clears, the paid plan's limits apply.";
    case "grace":
      return `Grace period until ${formatDate(subscription.graceUntil ?? subscription.periodEnd) ?? "soon"}. Your cards stay live, but renew to keep the paid plan.`;
    case "expired":
      return "Your subscription has expired, so the account is on the Free plan's limits.";
    case "cancelled":
      return "Your subscription was cancelled, so the account is on the Free plan's limits.";
  }
}