import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, TrendingDown, TrendingUp } from "lucide-react";

import { ANALYTICS_COMPARISON_DAYS, getCardAnalytics } from "@/lib/analytics/summary";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Who is opening your card, and where they came from.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Card analytics.
 *
 * Reports shape, never identity: `analytics_events` carries a `visitor_hash` and
 * a referrer, and neither is selected here. The owner learns that 40 people came
 * from WhatsApp, not who they are — which is also what the table's own comment
 * (no IP, no raw user-agent) promises.
 *
 * When Supabase is unconfigured the page renders zeros with a reason, rather than
 * an empty chart that reads as "nobody has looked at your card".
 */
export default async function AnalyticsPage({
  params,
}: PageProps<"/dashboard/cards/[id]/analytics">) {
  const { id } = await params;
  await requireUser();

  // No `isSupabaseConfigured` branch here: `requireUser()` already redirects a
  // fresh clone with no credentials to /login, so the check could never be false.
  const summary = await getCardAnalytics(id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/dashboard/cards/${id}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Builder
          </Link>
          <h1 className="truncate text-2xl font-semibold tracking-tight text-fg">Analytics</h1>
        </div>
        <DownloadCsv id={id} />
      </div>
      <div>
        <section aria-labelledby="totals-heading">
          <h2 id="totals-heading" className="sr-only">
            Totals for the last 30 days
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            <Stat
              label="Views"
              value={summary.totals.views}
              previous={summary.previous.views}
              tone="views"
            />
            <Stat
              label="QR scans"
              value={summary.totals.scans}
              previous={summary.previous.scans}
              tone="scans"
            />
            <Stat label="Leads" value={summary.totals.leads} previous={null} tone="leads" />
          </ul>
          <p className="mt-2 text-[12px] text-subtle">
            Compared with the previous {ANALYTICS_COMPARISON_DAYS} days.
          </p>
        </section>

        <section aria-labelledby="chart-heading" className="mt-8">
          <h2 id="chart-heading" className="text-[15px] font-semibold text-fg">
            Views over the last 30 days
          </h2>
          <div className="mt-3 rounded-2xl border border-border bg-surface p-5">
            <Sparkline days={summary.days} />
            <p className="mt-3 text-[12px] text-subtle">
              {isoDay(summary.days[0]?.date)} to {isoDay(summary.days.at(-1)?.date)} (UTC)
            </p>
          </div>
        </section>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Breakdown title="Where they came from" rows={summary.sources} />
          <Breakdown title="What they used" rows={summary.devices} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  previous,
  tone,
}: {
  label: string;
  value: number;
  previous: number | null;
  tone: "views" | "scans" | "leads";
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface px-4 py-4">
      <p className="text-[12.5px] text-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular text-fg">{value}</p>
      {previous === null ? null : <Trend value={value} previous={previous} />}
      {tone === "leads" ? (
        <p className="mt-1 text-[12px] text-subtle">Last 30 days</p>
      ) : null}
    </li>
  );
}

/**
 * Direction only, with the count spelled out.
 *
 * A percentage from a small base is misleading ("+400%" off two views), so the
 * absolute change is shown next to it and zero previous reads as "new" rather than
 * as infinite growth.
 */
function Trend({ value, previous }: { value: number; previous: number }) {
  const change = value - previous;

  if (previous === 0 && value === 0) {
    return <p className="mt-1 text-[12px] text-subtle">No change</p>;
  }
  if (previous === 0) {
    return <p className="mt-1 text-[12px] text-muted">All of them new</p>;
  }

  const up = change > 0;
  const flat = change === 0;

  return (
    <p
      className={
        "mt-1 inline-flex items-center gap-1 text-[12px] " +
        (flat ? "text-subtle" : up ? "text-success" : "text-muted")
      }
    >
      {flat ? null : up ? (
        <TrendingUp className="size-3.5" aria-hidden />
      ) : (
        <TrendingDown className="size-3.5" aria-hidden />
      )}
      {up ? "+" : ""}
      {change} vs previous period
    </p>
  );
}

/**
 * A bar chart, drawn as divs.
 *
 * An SVG chart would need a charting dependency and a client bundle for something
 * that is thirty rectangles. Bars carry an accessible label each, so the chart is
 * readable by a screen reader as a list of days rather than as an image.
 */
function Sparkline({ days }: { days: { date: string; views: number }[] }) {
  if (days.length === 0) {
    return <p className="py-8 text-center text-[13px] text-muted">No views yet.</p>;
  }

  const peak = Math.max(...days.map((day) => day.views), 1);

  return (
    <div>
      <div
        className="flex h-32 items-end gap-[3px]"
        role="img"
        aria-label={`Views per day for the last ${days.length} days. Peak ${peak}.`}
      >
        {days.map((day) => (
          <div
            key={day.date}
            // A zero-height bar would vanish; 2px keeps the day present but empty.
            className="flex-1 rounded-t bg-brand/70"
            style={{ height: `${Math.max(2, (day.views / peak) * 100)}%` }}
            title={`${day.date}: ${day.views} ${day.views === 1 ? "view" : "views"}`}
          />
        ))}
      </div>
      <ul className="sr-only">
        {days
          .filter((day) => day.views > 0)
          .map((day) => (
            <li key={day.date}>
              {day.date}: {day.views} {day.views === 1 ? "view" : "views"}
            </li>
          ))}
      </ul>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-muted">Nothing recorded yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const peak = rows[0]?.count || 1;
            return (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-fg">{row.label}</span>
                  <span className="tabular text-muted">{row.count}</span>
                </div>
                <div
                  className="mt-1.5 h-1.5 rounded-full bg-surface-3"
                  role="presentation"
                >
                  <div
                    className="h-1.5 rounded-full bg-brand/70"
                    style={{ width: `${(row.count / peak) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * CSV of the same window the page shows.
 *
 * Rendered as a link rather than a client-side blob so the download works without
 * JavaScript and the file is generated fresh on each request.
 */
function DownloadCsv({ id }: { id: string }) {
  return (
    <a
      href={`/api/cards/${id}/analytics.csv`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
    >
      <Download className="size-3.5" aria-hidden />
      Export CSV
    </a>
  );
}

function isoDay(date: string | undefined): string {
  if (!date) return "—";
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}