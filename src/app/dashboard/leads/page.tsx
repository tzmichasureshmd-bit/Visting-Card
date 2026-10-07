import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, MessageSquare } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, readLeadStatus } from "@/lib/cards/types";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leads",
  description: "All enquiries across your cards.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
  cards: { full_name: string; username: string } | null;
}

export default async function LeadsOverviewPage({
  searchParams,
}: PageProps<"/dashboard/leads">) {
  await requireUser();
  const params = await searchParams;
  const status = readLeadStatus(params.status);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone, email, message, source, status, created_at, cards(full_name, username)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  const leads: Lead[] = error ? [] : ((data ?? []) as unknown as Lead[]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Leads</h1>
        <p className="mt-1 text-sm text-muted">Enquiries from all your cards in one place.</p>
      </div>

      {/* Status filter */}
      <nav aria-label="Filter by status">
        <ul className="flex flex-wrap gap-2">
          {LEAD_STATUS_LABELS.map((option) => (
            <li key={option.value}>
              <Link
                href={`/dashboard/leads?status=${option.value}`}
                aria-current={status === option.value ? "page" : undefined}
                className={
                  "inline-block rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors " +
                  (status === option.value
                    ? "border-transparent bg-fg text-bg"
                    : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg")
                }
              >
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {leads.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <Inbox className="mx-auto size-6 text-subtle" aria-hidden />
          <p className="mt-3 text-[15px] font-medium text-fg">No {status} leads</p>
          <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
            {status === "new"
              ? "When someone fills in the enquiry form on any of your cards, it appears here."
              : "Nothing in this stage yet."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {leads.map((lead) => (
            <li key={lead.id} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-fg">{lead.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {lead.phone}
                    {lead.email ? ` · ${lead.email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {lead.cards ? (
                    <Badge tone="neutral">{lead.cards.full_name}</Badge>
                  ) : null}
                  <span className="text-[12px] text-subtle">{timeAgo(lead.created_at)}</span>
                </div>
              </div>

              {lead.message ? (
                <p className="mt-3 flex gap-2 text-[13px] leading-relaxed text-muted">
                  <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                  <span className="min-w-0">{lead.message}</span>
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <a
                  href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                  className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  Call
                </a>
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
                  >
                    Email
                  </a>
                ) : null}
                {lead.cards ? (
                  <Link
                    href={`/dashboard/cards/${lead.id}/leads`}
                    className="ml-auto text-[12px] font-medium text-muted underline underline-offset-2 hover:text-fg"
                  >
                    View in card
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
