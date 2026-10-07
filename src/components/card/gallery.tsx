"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import type { GalleryItem } from "@/lib/cards/types";
import { cn } from "@/lib/utils";

/**
 * Gallery grid with a full-screen lightbox.
 *
 * The grid itself is plain server-renderable markup; only the lightbox needs the
 * client, and it is lazily mounted so a card without a gallery ships no extra
 * JavaScript. Arrow keys, Escape and swipe all work, and focus is trapped in
 * the dialog while it is open.
 */
export function GalleryGrid({
  items,
  className,
}: {
  items: GalleryItem[];
  className?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );
  const prev = useCallback(
    () => setIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (index === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") next();
      if (event.key === "ArrowLeft") prev();
    };

    document.addEventListener("keydown", onKey);
    // Lock background scroll while the lightbox is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, close, next, prev]);

  const active = index === null ? null : items[index];

  return (
    <>
      <ul className={cn("grid grid-cols-2 gap-2 sm:grid-cols-3", className)}>
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group relative block w-full overflow-hidden rounded-xl bg-[var(--c-accent-soft)] focus-visible:ring-2 focus-visible:ring-[var(--c-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--c-bg)]"
              aria-label={item.caption ? `View image: ${item.caption}` : "View image"}
            >
              <Image
                src={item.imageUrl}
                alt={item.caption ?? ""}
                width={item.width ?? 800}
                height={item.height ?? 800}
                loading="lazy"
                sizes="(max-width: 640px) 50vw, 240px"
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {item.caption ? (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 text-left text-[12px] font-medium text-white">
                  {item.caption}
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active ? (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 flex flex-col bg-black/95"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-white/70 tabular">
                {(index ?? 0) + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Close image viewer"
                autoFocus
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </button>
              ) : null}

              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
                className="flex max-h-full min-h-0 flex-col items-center"
              >
                <Image
                  src={active.imageUrl}
                  alt={active.caption ?? ""}
                  width={active.width ?? 1600}
                  height={active.height ?? 1600}
                  sizes="100vw"
                  className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
                />
                {active.caption ? (
                  <p className="mt-3 text-center text-sm text-white/80">{active.caption}</p>
                ) : null}
              </motion.div>

              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
