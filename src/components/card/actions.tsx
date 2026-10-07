"use client";

import { Download, Phone, Share2, Star } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { contactFilename, downloadVCard } from "@/lib/cards/vcard";
import type { CardData } from "@/lib/cards/types";

/**
 * Fires a single page-view event per session per card.
 *
 * Deliberately sends no personal data: only a coarse device category and the
 * referrer, matching the constraints on `analytics_events` (section 25). The
 * request is fire-and-forget with `keepalive` so it survives the page being
 * closed on a slow connection, and a failure is swallowed — tracking must never
 * degrade the card itself.
 */
export function ViewTracker({ cardId, username }: { cardId: string; username: string }) {
  useEffect(() => {
    const key = `dv:viewed:${username}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Private browsing can throw; fall through and count the view.
    }

    const payload = JSON.stringify({
      cardId,
      eventType: "card_view",
      referrer: document.referrer || null,
      path: location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track",
        new Blob([payload], { type: "application/json" }),
      );
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => undefined);
    }
  }, [cardId, username]);

  return null;
}

/**
 * Reports a discrete interaction (WhatsApp tap, call, save-contact, share).
 *
 * Called on click *before* navigation so the request is issued even though the
 * browser then leaves the page.
 */
export function trackAction(cardId: string, eventType: string): void {
  const payload = JSON.stringify({ cardId, eventType });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    }
  } catch {
    // Non-fatal.
  }
}

/**
 * An `<a>` that reports the tap before the browser navigates.
 *
 * This exists because `card-view.tsx` is a Server Component, and a Server
 * Component cannot own an event handler — the function cannot cross the
 * serialization boundary. Routing every tracked link through one client wrapper
 * keeps the whole page a Server Component while still recording the interaction.
 */
export function TrackedLink({
  cardId,
  eventType,
  href,
  external,
  className,
  ariaLabel,
  children,
}: {
  cardId: string;
  eventType: string;
  href: string;
  external?: boolean;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={() => trackAction(cardId, eventType)}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}

/** Native share sheet with a clipboard fallback (section 53 / 68). */
export function ShareButton({
  cardId,
  card,
  label = "Share",
  message,
  className,
  variant = "soft",
  size = "md",
}: {
  cardId: string;
  card: Pick<CardData, "fullName" | "designation" | "username">;
  label?: string;
  message?: string;
  className?: string;
  variant?: "solid" | "soft" | "outline";
  size?: "sm" | "md";
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const onShare = useCallback(async () => {
    const url = `${location.origin}/card/${card.username}`;
    const text =
      message ??
      `${card.fullName}${card.designation ? ` — ${card.designation}` : ""}\n${url}`;

    trackAction(cardId, "share");

    // Prefer the OS sheet: it is what users expect and it supports messaging apps.
    if (navigator.share) {
      try {
        await navigator.share({ title: card.fullName, text, url });
        return;
      } catch (error) {
        // A user-cancelled share is not a failure worth reporting.
        if ((error as Error)?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast({
        title: "Link copied",
        description: "Paste it anywhere to share this card.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Couldn't copy the link",
        description: "Please copy the address from your browser instead.",
        variant: "error",
      });
    }
  }, [card, cardId, message, toast]);

  return (
    <button
      type="button"
      onClick={() => {
        setBusy(true);
        void onShare().finally(() => setBusy(false));
      }}
      disabled={busy}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-[filter,opacity] disabled:opacity-60",
        size === "sm" ? "h-9 rounded-lg px-3 text-[13px]" : "h-11 rounded-xl px-4 text-sm",
        {
          solid: "bg-[var(--c-accent)] text-[var(--c-accent-fg)] hover:brightness-110",
          soft: "bg-[var(--c-accent-soft)] text-[var(--c-accent)] hover:brightness-95",
          outline:
            "border border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-accent-soft)]",
        }[variant],
        className,
      )}
    >
      <Share2 className={cn(size === "sm" ? "size-4" : "size-[18px]")} aria-hidden />
      {label}
    </button>
  );
}

/** Downloads a real .vcf file (section 12). */
export function SaveContactButton({
  card,
  className,
  variant = "soft",
  size = "md",
}: {
  card: CardData;
  className?: string;
  variant?: "solid" | "soft" | "outline";
  size?: "sm" | "md";
}) {
  const { toast } = useToast();

  return (
    <button
      type="button"
      onClick={() => {
        try {
          downloadVCard(card);
          trackAction(card.id, "contact_save");
          toast({
            title: "Contact file downloaded",
            description: `Open ${contactFilename(card)} to add ${card.fullName} to your phone.`,
            variant: "success",
          });
        } catch {
          toast({
            title: "Couldn't save the contact",
            description: "Please try again, or ask for the number directly.",
            variant: "error",
          });
        }
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-[filter] active:scale-[0.98]",
        size === "sm" ? "h-9 rounded-lg px-3 text-[13px]" : "h-11 rounded-xl px-4 text-sm",
        {
          solid: "bg-[var(--c-accent)] text-[var(--c-accent-fg)] hover:brightness-110",
          soft: "bg-[var(--c-accent-soft)] text-[var(--c-accent)] hover:brightness-95",
          outline:
            "border border-[var(--c-accent)] text-[var(--c-accent)] hover:bg-[var(--c-accent-soft)]",
        }[variant],
        className,
      )}
    >
      <Download className={cn(size === "sm" ? "size-4" : "size-[18px]")} aria-hidden />
      Save Contact
    </button>
  );
}

/** Five-star display. `aria-label` carries the rating for screen readers. */
export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "size-4",
            star <= value
              ? "fill-[var(--c-accent)] text-[var(--c-accent)]"
              : "text-[var(--c-border)]",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

/**
 * Sticky bottom action bar (section 53).
 *
 * Sits above the safe-area inset and leaves room for the footer so it never
 * covers content. Hides itself while the in-page enquiry sheet is open.
 */
export function StickyActions({
  card,
  hidden,
}: {
  card: CardData;
  hidden?: boolean;
}) {
  if (!card.whatsapp && !card.phone) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-lg transition-transform duration-300",
        "border-[var(--c-border)] bg-[var(--c-surface)]/92",
        hidden ? "translate-y-full" : "translate-y-0",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-lg items-center gap-2 px-3 py-2.5">
        {card.whatsapp ? (
          <a
            href={`https://wa.me/91${card.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAction(card.id, "whatsapp_click")}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25d366] text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            <WhatsappIcon className="size-[18px]" />
            WhatsApp
          </a>
        ) : null}

        {card.phone ? (
          <a
            href={`tel:+91${card.phone}`}
            onClick={() => trackAction(card.id, "call_click")}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--c-border)] px-4 text-sm font-medium text-[var(--c-fg)] transition-transform active:scale-[0.98]"
            aria-label={`Call ${card.fullName}`}
          >
            <Phone className="size-[18px] text-[var(--c-accent)]" aria-hidden />
          </a>
        ) : null}

        <SaveContactButton
          card={card}
          variant="outline"
          size="md"
          className="size-12 px-0"
        />

        <ShareButton
          cardId={card.id}
          card={card}
          label=""
          size="md"
          variant="outline"
          className="size-12 px-0"
        />
      </div>
    </div>
  );
}

/**
 * WhatsApp share button — opens wa.me with a pre-filled message containing
 * the card URL. Works on mobile (opens the app) and desktop (opens web.whatsapp.com).
 */
export function WhatsAppShareButton({
  card,
  className,
  size = "sm",
}: {
  card: Pick<CardData, "id" | "fullName" | "designation" | "username">;
  className?: string;
  size?: "sm" | "md";
}) {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const url = origin ? `${origin}/card/${card.username}` : `/card/${card.username}`;
  const text = encodeURIComponent(
    `Hi, here is my digital visiting card:\n${url}`,
  );
  return (
    <a
      href={`https://wa.me/?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackAction(card.id, "share")}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 font-medium transition-[filter] active:scale-[0.98]",
        size === "sm" ? "h-9 rounded-lg px-3 text-[13px]" : "h-11 rounded-xl px-4 text-sm",
        "bg-[#25d366] text-white hover:brightness-110",
        className,
      )}
    >
      <WhatsappIcon className={size === "sm" ? "size-4" : "size-[18px]"} />
      Share on WhatsApp
    </a>
  );
}

/** Inline WhatsApp glyph — lucide has no brand icons (section 2: clean icons). */
export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}