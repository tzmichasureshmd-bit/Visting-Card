import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  Gift,
  Inbox,
} from "lucide-react";

import GlassCard from "@/components/ui/glass-card";
import { ShareCardDialog } from "@/components/dashboard/share-card-dialog";
import { DeleteCardButton, DuplicateCardButton } from "@/components/dashboard/card-actions";
import { NewCardButton } from "@/components/dashboard/new-card-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/session";
import { countUserCards, getSubscriptionStatus, getUserPlan } from "@/lib/cards/limits";
import { limitReached } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Digital Visiting Card account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface OwnedCard {
  id: string;
  username: string;
  full_name: string;
  designation: string | null;
  status: string;
  view_count: number;
  lead_count: number;
  updated_at: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge tone="success">Live</Badge>;
    case "suspended":
      return <Badge tone="danger">Suspended</Badge>;
    default:
      return <Badge tone="neutral">Draft</Badge>;
  }
}

function planSummary(
  planName: string,
  cardCount: number,
  maxCards: number,
  canAddCard: boolean,
): string {
  const cards = `${cardCount} of ${maxCards} ${cardCount === 1 ? "card" : "cards"}`;
  if (!canAddCard) {
    return `You are using every card included in ${planName}. Upgrade to add another.`;
  }
  return planName === "Free"
    ? `${cards} on the Free plan. Upgrade for more designs, galleries and analytics.`
    : `${cards} on the ${planName} plan.`;
}

function subscriptionStatusLine(subscription: { status: string }): string {
  const labels: Record<string, string> = {
    pending: "Payment pending — the paid plan applies once it is verified.",
    grace: "Grace period — renew to keep the paid plan.",
    expired: "Subscription expired — on Free limits.",
    cancelled: "Subscription cancelled — on Free limits.",
  };
  return labels[subscription.status] ?? "";
}

