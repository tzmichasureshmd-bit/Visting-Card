import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Inbox, MessageSquare } from "lucide-react";

import { LeadStatusSelect } from "@/components/leads/lead-status-select";
import { Badge } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, readLeadStatus } from "@/lib/cards/types";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Leads",
  description: "Enquiries people sent through your card.",
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
}

/**
 * The lead inbox for one card.
 *
 * Reads through the cookie-scoped client, where `leads_owner_read` (0003_rls.sql)
 * returns rows only for cards the caller can manage — so this query is scoped by
 * the database, not by the `card_id` in the URL.
 *
 * Only new leads are listed. The pipeline moves a lead out of `new` once it has
 * been handled, so defaulting to the whole history would bury the one thing the
 * owner came here to do behind leads they already answered. The older states are
 * reachable through the status filter.
 *
 * `?status=` is narrowed by `readLeadStatus` before it reaches the query. Postgres
 * types `status` as an enum, so an unrecognised value is a *query error*, not an
 * empty result — without this, a mistyped or stale link would render the whole page
 * as "could not read".
 */
export default async function LeadsPage({
  params,
  searchParams,
}: PageProps<"/dashboard/cards/[id]/leads">) {
  const { id } = await params;
  const params_ = await searchParams;
  await requireUser();

  const status = readLeadStatus(params_.status);

  // No config branch: `requireUser()` above already redirected an unconfigured
  // instance to /login, so `isSupabaseConfigured` cannot be false here.
  const supabase = await createClient();
  const result = await supabase
    .from("leads")
    .select("id, name, phone, email, message, source, status, created_at")
    .eq("card_id", id)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  let leads: Lead[] = [];
  let unreadable = false;

  if (result.error) {
    console.error("[leads] read failed", result.error.message);
    unreadable = true;
  } else {
    leads = (result.data ?? []) as Lead[];
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/dashboard/cards/${id}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Builder
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-fg">Leads</h1>
        </div>
        <Link
          href={`/dashboard/cards/${id}/analytics`}
          className="text-[13px] font-medium text-muted underline underline-offset-2 transition-colors hover:text-fg"
        >
          View analytics
        </Link>
      </div>
      <div>
        <nav aria-label="Filter by status">
          <ul className="flex flex-wrap gap-2">
            {LEAD_STATUS_LABELS.map((option) => (
              <li key={option.value}>
                <Link
                  href={`/dashboard/cards/${id}/leads?status=${option.value}`}
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

        {unreadable ? (
          <p className="mt-6 rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
            These leads could not be read. If the card is not yours, that is expected.
          </p>
        ) : leads.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <Inbox className="mx-auto size-6 text-subtle" aria-hidden />
            <p className="mt-3 text-[15px] font-medium text-fg">
              No {status} leads
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">
              {status === "new"
                ? "When someone uses the enquiry form on your card, it lands here."
                : "Nothing in this stage yet. Change the status on a lead to move it here."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {leads.map((lead) => (
              <li
                key={lead.id}
                className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-fg">{lead.name}</p>
                    <p className="mt-0.5 text-[13px] text-muted">
                      {lead.phone}
                      {lead.email ? ` · ${lead.email}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{humanise(lead.source)}</Badge>
                    <span className="text-[12px] text-subtle">{timeAgo(lead.created_at)}</span>
                  </div>
                </div>

                {lead.message ? (
                  <p className="mt-3 flex gap-2 text-[13px] leading-relaxed text-muted">
                    <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-subtle" aria-hidden />
                    <span className="min-w-0">{lead.message}</span>
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <LeadStatusSelect leadId={String(lead.id)} initial={lead.status} />
                  {/* `tel:` and `sms:` are the point of a lead row — tapping should
                      open the dialler, not a web page. */}
                  <a
                    href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
                  >
                    Call
                  </a>
                  <a
                    href={`sms:${lead.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
                  >
                    Message
                  </a>
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}?subject=${encodeURIComponent("Re: your enquiry")}`}
                      className="inline-flex h-11 items-center rounded-lg border border-border px-3 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
                    >
                      Email
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** `enquiry` / `service_cta` → "Enquiry" / "Service CTA". */
function humanise(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}