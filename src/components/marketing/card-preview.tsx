"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Crown } from "lucide-react";
import { useEffect, useState } from "react";

import { CardView } from "@/components/card/card-view";
import { QrImage } from "@/components/card/qr";
import { demoCard } from "@/lib/cards/demo";
import type { ThemeShowcase } from "@/lib/marketing/themes";
import { cn } from "@/lib/utils";

/**
 * The live card on the landing hero.
 *
 * It renders the *actual* card renderer against the *actual* theme list, so the
 * preview cannot drift from what a user gets after signing up. The only
 * concessions are in `CardView`'s `preview` mode: no analytics beacon, and no
 * sticky bar (a `position: fixed` element inside a mock-up is meaningless).
 *
 * The themes cycle on their own until the visitor takes over — hover, focus or
 * a click stops the timer. That gives the hero a slow, professional loop rather
 * than a static screenshot, without ever moving unless someone is looking. It
 * also stops permanently for anyone who asked for reduced motion, who gets a
 * single theme and the switcher instead.
 *
 * `tone="dark"` swaps the selector chrome for the dark hero behind it. The QR
 * chip encodes a real destination (`qrValue`) — never a decorative pattern that
 * looks scannable but is not.
 *
 * A horizontal, scroll-snapping theme list keeps the swatches usable on a phone
 * without wrapping into a tall block.
 */

/** How long each theme holds before the auto-advance. Slow enough to read. */
const ROTATE_MS = 4200;

export function CardPreview({
  themes,
  qrValue,
  tone = "light",
}: {
  themes: ThemeShowcase[];
  /** Absolute URL the hero QR encodes — usually the sample card. */
  qrValue?: string;
  tone?: "light" | "dark";
}) {
  const reduce = useReducedMotion();
  const [activeSlug, setActiveSlug] = useState<string>(
    () => themes.find((theme) => theme.slug === "professional")?.slug ?? themes[0]?.slug ?? "",
  );
  const [autoRotate, setAutoRotate] = useState(true);

  const dark = tone === "dark";

  // `getShowcaseThemes` always returns at least the seeded list, but a guard here
  // means a future caller can never crash the landing page's hero.
  const active = themes.find((theme) => theme.slug === activeSlug);

  useEffect(() => {
    if (reduce || !autoRotate || themes.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveSlug((current) => {
        const index = themes.findIndex((theme) => theme.slug === current);
        return themes[(index + 1) % themes.length]?.slug ?? current;
      });
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [reduce, autoRotate, themes]);

  if (!active) return null;

  // The demo fixture is theme-agnostic apart from its theme, so switching only
  // has to swap that one field.
  const previewCard = { ...demoCard, theme: active.config };

  return (
    <div
      className="w-full"
      onPointerEnter={() => setAutoRotate(false)}
      onFocusCapture={() => setAutoRotate(false)}
    >
      {/* Phone frame, floating. The scan-me chip overlaps its lower-left corner. */}
      <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-[18rem]">
        <div
          className="absolute -inset-8 -z-10 rounded-[3rem] bg-brand/20 blur-3xl"
          aria-hidden
        />

        <motion.div
          className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]"
          animate={reduce ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-[30rem] overflow-y-auto overscroll-contain bg-bg [scrollbar-width:none] sm:h-[32rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                <CardView card={previewCard} preview />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {qrValue ? (
          <motion.div
            className="absolute -left-6 bottom-10 hidden rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/5 sm:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <QrImage
              value={qrValue}
              size={72}
              alt="Scan to open the sample Digital Visiting Card"
              className="block"
            />
            <p className="mt-1.5 text-center text-[10px] font-semibold tracking-wide text-neutral-600 uppercase">
              Scan to view
            </p>
          </motion.div>
        ) : null}
      </div>

      {/* Caption + switcher, below the phone rather than above it: on a phone the
          copy reads first, then the card, then the control. */}
      <div className="mt-6">
        <div className="flex items-center gap-2 px-1">
          <h3 className={cn("text-[15px] font-semibold", dark ? "text-white" : "text-fg")}>
            {active.name}
          </h3>
          {active.isPremium ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-accent/20 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
              <Crown className="size-3" aria-hidden />
              Premium
            </span>
          ) : (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                dark ? "bg-emerald-400/15 text-emerald-300" : "bg-success-soft text-success",
              )}
            >
              Free
            </span>
          )}
          <span className={cn("ml-auto text-[12px]", dark ? "text-white/45" : "text-subtle")}>
            {active.config.layout} · {active.config.hero}
          </span>
        </div>

        <p
          className={cn(
            "mt-1.5 line-clamp-2 text-[13px] leading-relaxed",
            dark ? "text-white/60" : "text-muted",
          )}
        >
          {active.description}
        </p>

        <div
          role="group"
          aria-label="Card designs"
          className="mt-3.5 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {themes.map((theme) => {
            const selected = theme.slug === active.slug;
            return (
              <button
                key={theme.slug}
                type="button"
                aria-pressed={selected}
                aria-label={`Show the ${theme.name} design`}
                onClick={() => {
                  setAutoRotate(false);
                  setActiveSlug(theme.slug);
                }}
                className={cn(
                  "group relative size-8 shrink-0 snap-start overflow-hidden rounded-lg ring-1 transition-all duration-200",
                  selected
                    ? "ring-2 ring-white"
                    : dark
                      ? "ring-white/25 hover:ring-white/50"
                      : "ring-black/10 hover:ring-black/25",
                )}
              >
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: theme.config.palette.bg }}
                  aria-hidden
                />
                <span
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(140deg, ${theme.config.palette.accent} 0%, ${theme.config.palette.accent} 46%, transparent 46%)`,
                  }}
                  aria-hidden
                />
                <span
                  className="absolute inset-x-2 bottom-1.5 h-1 rounded-full"
                  style={{ backgroundColor: theme.config.palette.fg, opacity: 0.5 }}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <Link
          href="/templates"
          className={cn(
            "mt-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-opacity hover:opacity-80",
            dark ? "text-white" : "text-black",
          )}
        >
          Browse all {themes.length} designs
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}