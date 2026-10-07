import { ImageResponse } from "next/og";

import { CardNotFoundError, getPublicCard } from "@/lib/cards/query";
import { publicConfig } from "@/lib/env";

/**
 * Social preview image for a card.
 *
 * Generated per request with `next/og` rather than stored, so a card whose photo
 * or tagline changes is never shared with a stale preview. Satori only supports a
 * subset of CSS — flexbox and explicit sizes, no grid — which is why every rule
 * below is hand-written.
 *
 * Runs on the Node.js runtime: the Edge Runtime is deprecated in Next 16, and
 * using it also disables static generation for the route.
 */

export const runtime = "nodejs";
export const alt = "Digital Visiting Card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Params = { params: Promise<{ username: string }> };

export default async function OpengraphImage({ params }: Params) {
  const { username } = await params;

  let fullName = "Digital Visiting Card";
  let designation: string | null = null;
  let company: string | null = null;
  let photoUrl: string | null = null;
  let accent = "#2563eb";
  let background = "#ffffff";
  let foreground = "#0f172a";

  try {
    const card = await getPublicCard(username);
    fullName = card.fullName;
    designation = card.designation;
    company = card.company;
    photoUrl = card.photoUrl?.startsWith("https://") ? card.photoUrl : null;
    accent = card.theme.palette.accent;
    background = card.theme.palette.bg;
    foreground = card.theme.palette.fg;
  } catch (error) {
    // An unknown card still gets a branded preview rather than a broken image;
    // the page itself returns 404.
    if (!(error instanceof CardNotFoundError)) {
      console.error("[og] lookup failed", error);
    }
  }

  const initials =
    fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "TZ";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background,
          color: foreground,
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar: the one piece of branding every card gets. */}
        <div style={{ display: "flex", height: 12, width: 220, background: accent, borderRadius: 6 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {photoUrl ? (
            // Satori requires a plain <img>; next/image is unavailable here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              width={180}
              height={180}
              style={{ width: 180, height: 180, borderRadius: 36, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 180,
                height: 180,
                borderRadius: 36,
                background: accent,
                color: "#ffffff",
                fontSize: 72,
                fontWeight: 700,
              }}
            >
              {initials}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>{fullName}</div>
            {designation ? (
              <div style={{ fontSize: 32, color: accent }}>{designation}</div>
            ) : null}
            {company ? (
              <div style={{ fontSize: 28, opacity: 0.7 }}>{company}</div>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 30, opacity: 0.75 }}>
            {publicConfig.appUrl.replace(/^https?:\/\//, "")}/card/{username}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 26,
              fontWeight: 600,
              color: accent,
            }}
          >
            <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, background: accent }} />
            Tap to save the contact
          </div>
        </div>
      </div>
    ),
    size,
  );
}
