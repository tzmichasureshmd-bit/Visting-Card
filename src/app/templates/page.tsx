import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { TemplateGallery } from "@/components/marketing/template-gallery";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getShowcaseThemes } from "@/lib/marketing/themes";

export const metadata: Metadata = {
  title: "Card Templates",
  description:
    "Browse every Digital Visiting Card design. Each template is a different page structure — not a colour swap — and every one is rendered live before you choose it.",
  alternates: { canonical: "/templates" },
};

/**
 * The template gallery.
 *
 * A real route rather than a landing-page section: designs need to be linkable
 * (from the header nav, the pricing page and the builder's style picker) and
 * indexable, and the gallery needs room for twenty-two designs without turning
 * the landing page into a catalogue.
 *
 * `getShowcaseThemes` reads the live `themes` table and falls back to the seeded
 * list, so this page renders in a fresh checkout with no credentials configured.
 */
export default async function TemplatesPage() {
  const themes = await getShowcaseThemes();

  return (
    <>
      <SiteHeader />

      <main id="content" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to home
        </Link>

        <header className="mt-6 max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Twenty-two designs, twenty-two different pages
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-pretty text-muted">
            These are not colour swaps. Each design changes where your identity
            sits, how sections flow, and how the type is set. Pick one and the
            preview below shows the real card you will get.
          </p>
        </header>

        <div className="mt-12">
          <TemplateGallery themes={themes} />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}