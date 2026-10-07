"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Crown, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CardView } from "@/components/card/card-view";
import { Button } from "@/components/ui/button";
import { demoCardWithTheme } from "@/lib/cards/demo";
import type { ThemeShowcase } from "@/lib/marketing/themes";
import { cn } from "@/lib/utils";

/**
 * The template gallery's interactive preview.
 *
 * One real phone frame renders the actual card renderer (see `CardView`) against
 * the chosen design, so what a visitor selects is exactly what they get. A grid of
 * twenty-two live `CardView` trees would be far too heavy for the browser, so the
 * gallery shows *one* preview and swaps its theme; the design differs structurally,
 * not only in colour, so the switch is the honest way to compare.
 *
 * The template list is a real scroll-snapping track rather than a wrap-around grid,
 * which keeps each design's name and structure legible on a phone. Keyboard users
 * get arrow-key navigation and every button is a real `button` with `aria-pressed`.
 */
export function TemplateGallery({ themes }: { themes: ThemeShowcase[] }) {
  const [activeSlug, setActiveSlug] = useState<string>(themes[0]?.slug ?? "");
  const [category, setCategory] = useState<string>("all");
  const trackRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => ["all", ...new Set(themes.map((theme) => theme.category))],
    [themes],
  );

  const visible = useMemo(
    () =>
      category === "all"
        ? themes
        : themes.filter((theme) => theme.category === category),
    [themes, category],
  );

  // A filter change can hide the active design, so the preview falls back to the
  // first visible one. This is derived during render rather than corrected in an
  // effect: an effect that calls setState to fix a render-derived value causes an
  // extra render pass on every filter click for a result already known here.
  const active = visible.find((theme) => theme.slug === activeSlug) ?? visible[0];
  const activeId = active?.slug ?? "";

  // Keep the selected chip in view when the choice comes from the keyboard or a
  // filter change, where the track has not been scrolled by the user.
  useEffect(() => {
    if (!activeId) return;
    const track = trackRef.current;
    const chip = track?.querySelector<HTMLElement>(`[data-slug="${activeId}"]`);
    chip?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeId]);

  if (!active) return null;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-14">
      {/* The list */}
      <div>
        <div
          role="group"
          aria-label="Filter templates by category"
          className="flex flex-wrap gap-2"
        >
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              aria-pressed={value === category}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] font-medium capitalize transition-colors",
                value === category
                  ? "border-transparent bg-fg text-bg"
                  : "border-border bg-surface text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <div
          ref={trackRef}
          role="listbox"
          aria-label="Card templates"
          aria-orientation="horizontal"
          className="mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 [scrollbar-width:none]"
          onKeyDown={(event) => {
            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
            event.preventDefault();
            const index = visible.findIndex((theme) => theme.slug === activeId);
            const next = visible[index + (event.key === "ArrowRight" ? 1 : -1)];
            if (next) setActiveSlug(next.slug);
          }}
        >
          {visible.map((theme) => {
            const selected = theme.slug === active.slug;
            return (
              <button
                key={theme.slug}
                data-slug={theme.slug}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => setActiveSlug(theme.slug)}
                className={cn(
                  "group relative w-44 shrink-0 snap-start rounded-2xl border p-3.5 text-left transition-[border-color,box-shadow,transform]",
                  selected
                    ? "border-fg shadow-lg"
                    : "border-border hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
                )}
              >
                {/* A palette-derived swatch trio, so each chip reads as a colour
                    system rather than a single accent. */}
                <span className="flex gap-1.5" aria-hidden>
                  <span
                    className="size-5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: theme.config.palette.accent }}
                  />
                  <span
                    className="size-5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: theme.config.palette.surface }}
                  />
                  <span
                    className="size-5 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: theme.config.palette.bg }}
                  />
                </span>

                <span className="mt-3 flex items-center gap-1.5">
                  <span className="text-[15px] font-semibold text-fg">{theme.name}</span>
                  {theme.isPremium ? (
                    <Crown className="size-3.5 text-warning" aria-label="Premium" />
                  ) : null}
                </span>

                <span className="mt-0.5 block text-[12px] capitalize text-muted">
                  {theme.config.layout} · {theme.config.hero}
                </span>
              </button>
            );
          })}
        </div>

        {/* The selected design's description and the two ways to get it. */}
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-fg">{active.name}</h2>
            {active.isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
                <Crown className="size-3" aria-hidden />
                Pro
              </span>
            ) : (
              <span className="rounded-md bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                Free
              </span>
            )}
          </div>

          <p className="mt-2 text-pretty leading-relaxed text-muted">
            {active.description}
          </p>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-3">
            <Spec label="Layout" value={active.config.layout} />
            <Spec label="Sections" value={active.config.sectionStyle} />
            <Spec label="Name" value={active.config.nameStyle} />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/signup?theme=${active.slug}`}>
                Use this design
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/templates/${active.slug}`}>
                {active.isPremium ? (
                  <Lock className="size-4" aria-hidden />
                ) : null}
                See the full card
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* The live preview */}
      <div className="lg:sticky lg:top-24">
        <div className="relative mx-auto w-full max-w-[320px]">
          <div
            className="absolute -inset-8 -z-10 rounded-[3rem] blur-3xl"
            style={{ backgroundColor: active.config.palette.accent, opacity: 0.18 }}
            aria-hidden
          />

          <div className="relative overflow-hidden rounded-[2rem] border-4 border-fg/85 bg-fg/85 shadow-2xl">
            <div className="flex items-center justify-between bg-bg px-5 pt-2.5 pb-1">
              <span className="text-[11px] font-semibold tabular opacity-70">9:41</span>
              <span
                className="absolute top-2 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-fg/85"
                aria-hidden
              />
              <span className="flex items-center gap-1 text-fg opacity-70" aria-hidden>
                <span className="h-2 w-3.5 rounded-sm bg-current" />
                <span className="size-2 rounded-full bg-current" />
              </span>
            </div>

            <div className="h-[540px] overflow-y-auto overscroll-contain bg-bg [scrollbar-width:none]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.slug}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TemplatePreview theme={active} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[13px] text-muted">
          Live preview — this is the real card renderer.
        </p>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-subtle uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-fg">{value}</dd>
    </div>
  );
}

/**
 * One design rendered against the demo fixture.
 *
 * Every section is populated so switching designs shows the same content in a
 * different arrangement — that is the only way to compare structures honestly.
 */
function TemplatePreview({ theme }: { theme: ThemeShowcase }) {
  return <CardView card={demoCardWithTheme(theme.config)} preview />;
}