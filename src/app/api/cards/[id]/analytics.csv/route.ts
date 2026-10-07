import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { serverConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Analytics as CSV.
 *
 * A plain `text/csv` response rather than a Server Action or a client blob: the
 * download has to work with JavaScript disabled, and `Content-Disposition` means
 * the browser names the file without the page having to.
 *
 * The rows are aggregated per day rather than one row per event. A raw event
 * stream would need `visitor_hash` to be useful — and this export deliberately
 * never touches it.
 */
const DAYS = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await requireUser();

  if (!serverConfig.isSupabaseConfigured) {
    return new Response("Supabase is not configured.", { status: 503 });
  }

  const supabase = await createClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (DAYS - 1));
  since.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("analytics_events")
    .select("event_type, device_category, traffic_source, created_at")
    .eq("card_id", id)
    .gte("created_at", since.toISOString())
    .limit(20000);

  // RLS scopes this to cards the caller manages; a failure is a 403 rather than an
  // empty file, which would look like "no traffic".
  if (error) {
    console.error("[analytics] csv export failed", error.message);
    return new Response("Could not read analytics for this card.", { status: 403 });
  }

  const rows = aggregate(data ?? []);
  const csv = toCsv(rows);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="digital-visiting-card-analytics-${id.slice(0, 8)}.csv"`,
      "cache-control": "no-store",
    },
  });
}

interface Row {
  date: string;
  views: number;
  scans: number;
  whatsapp: number;
  instagram: number;
  qr: number;
  referral: number;
  direct: number;
  mobile: number;
  desktop: number;
  tablet: number;
  other: number;
}

function aggregate(
  events: {
    event_type: string;
    device_category: string | null;
    traffic_source: string | null;
    created_at: string;
  }[],
): Row[] {
  const byDate = new Map<string, Row>();

  const row = (date: string): Row =>
    byDate.get(date) ?? {
      date,
      views: 0,
      scans: 0,
      whatsapp: 0,
      instagram: 0,
      qr: 0,
      referral: 0,
      direct: 0,
      mobile: 0,
      desktop: 0,
      tablet: 0,
      other: 0,
    };

  for (const event of events) {
    const at = new Date(event.created_at);
    if (Number.isNaN(at.getTime())) continue;
    const date = at.toISOString().slice(0, 10);
    const target = row(date);
    byDate.set(date, target);

    if (event.event_type === "view") target.views += 1;
    if (event.event_type === "qr_scan") target.scans += 1;

    // Each event counts toward exactly one source and one device column, so the
    // row totals stay internally consistent.
    switch (event.traffic_source) {
      case "whatsapp":
        target.whatsapp += 1;
        break;
      case "instagram":
        target.instagram += 1;
        break;
      case "qr":
        target.qr += 1;
        break;
      case "referral":
        target.referral += 1;
        break;
      case "direct":
        target.direct += 1;
        break;
      default:
        break;
    }

    switch (event.device_category) {
      case "mobile":
        target.mobile += 1;
        break;
      case "desktop":
        target.desktop += 1;
        break;
      case "tablet":
        target.tablet += 1;
        break;
      default:
        target.other += 1;
        break;
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function toCsv(rows: Row[]): string {
  const header = [
    "date",
    "views",
    "qr_scans",
    "source_whatsapp",
    "source_instagram",
    "source_qr",
    "source_referral",
    "source_direct",
    "device_mobile",
    "device_desktop",
    "device_tablet",
    "device_other",
  ];

  const body = rows.map((row) =>
    [
      row.date,
      row.views,
      row.scans,
      row.whatsapp,
      row.instagram,
      row.qr,
      row.referral,
      row.direct,
      row.mobile,
      row.desktop,
      row.tablet,
      row.other,
    ].join(","),
  );

  // A leading `@` makes Excel treat the first cell as text rather than trying to
  // parse the header row as data.
  return `@${header.join(",")}\n${body.join("\n")}\n`;
}