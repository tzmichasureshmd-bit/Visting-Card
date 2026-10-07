import type { CardData } from "@/lib/cards/types";

/**
 * vCard 3.0 generation (section 12).
 *
 * vCard is chosen over 4.0 deliberately: iOS and Android contact importers both
 * handle 3.0 reliably, whereas 4.0 support is patchy on older handsets.
 *
 * Everything is folded to CRLF (the RFC line ending) and every free-text value
 * is escaped, because unescaped commas or semicolons in a name or note
 * silently corrupt the whole record on import.
 */

function escapeValue(value: string): string {
  return value
    // Backslash first, otherwise the escapes introduced below get re-escaped.
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** RFC 6350 folding: lines must not exceed 75 octets, continuations start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let current = "";
  for (const char of line) {
    if (new TextEncoder().encode(current + char).length > 74) {
      out.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) out.push(current);
  // Subsequent chunks are prefixed with a single space by the caller's join.
  return out.join("\r\n ");
}

export function buildVCard(card: CardData): string {
  const nameParts = card.fullName.trim().split(/\s+/);
  const given = nameParts.slice(0, -1).join(" ");
  const family = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  // Name fields
  lines.push(`N:${escapeValue(family)};${escapeValue(given)};;;`);
  lines.push(`FN:${escapeValue(card.fullName)}`);

  if (card.company) lines.push(`ORG:${escapeValue(card.company)}`);
  if (card.designation) lines.push(`TITLE:${escapeValue(card.designation)}`);
  if (card.bio) lines.push(`NOTE:${escapeValue(card.bio)}`);

  // Contact
  if (card.phone) lines.push(`TEL;TYPE=CELL,VOICE:${escapeValue(card.phone)}`);
  // The second number is tagged so import apps do not present two identical rows.
  if (card.whatsapp && card.whatsapp !== card.phone) {
    lines.push(`TEL;TYPE=CELL,OTHER:${escapeValue(card.whatsapp)}`);
  }
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeValue(card.email)}`);
  if (card.website) {
    const url = /^https?:\/\//i.test(card.website) ? card.website : `https://${card.website}`;
    lines.push(`URL:${escapeValue(url)}`);
  }

  // Address
  const street = [card.address, card.city, card.state, card.pincode, card.country]
    .filter(Boolean)
    .join(", ");
  if (street) {
    lines.push(
      `ADR;TYPE=WORK:;;${escapeValue(card.address ?? "")};${escapeValue(card.city ?? "")};` +
        `${escapeValue(card.state ?? "")};${escapeValue(card.pincode ?? "")};` +
        `${escapeValue(card.country ?? "India")}`,
    );
  }

  // Social profiles. X-SOCIALPROFILE is the de-facto convention for Twitter/X;
  // other networks go in as labelled URLs so nothing is silently dropped.
  const social = card.socialLinks.filter((link) => link.platform !== "custom");
  for (const link of social) {
    if (link.platform === "x" || link.platform === "twitter") {
      lines.push(`X-SOCIALPROFILE;TYPE=twitter:${escapeValue(link.url)}`);
    } else {
      lines.push(`X-SOCIALPROFILE;TYPE=${escapeValue(link.platform)}:${escapeValue(link.url)}`);
    }
  }
  if (card.socialLinks.some((link) => link.platform === "custom")) {
    lines.push(
      `X-DV-EXTRA-LINKS:${escapeValue(
        card.socialLinks
          .filter((link) => link.platform === "custom")
          .map((link) => `${link.label ?? link.platform}: ${link.url}`)
          .join(" | "),
      )}`,
    );
  }

  lines.push(`REV:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`);
  lines.push("END:VCARD");

  return lines.map(fold).join("\r\n");
}

/**
 * Triggers a download of the contact file.
 *
 * Must run in the browser: it creates a temporary anchor and object URL, which
 * only exist client-side.
 */
export function downloadVCard(card: CardData): void {
  const vcard = buildVCard(card);
  // A BOM makes Android's Contacts app reliably detect the file as a vCard.
  const blob = new Blob(["﻿", vcard], {
    type: "text/vcard;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = contactFilename(card);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Revoke on the next tick; revoking synchronously can cancel the download in Safari.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Pretty "First Last" split, so downloads can be named per contact. */
export function contactFilename(card: CardData): string {
  const safe = card.fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${safe || card.username}.vcf`;
}