function formatCount(value: number): string {
  return value > 999 ? `${(value / 1000).toFixed(1)}k` : String(value);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = await createClient();

  let cards: OwnedCard[] = [];
  let profile: { full_name: string | null; referral_code: string | null } | null = null;
  let cardQueryFailed = false;

  const [cardsResult, profileResult, plan, cardCount, subscription] = await Promise.all([
    supabase
      .from("cards")
      .select(
        "id, username, full_name, designation, status, view_count, lead_count, updated_at",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name, referral_code")
      .eq("id", user.id)
      .maybeSingle(),
    getUserPlan(supabase, user.id),
    countUserCards(supabase, user.id),
    getSubscriptionStatus(supabase, user.id),
  ]);

  if (cardsResult.error) {
    console.error("[dashboard] card list failed", cardsResult.error.message);
    cardQueryFailed = true;
  } else {
    cards = (cardsResult.data ?? []) as OwnedCard[];
  }

  if (!profileResult.error) profile = profileResult.data;

  const planName = plan.name;
  const canAddCard = !limitReached(plan.limits.max_cards, cardCount);
  const displayName = profile?.full_name || user.email.split("@")[0] || "there";
  const firstName = displayName.split(" ")[0] || displayName;

  const totals = cards.reduce(
    (sum, card) => ({
      views: sum.views + card.view_count,
      leads: sum.leads + card.lead_count,
    }),
    { views: 0, leads: 0 },
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Your Digital Visiting Cards live here. Anyone with the link can open them.
          </p>
        </div>
        <NewCardButton canAdd={canAddCard} />
      </div>

      {/* KPI strip */}
      {cards.length > 0 ? (
        <section
          aria-label="Totals across your cards"
          className="mt-7 grid grid-cols-3 gap-3"
        >
          {[
            { label: "Live",   value: cards.filter((c) => c.status === "published").length, subtitle: "Published cards" },
            { label: "Views",  value: totals.views,  subtitle: "Total card views" },
            { label: "Leads",  value: totals.leads,  subtitle: "Enquiries received" },
          ].map((stat) => (
            <GlassCard
              key={stat.label}
              subtitle={stat.subtitle}
              title={formatCount(stat.value)}
              description={stat.label}
              enableTilt
              style={{ width: "100%" }}
            />
          ))}
        </section>
      ) : null}

      {/* Cards list */}
      <section aria-labelledby="cards-heading" className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2
            id="cards-heading"
            className="text-[13px] font-semibold uppercase tracking-wide text-muted"
          >
            Your Digital Visiting Cards
          </h2>
          <span className="text-[13px] text-subtle">{cards.length}</span>
        </div>

        {cardQueryFailed ? (
          <div className="mt-3 rounded-2xl border border-danger/30 bg-danger-soft px-5 py-8 text-center">
            <p className="text-[15px] font-medium text-fg">Your cards could not be loaded</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
              Something went wrong on our side. Refresh the page, and if it keeps happening
              get in touch and we will look into it.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard">Try again</Link>
              </Button>
            </div>
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-soft-fg">
              <CreditCard className="size-6" aria-hidden />
            </span>
            <p className="mt-4 text-[15px] font-medium text-fg">
              No Digital Visiting Cards yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
              A card takes about two minutes to set up: a username, your details and a design.
              You can change all of it afterwards.
            </p>
            <div className="mt-6">
              <NewCardButton canAdd={true} />
            </div>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {cards.map((card) => {
              const published = card.status === "published";
              return (
                <li key={card.id}>
                  <article className="flex h-full flex-col rounded-2xl border border-line bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-fg">
                          {card.full_name}
                        </h3>
                        <p className="truncate text-[13px] text-muted">
                          {card.designation || `/card/${card.username}`}
                        </p>
                      </div>
                      {statusBadge(card.status)}
                    </div>

                    {card.status === "suspended" ? (
                      <p className="mt-3 rounded-xl bg-danger-soft px-2.5 py-1.5 text-[12.5px] leading-relaxed text-danger">
                        This card is suspended and is not visible to visitors.
                      </p>
                    ) : null}

                    <dl className="mt-4 flex items-center gap-4 text-[13px]">
                      <Link
                        href={`/dashboard/cards/${card.id}/leads`}
                        className="inline-flex items-center gap-1.5 rounded-md text-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
                      >
                        <dt className="sr-only">Leads</dt>
                        <dd className="flex items-center gap-1.5">
                          <Inbox className="size-3.5" aria-hidden />
                          <span className="tabular-nums text-fg">{card.lead_count}</span>
                          <span className="sr-only">
                            {card.lead_count === 1 ? "lead" : "leads"}
                          </span>
                        </dd>
                      </Link>
                      <Link
                        href={`/dashboard/cards/${card.id}/analytics`}
                        className="rounded-md text-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
                      >
                        <dt className="sr-only">Views</dt>
                        <dd className="tabular-nums">
                          <span className="text-fg">{formatCount(card.view_count)}</span>{" "}
                          views
                        </dd>
                      </Link>
                      <span className="ml-auto text-[12px] text-subtle">
                        {timeAgo(card.updated_at)}
                      </span>
                    </dl>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/cards/${card.id}`}>
                          Edit
                          <ArrowUpRight className="size-3.5" aria-hidden />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/cards/${card.id}/analytics`}>
                          <BarChart3 className="size-3.5" aria-hidden />
                          Analytics
                        </Link>
                      </Button>
                      <DuplicateCardButton cardId={card.id} />
                      <DeleteCardButton cardId={card.id} cardName={card.full_name} />

                      {published ? (
                        <>
                          <ShareCardDialog username={card.username} cardName={card.full_name} />
                          <Button asChild variant="ghost" size="sm" className="ml-auto">
                            <Link href={`/card/${card.username}`}>
                              View
                              <ArrowUpRight className="size-3.5" aria-hidden />
                            </Link>
                          </Button>
                        </>
                      ) : (
                        <span className="ml-auto text-[12px] text-subtle">
                          Publish it to share
                        </span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Plan */}
      <section aria-labelledby="plan-heading" className="mt-10">
        <h2
          id="plan-heading"
          className="text-[13px] font-semibold uppercase tracking-wide text-muted"
        >
          Your plan
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-4 shadow-sm">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-fg">{planName}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
              {planSummary(planName, cards.length, plan.limits.max_cards, canAddCard)}
            </p>
            {subscription && subscription.status !== "active" ? (
              <p className="mt-1.5 text-[12.5px] text-subtle">
                {subscriptionStatusLine(subscription)}
              </p>
            ) : null}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/#pricing">Compare plans</Link>
          </Button>
        </div>
      </section>

      {/* Referral */}
      {profile?.referral_code ? (
        <section aria-labelledby="referral-heading" className="mt-8">
          <GlassCard
            title={profile.referral_code}
            subtitle="Your referral code"
            description="Share it and earn a share of every paid plan the person buys."
            enableTilt
            style={{ width: "100%" }}
          >
            <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
              <Link
                href="/referral"
                style={{ fontSize: "0.8125rem", color: "rgba(255,255,255,0.5)", textDecoration: "underline", textUnderlineOffset: "3px" }}
              >
                How it works
              </Link>
              <Button asChild size="sm" style={{ marginLeft: "auto" }}>
                <Link href="/dashboard/referrals">
                  <Gift className="size-3.5" aria-hidden />
                  View Referral Dashboard
                </Link>
              </Button>
            </div>
          </GlassCard>
        </section>
      ) : null}
    </div>
  );
}
