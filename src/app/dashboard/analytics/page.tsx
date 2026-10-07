import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Eye, MousePointerClick, UserCheck } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Views, clicks and leads across all your cards.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface OwnedCard {
  id: string;
  username: string;
  full_name: string;
  view_count: number;
  lead_count: number;
  status: string;
}

export default async function AnalyticsOverviewPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("cards")
    .select("id, username, full_name, view_count, lead_count, status")
    .is("deleted_at", null)
    .order("view_count", { ascending: false });

  const cards: OwnedCard[] = error ? [] : ((data ?? []) as OwnedCard[]);

  const totals = cards.reduce(
    (sum, c) => ({ views: sum.views + c.view_count, leads: sum.leads + c.lead_count }),
    { views: 0, leads: 0 },
  );

  void user;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Views, clicks and leads across all your cards.</p>
      </div>

      {/* Totals */}
      <section aria-label="Overall totals" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Views",  value: totals.views,  icon: Eye },
          { label: "Total Leads",  value: totals.leads,  icon: UserCheck },
          { label: "Live Cards",   value: cards.filter((c) => c.status === "published").length, icon: BarChart3 },
          { label: "Total Cards",  value: cards.length,  icon: MousePointerClick },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-surface px-4 py-4 shadow-sm">
            <stat.icon className="size-4 text-subtle" aria-hidden />
            <p className="mt-2 text-2xl font-semibold tabular-nums text-fg">{stat.value}</p>
            <p className="text-[12px] text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Per-card breakdown */}
      <section aria-labelledby="cards-analytics-heading" className="mt-10">
        <h2 id="cards-analytics-heading" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          Per Card
        </h2>
        {cards.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
            <BarChart3 className="mx-auto size-6 text-subtle" aria-hidden />
            <p className="mt-3 text-[15px] font-medium text-fg">No cards yet</p>
            <p className="mt-1 text-[13px] text-muted">Create a card to start seeing analytics.</p>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="px-4 py-3 text-left font-medium text-muted">Card</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Views</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Leads</th>
                  <th className="px-4 py-3 text-right font-medium text-muted"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cards.map((card) => (
                  <tr key={card.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-fg">{card.full_name}</p>
                      <p className="text-[12px] text-muted">/card/{card.username}</p>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg">{card.view_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-fg">{card.lead_count}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/cards/${card.id}/analytics`}
                        className="text-[12px] font-medium text-muted underline underline-offset-2 hover:text-fg"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
