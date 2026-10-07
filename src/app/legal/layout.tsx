import type { Metadata } from "next";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export const metadata: Metadata = {
  title: "Legal",
  description: "Policies and contact details for Tzmicha It Solutions.",
};

/**
 * Shared frame for the text-heavy routes under /legal.
 *
 * The marketing header and footer are reused so navigation out of these pages
 * matches the rest of the site; only the article body differs per page. Header
 * anchors (`#features` and friends) resolve back on the landing page, which is
 * where they belong — on a legal page they are inert but harmless, and rewriting
 * them would need a second nav configuration for no real gain.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
