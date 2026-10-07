import "server-only";

import { createClient } from "@/lib/supabase/server";
import { serverConfig } from "@/lib/env";

/**
 * Per-card analytics, aggregated in JS.
 *
 * `analytics_events` is an append-only table with a `created_at desc` index, and
 * a card's row count is small enough (a busy card is thousands, not millions) that
 * fetching the window and reducing it in the server component beats adding an
 * aggregate view. The alternative — a `count(*)` per bucket in SQL — issues one
 * round trip per day on the list, which is the worse trade at this scale.
 *
 * Only the fields the charts need are selected. `visitor_hash` and `referrer` are
 * deliberately not fetched: this page reports shape, never identity.
 */

/** Buckets are days, newest last. */
const DAYS = 30;

/**
 * The window length, and the half of it the trend compares against.
 *
 * Exported so the page can label the comparison from the same number the query
 * uses instead of a hardcoded `15` that silently goes stale if `DAYS` changes.
 */
export const ANALYTICS_WINDOW_DAYS = DAYS;
export const ANALYTICS_COMPARISON_DAYS = Math.round(DAYS / 2);

export interface DayCount {
  /** `YYYY-MM-DD` in UTC. */
  date: string;
  views: number;
  scans: number;
}

export interface AnalyticsSummary {
  totals: { views: number; scans: number; leads: number };
  /** Whole-window, not per-day averages. */
  previous: { views: number; scans: number };
  days: DayCount[];
  sources: { label: string; count: number }[];
  devices: { label: string; count: number }[];
}

const EMPTY: AnalyticsSummary = {
  totals: { views: 0, scans: 0, leads: 0 },
  previous: { views: 0, scans: 0 },
  days: [],
  sources: [],
  devices: [],
};

export async function getCardAnalytics(cardId: string): Promise<AnalyticsSummary> {
  if (!serverConfig.isSupabaseConfigured) return EMPTY;

  const supabase = await createClient();
  const now = new Date();
  const windowStart = startOfDay(addDays(now, -(DAYS - 1)));

  const [{ data: events, error }, { count: leadCount }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("event_type, device_category, traffic_source, created_at")
      .eq("card_id", cardId)
      .gte("created_at", windowStart.toISOString())
      // Capped so a scripted visitor cannot make one card's page expensive.
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("card_id", cardId)
      .gte("created_at", windowStart.toISOString()),
  ]);

  // RLS already scopes this to cards the caller can manage; a failure here means
  // the page has nothing to draw, which the empty state explains.
  if (error) {
    console.error("[analytics] read failed", error.message);
    return EMPTY;
  }

  return reduce(events ?? [], leadCount ?? 0, now);
}

function reduce(
  events: { event_type: string; device_category: string | null; traffic_source: string | null; created_at: string }[],
  leadCount: number,
  now: Date,
): AnalyticsSummary {
  const days: DayCount[] = [];
  for (let offset = DAYS - 1; offset >= 0; offset--) {
    const date = addDays(now, -offset);
    days.push({ date: isoDate(date), views: 0, scans: 0 });
  }

  const sourceCounts = new Map<string, number>();
  const deviceCounts = new Map<string, number>();

  const midpoint = startOfDay(addDays(now, -Math.floor(DAYS / 2))).getTime();

  for (const event of events) {
    const at = new Date(event.created_at);
    if (Number.isNaN(at.getTime())) continue;

    const isView = event.event_type === "view";
    const isScan = event.event_type === "qr_scan";

    const day = days.find((entry) => entry.date === isoDate(at));
    if (day) {
      if (isView) day.views += 1;
      if (isScan) day.scans += 1;
    }

    if (at.getTime() < midpoint) continue;

    const source = label(event.traffic_source);
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);

    const device = label(event.device_category);
    deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
  }

  const totals = days.reduce(
    (sum, day) => ({ views: sum.views + day.views, scans: sum.scans + day.scans }),
    { views: 0, scans: 0 },
  );

  return {
    totals: { ...totals, leads: leadCount },
    previous: countWindow(events, midpoint),
    days,
    sources: top(sourceCounts),
    devices: top(deviceCounts),
  };
}

/** Counts in the older half of the window — the comparison for the trend line. */
function countWindow(
  events: { event_type: string; created_at: string }[],
  from: number,
): { views: number; scans: number } {
  let views = 0;
  let scans = 0;
  for (const event of events) {
    const at = new Date(event.created_at).getTime();
    if (Number.isNaN(at) || at >= from) continue;
    if (event.event_type === "view") views += 1;
    if (event.event_type === "qr_scan") scans += 1;
  }
  return { views, scans };
}

function top(counts: Map<string, number>): { label: string; count: number }[] {
  return [...counts.entries()]
    .map(([key, count]) => ({ label: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** `unknown` is a bucket, not an error, so it is titled rather than dropped. */
function label(value: string | null): string {
  if (!value || value === "unknown") return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}