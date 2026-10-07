"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Crown, Eye } from "lucide-react";
import { useState } from "react";

import { CardView } from "@/components/card/card-view";
import { Modal } from "@/components/ui/modal";
import { demoCard } from "@/lib/cards/demo";
import type { ThemeShowcase } from "@/lib/marketing/themes";
import { cn } from "@/lib/utils";

/**
 * The designs grid and its preview dialog.
 *
 * Two parts, one client component — they share the selected slug, so splitting
 * them would mean lifting that state into a parent and re-rendering the whole
 * grid on every open.
 *
 * The tiles are small and compact on purpose. Each renders the *real* card
 * renderer scaled down inside a clipped frame, so a design is judged by what it
 * actually looks like rather than by a colour swatch. The frame is `pointer-events-none`
 * and fixed height, which is what keeps the grid uniform no matter how long a
 * theme's content is.
 *
 * The dialog is the "preview before you choose" step: the selected design at
 * full card size, the same designs as a switcher underneath, and two real
 * actions — start a card with this design, or keep browsing. Nothing here
 * navigates silently.
 */
export function DesignsGrid({
  themes,
  notes,
  fallbackCount,
}: {
  themes: ThemeShowcase[];
  /** Editorial line per theme slug, from `@/lib/marketing/content`. */
  notes: Record<string, string>;
  /** Total number of designs in the catalogue, for the "all N" link. */
  fallbackCount: number;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  if (themes.length === 0) return null;

  return (
    <>
      <ul className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {themes.map((theme, index) => (
          <li key={theme.slug}>
            <motion.div
              role="button"
              tabIndex={0}
              onClick={() => setOpenSlug(theme.slug)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenSlug(theme.slug); } }}
              className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lg focus-visible:-translate-y-1"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -60px 0px" }}
              transition={{
                duration: 0.5,
                delay: (index % 4) * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Compact, real preview. Clipped so every tile is the same size. */}
              <div className="relative aspect-4/5 overflow-hidden border-b border-line bg-surface-2">
                <div
                  className="pointer-events-none absolute inset-0 origin-top-left scale-[0.62] [width:161%] [height:161%]"
                  aria-hidden
                >
                  <CardView card={{ ...demoCard, theme: theme.config }} preview />
                </div>

                {/* On hover the tile says what tapping it will do. */}
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/45 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-neutral-900 shadow-lg">
                    <Eye className="size-3.5" aria-hidden />
                    Preview
                  </span>
                </div>

                {theme.isPremium ? (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-neutral-950/70 px-2 py-0.5 text-[10px] font-semibold text-amber-300 backdrop-blur-sm">
                    <Crown className="size-2.5" aria-hidden />
                    Premium
                  </span>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-3.5">
                <h3 className="text-[14px] leading-tight font-semibold text-fg">{theme.name}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                  {notes[theme.slug] ?? theme.description}
                </p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-medium text-brand opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  Choose Design
                  <ArrowRight className="size-3" aria-hidden />
                </span>
              </div>
            </motion.div>
          </li>
        ))}
      </ul>

      <DesignPreviewDialog
        themes={themes}
        notes={notes}
        activeSlug={openSlug}
        onClose={() => setOpenSlug(null)}
        onSelect={setOpenSlug}
        allCount={fallbackCount}
      />
    </>
  );
}

/* ── The dialog ────────────────────────────────────────────────────────────── */

function DesignPreviewDialog({
  themes,
  notes,
  activeSlug,
  onClose,
  onSelect,
  allCount,
}: {
  themes: ThemeShowcase[];
  notes: Record<string, string>;
  activeSlug: string | null;
  onClose: () => void;
  onSelect: (slug: string) => void;
  allCount: number;
}) {
  const active = themes.find((theme) => theme.slug === activeSlug);

  return (
    <Modal
      open={Boolean(active)}
      onClose={onClose}
      size="lg"
      title={active ? `${active.name} design` : undefined}
      description={active ? (notes[active.slug] ?? active.description) : undefined}
      footer={
        active ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/templates"
              className="text-[13px] font-medium text-muted transition-colors hover:text-fg"
            >
              See all {allCount} designs
            </Link>
            {/* Carries the chosen design into signup, where it is stored on the
                user record and applied to the first card. */}
            <Link
              href={`/signup?theme=${active.slug}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-fg shadow-sm transition-colors hover:bg-brand-hover"
            >
              Choose this design
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : null
      }
    >
      {active ? (
        <div className="grid gap-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:items-start">
          {/* The card, at real size. */}
          <div className="mx-auto w-full max-w-[15rem] overflow-hidden rounded-2xl border border-line shadow-md">
            <div className="max-h-[26rem] overflow-y-auto overscroll-contain [scrollbar-width:none]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <CardView card={{ ...demoCard, theme: active.config }} preview />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div>
            <dl className="grid grid-cols-2 gap-3">
              {[
                { term: "Layout", value: active.config.layout },
                { term: "Hero", value: active.config.hero },
                { term: "Density", value: active.config.density },
                { term: "Buttons", value: active.config.buttonStyle },
              ].map((axis) => (
                <div key={axis.term} className="rounded-xl border border-line bg-surface-2 px-3 py-2.5">
                  <dt className="text-[10.5px] font-semibold tracking-[0.1em] text-subtle uppercase">
                    {axis.term}
                  </dt>
                  <dd className="mt-0.5 text-[13px] font-medium text-fg capitalize">
                    {axis.value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-5 text-[13.5px] leading-relaxed text-muted">
              {active.description}
            </p>

            <div className="mt-5">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-subtle uppercase">
                Switch design
              </p>
              <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {themes.map((theme) => {
                  const selected = theme.slug === active.slug;
                  return (
                    <button
                      key={theme.slug}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(theme.slug)}
                      className={cn(
                        "shrink-0 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                        selected
                          ? "border-brand bg-brand-soft text-brand-soft-fg"
                          : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
                      )}
                    >
                      {theme.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}