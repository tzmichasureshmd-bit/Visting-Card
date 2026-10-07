import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CardView } from "@/components/card/card-view";
import { CardNotFoundError, getPublicCard } from "@/lib/cards/query";
import { publicConfig } from "@/lib/env";

/**
 * The public card route.
 *
 * Rendering choices worth noting:
 *  - The page is a Server Component, so a visitor receives the finished HTML —
 *    nothing waits on hydration before they can tap WhatsApp or call (section 73).
 *  - Full JSON-LD `Person`/`LocalBusiness` schema is emitted server-side, which is
 *    what makes a card eligible for rich results and for AI answer engines
 *    (section 29).
 *  - `revalidate` keeps a popular card fast without a database read on every
 *    hit; the analytics endpoint still records views independently.
 */

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

/**
 * Serialise JSON-LD safely.
 *
 * `JSON.stringify` does not escape `<`, so a bio containing `</script>` would
 * close the script tag early and let stored markup execute. Escaping the three
 * HTML-significant characters as JSON unicode escapes keeps the payload valid
 * JSON while making it inert as HTML.
 */
function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    // U+2028/U+2029 are valid in JSON but terminate a line in a script element.
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

type Params = { params: Promise<{ username: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { username } = await params;

  if (!USERNAME_PATTERN.test(username)) {
    return { title: "Card not found", robots: { index: false, follow: false } };
  }

  let card;
  try {
    card = await getPublicCard(username);
  } catch {
    // An unknown username must not advertise itself in search results.
    return {
      title: "Card not found",
      robots: { index: false, follow: true },
    };
  }

  const siteUrl = publicConfig.appUrl;
  const url = `${siteUrl}/card/${card.username}`;

  const title = card.designation
    ? `${card.fullName} — ${card.designation}`
    : card.fullName;

  // Prefer a real photo, then the cover, then nothing (no generated avatar in the
  // og image, since opengraph-image.tsx handles the fallback).
  const ogImage = card.photoUrl ?? card.coverUrl ?? undefined;

  const descriptionParts = [
    card.designation,
    card.company,
    card.bio ? card.bio.slice(0, 160) : null,
  ].filter((part): part is string => Boolean(part));

  return {
    title,
    description: descriptionParts.join(" · ") || `${card.fullName} — Digital Visiting Card`,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description: descriptionParts.join(" · ") || undefined,
      siteName: "Tzmicha It Solutions",
      locale: "en_IN",
      ...(ogImage ? { images: [{ url: ogImage, width: 1120, height: 1120 }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description: descriptionParts.join(" · ") || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function CardPage({ params }: Params) {
  const { username } = await params;

  if (!USERNAME_PATTERN.test(username)) notFound();

  let card;
  try {
    card = await getPublicCard(username);
  } catch (error) {
    if (error instanceof CardNotFoundError) notFound();
    console.error("[card] unexpected render failure", error);
    notFound();
  }

  const siteUrl = publicConfig.appUrl;
  const profileUrl = `${siteUrl}/card/${card.username}`;

  const personSchema = {
    "@context": "https://schema.org",
    "@type": card.type === "company" ? "Organization" : "Person",
    name: card.fullName,
    url: profileUrl,
    ...(card.designation ? { jobTitle: card.designation } : {}),
    ...(card.company ? { worksFor: { "@type": "Organization", name: card.company } } : {}),
    ...(card.bio ? { description: card.bio } : {}),
    ...(card.photoUrl ? { image: card.photoUrl } : {}),
    ...(card.email ? { email: `mailto:${card.email}` } : {}),
    ...(card.phone ? { telephone: `+91${card.phone}` } : {}),
    ...(card.address || card.city
      ? {
          address: {
            "@type": "PostalAddress",
            ...(card.address ? { streetAddress: card.address } : {}),
            ...(card.city ? { addressLocality: card.city } : {}),
            ...(card.state ? { addressRegion: card.state } : {}),
            ...(card.pincode ? { postalCode: card.pincode } : {}),
            ...(card.country ? { addressCountry: card.country } : {}),
          },
        }
      : {}),
    ...(card.socialLinks.length > 0
      ? {
          sameAs: card.socialLinks
            .map((link) => link.url)
            .filter((url) => url.startsWith("https://")),
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personSchema) }} />
      <CardView card={card} />
    </>
  );
}
