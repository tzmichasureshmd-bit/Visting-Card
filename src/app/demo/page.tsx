import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Heart, Palette, Sparkles } from "lucide-react";

import { CardView } from "@/components/card/card-view";
import { Button } from "@/components/ui/button";
import { demoCard, demoThemes } from "@/lib/cards/demo";

/**
 * The public demo.
 *
 * This is the one route that renders without Supabase configured, so a reviewer
 * can see the finished renderer — all seventeen sections, four layout families —
 * before any credentials exist. It is a presentation fixture and is labelled as a
 * sample on the card itself, so it can never be mistaken for a real person's
 * card, and it is `noindex` to keep it out of search results.
 */

export const metadata: Metadata = {
  title: "Sample card — Digital Visiting Card",
  description:
    "A fully-populated example Digital Visiting Card: services, catalogue, gallery, UPI payments, reviews and booking.",
  robots: { index: false, follow: true },
};

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-surface">
      {/* A slim header so the sample card starts below the fold on a phone,
          without stealing space from the card itself. */}
      <div className="border-b border-border bg-surface-2">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Tzmicha It Solutions
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 text-[13px] text-muted sm:inline-flex">
              <Palette className="size-3.5" aria-hidden />
              {demoThemes.length} themes
            </span>
            <Button asChild size="sm" variant="primary">
              <Link href="/#pricing">Get yours free</Link>
            </Button>
          </div>
        </div>
      </div>

      <CardView card={demoCard} demo />

      <div className="border-t border-border bg-surface-2">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-10 text-center">
          <Sparkles className="size-5 text-brand" aria-hidden />
          <h2 className="text-balance text-xl font-semibold tracking-tight text-fg">
            That is one card. Yours can look exactly like this.
          </h2>
          <p className="max-w-md text-pretty text-sm leading-relaxed text-muted">
            Start free, publish in about two minutes, and pay only when you need a custom
            domain or more cards. No app to install for the people you share it with.
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
            <Button asChild variant="primary">
              <Link href="/#pricing">Create your card</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#features">See what&apos;s included</Link>
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-[13px] text-muted">
            Built with
            <Heart className="size-3.5 text-danger" aria-hidden fill="currentColor" />
            for people who would rather be found than downloaded
          </p>
        </div>
      </div>
    </main>
  );
}
