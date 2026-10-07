import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { MyCardsGrid } from "@/components/dashboard/my-cards-grid";
import { requireUser } from "@/lib/auth/session";
import { getUserPlan, countUserCards } from "@/lib/cards/limits";
import { limitReached } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";

export type { CardRow } from "@/lib/cards/card-row";

export const metadata: Metadata = {
  title: "My Cards",
  description: "Manage your Digital Visiting Cards.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function MyCardsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [cardsResult, plan, cardCount] = await Promise.all([
    supabase
      .from("cards")
      .select(
        `id, username, full_name, designation, company, status,
         view_count, lead_count, updated_at, created_at,
         photo_url, cover_url, themes(config)`,
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false }),
    getUserPlan(supabase, user.id),
    countUserCards(supabase, user.id),
  ]);

  const rawCards = cardsResult.data ?? [];

  const cards = rawCards.map((c) => {
    const config = (c.themes as { config?: { palette?: { accent?: string } } } | null)?.config;
    return {
      id: c.id,
      username: c.username,
      full_name: c.full_name,
      designation: c.designation ?? null,
      company: (c as { company?: string | null }).company ?? null,
      status: c.status,
      view_count: (c.view_count as number) ?? 0,
      lead_count: (c.lead_count as number) ?? 0,
      updated_at: c.updated_at,
      created_at: c.created_at,
      photo_url: c.photo_url ?? null,
      cover_url: c.cover_url ?? null,
      theme_accent: config?.palette?.accent ?? null,
    };
  });

  const canCreate = !limitReached(plan.limits.max_cards, cardCount);

  return (
    <div style={{ minHeight: "100dvh", background: "var(--dv-off-white)" }}>
      <header style={{ background: "var(--dv-white)", borderBottom: "1px solid var(--dv-border)", padding: "2.5rem 1.5rem 2rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "1.5rem" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--dv-gray-light)", marginBottom: "0.5rem" }}>
                Dashboard
              </p>
              <h1 style={{ margin: 0, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.04em", textTransform: "uppercase", color: "var(--dv-black)", lineHeight: 1 }}>
                My Cards
              </h1>
              <p style={{ margin: "0.625rem 0 0", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.5 }}>
                Your digital identity, all in one place.
              </p>
            </div>
            {canCreate ? (
              <Link href="/onboarding" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--dv-black)", color: "var(--dv-white)", padding: "0.875rem 1.5rem", borderRadius: "var(--dv-r-sm)", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none", flexShrink: 0 }}>
                <Plus style={{ width: "1rem", height: "1rem" }} aria-hidden />
                Create new card
              </Link>
            ) : (
              <Link href="/#pricing" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--dv-lime)", color: "var(--dv-black)", padding: "0.875rem 1.5rem", borderRadius: "var(--dv-r-sm)", fontWeight: 700, fontSize: "0.9375rem", textDecoration: "none", flexShrink: 0 }}>
                Upgrade for more cards
              </Link>
            )}
          </div>
          <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.25rem 0.75rem", borderRadius: "999px", background: "var(--dv-lime)", color: "var(--dv-black)" }}>
              {plan.name}
            </span>
            <span style={{ fontSize: "0.8125rem", color: "var(--dv-gray)" }}>
              {cardCount} of {plan.limits.max_cards < 0 ? "∞" : plan.limits.max_cards} cards used
            </span>
          </div>
        </div>
      </header>

      <MyCardsGrid cards={cards} canCreate={canCreate} />
    </div>
  );
}
