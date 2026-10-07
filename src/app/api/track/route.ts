import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createPublicClient } from "@/lib/supabase/server";
import { clientIp, deviceCategory, rateLimit } from "@/lib/rate-limit";
import { serverConfig } from "@/lib/env";

/**
 * Analytics ingest for public cards.
 *
 * Design constraints:
 *  - Anonymous and *append-only*: the anon key may INSERT into
 *    `analytics_events` under RLS and nothing else (see 0003_rls.sql). There is
 *    no UPDATE or DELETE policy, so nothing here can rewrite history.
 *  - No raw IP is stored. The visitor is reduced to a salted daily bucket so
 *    "unique visitors" can be computed without keeping a personal identifier.
 *  - Everything except the counters is best-effort: a tracking failure must
 *    never surface to the visitor, so this always answers 204.
 */

export const runtime = "nodejs";

/** Events the client is allowed to report. */
const ALLOWED_EVENTS = new Set([
  "card_view",
  "whatsapp_click",
  "call_click",
  "email_click",
  "website_click",
  "share",
  "contact_save",
  "upi_click",
  "qr_scan",
]);

/** Traffic sources we classify ourselves, instead of trusting a query param. */
function classifySource(referrer: string | null, utmSource: string | null): string {
  if (utmSource) return utmSource.toLowerCase().slice(0, 60);
  if (!referrer) return "direct";

  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host === "wa.me" || host.endsWith(".whatsapp.com")) return "whatsapp";
    if (host.endsWith("instagram.com") || host.endsWith("l.instagram.com")) return "instagram";
    if (host.endsWith("facebook.com") || host.endsWith("fb.com") || host.endsWith("fb.me")) {
      return "facebook";
    }
    if (host.endsWith("linkedin.com") || host.endsWith("lnkd.in")) return "linkedin";
    if (host.endsWith("youtube.com") || host.endsWith("youtu.be")) return "youtube";
    if (host.endsWith("t.me")) return "telegram";
    if (host.endsWith("google.")) return "search";
    if (host.endsWith("bing.com") || host.endsWith("duckduckgo.com")) return "search";
    return "referral";
  } catch {
    return "referral";
  }
}

/**
 * A visitor key that is stable within a day but not reversible to an IP.
 * Rotating the bucket daily keeps counts honest without building a long-term
 * per-person trail.
 */
function visitorHash(ip: string, userAgent: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const salt = serverConfig.analyticsSalt;
  return createHash("sha256")
    .update(`${salt}:${day}:${ip}:${userAgent}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * The whole handler is wrapped because a tracking failure must never reach the
 * visitor: `sendBeacon` gives us no way to observe a non-2xx, and a 5xx on every
 * card view is worse than a lost event. Anything thrown is logged server-side and
 * answered with 204.
 */
export async function POST(request: NextRequest) {
  try {
    return await record(request);
  } catch (error) {
    console.error("[track] handler threw", error);
    return new NextResponse(null, { status: 204 });
  }
}

async function record(request: NextRequest): Promise<NextResponse> {
  // Cheap flood protection. A rejected event is a valid event loss, which is
  // preferable to this endpoint being used to hammer Supabase.
  const ip = clientIp(request.headers);
  if (!rateLimit(`track:${ip}`, 240, 60_000)) {
    return new NextResponse(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const eventType = typeof payload.eventType === "string" ? payload.eventType : "";
  const cardId = typeof payload.cardId === "string" ? payload.cardId : "";

  if (!ALLOWED_EVENTS.has(eventType) || !/^[0-9a-f-]{36}$/i.test(cardId)) {
    return new NextResponse(null, { status: 204 });
  }

  const referrer = typeof payload.referrer === "string" ? payload.referrer.slice(0, 500) : null;
  const utmSource = typeof payload.utmSource === "string" ? payload.utmSource.slice(0, 60) : null;
  const utmCampaign =
    typeof payload.utmCampaign === "string" ? payload.utmCampaign.slice(0, 60) : null;

  const supabase = await createPublicClient();

  const { error } = await supabase.from("analytics_events").insert({
    card_id: cardId,
    event_type: eventType,
    visitor_hash: visitorHash(ip, request.headers.get("user-agent") ?? ""),
    device_category: deviceCategory(request.headers.get("user-agent")),
    traffic_source: classifySource(referrer, utmSource),
    referrer,
    utm_source: utmSource,
    utm_campaign: utmCampaign,
  });

  if (error) {
    // Log server-side only; never leak internals to the caller.
    console.error("[track] insert failed", error.message);
  }

  // `cards.view_count` / `qr_scan_count` are maintained by the
  // `analytics_bump_card_counters` trigger (0006), so there is no second write
  // here to keep in sync — and the anon key never needs UPDATE on `cards`.
  return new NextResponse(null, { status: 204 });
}
