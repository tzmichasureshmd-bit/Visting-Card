"use client";

import { Check, Copy, Link2, Mail, Share2 } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { useCardUrl } from "@/components/builder/action-kit";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

/**
 * Share a published card.
 *
 * Sharing is the single reason a Digital Visiting Card exists, so it gets a real
 * dialog rather than a "copy this string" line — and every option here does
 * something that genuinely works on the visitor's device:
 *
 * - **Share** hands off to the OS share sheet (`navigator.share`), which is how
 *   sharing actually happens on a phone: into WhatsApp, Messages, Mail, or
 *   whatever the person already uses. Present on most mobile browsers and recent
 *   desktop Safari/Chrome, so it is feature-detected rather than assumed.
 * - **WhatsApp** and **Email** are deep links with the message pre-written. They
 *   need no account here and work whether or not the native sheet exists.
 * - **Copy** covers everything else, and confirms rather than leaving the user
 *   guessing whether it worked.
 *
 * The URL is built from `window.location.origin` rather than a configured host,
 * so a preview deploy shares the preview link instead of pointing people at
 * production. There is no server call here: sharing is a client concern, and the
 * public card's own `share` tracking event fires when the recipient opens it.
 */

/** The origin and the share capability both read the browser without owning state. */
function noopSubscribe() {
  return () => {};
}

export function ShareCardDialog({
  username,
  cardName,
  trigger,
}: {
  /** Card handle — the URL is `{origin}/card/{username}`. */
  username: string;
  /** Used in the pre-written message. Falls back to a generic phrase. */
  cardName: string;
  /** Label for the button that opens the dialog. */
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = useCardUrl(username);

  // Capability check, not state: it cannot change while the page is open, and
  // the server snapshot is `false` so the server and client render the same
  // markup — a share button that appears after hydration is a visible jump.
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const subject = `${cardName || "My"} — Digital Visiting Card`;
  const message = `${cardName || "My Digital Visiting Card"}: ${url}`;

  const copy = async () => {
    try {
      // The async clipboard API needs a secure context; `execCommand` is the
      // fallback that still works on plain http and in older mobile browsers.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const field = document.createElement("textarea");
        field.value = url;
        field.setAttribute("readonly", "");
        field.style.position = "fixed";
        field.style.opacity = "0";
        document.body.appendChild(field);
        field.select();
        document.execCommand("copy");
        document.body.removeChild(field);
      }
      setCopied(true);
    } catch {
      toast({ variant: "error", title: "Could not copy the link" });
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: subject, text: message, url });
      setOpen(false);
    } catch (error) {
      // A user dismissing the share sheet throws `AbortError`. That is not a
      // failure, and showing an error for it would be wrong.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast({ variant: "error", title: "Sharing failed — try copying the link" });
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {trigger ?? (
          <>
            <Share2 className="size-3.5" aria-hidden />
            Share
          </>
        )}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title="Share this Digital Visiting Card"
        description="Anyone with this link can open your card."
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate font-mono text-[12px] text-muted">{url}</p>
            <Button type="button" size="sm" onClick={copy}>
              {copied ? (
                <>
                  <Check className="size-3.5" aria-hidden />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" aria-hidden />
                  Copy link
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          {canNativeShare ? (
            <button
              type="button"
              onClick={nativeShare}
              data-autofocus
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-border-strong"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
                <Share2 className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-medium text-fg">Share…</span>
                <span className="block text-[12.5px] text-muted">
                  Send to any app on this device
                </span>
              </span>
            </button>
          ) : null}

          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[15px]">
              <WhatsAppGlyph />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-fg">WhatsApp</span>
              <span className="block text-[12.5px] text-muted">
                Opens a chat with your message written
              </span>
            </span>
          </a>

          <a
            href={`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg">
              <Mail className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-medium text-fg">Email</span>
              <span className="block text-[12.5px] text-muted">
                Opens a new message with your link
              </span>
            </span>
          </a>

          <p className="flex items-start gap-2 pt-2 text-[12px] leading-relaxed text-subtle">
            <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Your card updates automatically. The link stays the same even when your
            details change.
          </p>
        </div>
      </Modal>
    </>
  );
}

/** Inline WhatsApp mark — Lucide has no brand glyphs. */
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-[18px] fill-[#25D366]"
      focusable="false"
    >
      <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.48 1.34 5L2 22l5.16-1.35A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.2a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.06.8.82-2.99-.2-.31a8.16 8.16 0 0 1-1.25-4.37 8.2 8.2 0 0 1 16.4 0 8.2 8.2 0 0 1-8.24 8.19Zm4.5-6.12c-.25-.13-1.46-.72-1.68-.8-.23-.08-.39-.13-.56.12-.16.25-.63.8-.77.96-.14.17-.28.19-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.71-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.09-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.07s.89 2.4 1.02 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}