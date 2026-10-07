"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeCheck,
  CircleAlert,
  Download,
  Eye,
  Globe,
  Loader2,
  Power,
  Rocket,
  ShieldAlert,
} from "lucide-react";

import { QrImage } from "@/components/card/qr";
import { Panel, ShareBar, useActionRunner, useCardUrl } from "@/components/builder/action-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { setCardPublishedAction, setCardThemeAction } from "@/lib/cards/actions";
import { resolveTheme } from "@/lib/cards/theme";
import type { EditorState } from "@/lib/cards/editor-types";
import type { PreviewDraft } from "@/lib/cards/editor-preview";
import { publicConfig } from "@/lib/public-config";
import { cn } from "@/lib/utils";

/* ── Template picker ───────────────────────────────────────────────────────── */

const TEMPLATE_LAYOUTS: {
  id: string;
  label: string;
  desc: string;
  thumb: (ac: string) => React.ReactNode;
}[] = [
  {
    id: "centered",
    label: "Classic",
    desc: "Avatar centred, name below",
    thumb: (ac) => (
      <svg viewBox="0 0 72 52" fill="none">
        <rect width="72" height="52" rx="4" fill="#f4f4f5" />
        <circle cx="36" cy="14" r="7" fill={ac} />
        <rect x="22" y="24" width="28" height="3" rx="1.5" fill={ac} />
        <rect x="26" y="29" width="20" height="2" rx="1" fill="#a1a1aa" />
        <rect x="10" y="35" width="52" height="1.5" rx="0.75" fill="#e4e4e7" />
        <rect x="14" y="39" width="44" height="2" rx="1" fill="#d4d4d8" />
        <rect x="18" y="43" width="36" height="2" rx="1" fill="#d4d4d8" />
      </svg>
    ),
  },
  {
    id: "banner",
    label: "Banner",
    desc: "Cover photo with avatar overlap",
    thumb: (ac) => (
      <svg viewBox="0 0 72 52" fill="none">
        <rect width="72" height="52" rx="4" fill="#f4f4f5" />
        <rect width="72" height="18" rx="4" fill={ac} />
        <rect y="14" width="72" height="4" fill={ac} />
        <circle cx="36" cy="18" r="7" fill="#fff" stroke={ac} strokeWidth="1.5" />
        <rect x="20" y="28" width="32" height="3" rx="1.5" fill={ac} />
        <rect x="24" y="33" width="24" height="2" rx="1" fill="#a1a1aa" />
        <rect x="12" y="39" width="48" height="2" rx="1" fill="#d4d4d8" />
        <rect x="16" y="43" width="40" height="2" rx="1" fill="#d4d4d8" />
      </svg>
    ),
  },
  {
    id: "split",
    label: "Split",
    desc: "Photo left, info right",
    thumb: (ac) => (
      <svg viewBox="0 0 72 52" fill="none">
        <rect width="72" height="52" rx="4" fill="#f4f4f5" />
        <circle cx="18" cy="18" r="10" fill={ac} />
        <rect x="34" y="11" width="30" height="3" rx="1.5" fill={ac} />
        <rect x="34" y="16" width="22" height="2" rx="1" fill="#a1a1aa" />
        <rect x="34" y="20" width="26" height="2" rx="1" fill="#a1a1aa" />
        <rect x="8" y="34" width="56" height="1.5" rx="0.75" fill="#e4e4e7" />
        <rect x="8" y="38" width="56" height="2" rx="1" fill="#d4d4d8" />
        <rect x="8" y="42" width="40" height="2" rx="1" fill="#d4d4d8" />
      </svg>
    ),
  },
  {
    id: "poster",
    label: "Poster",
    desc: "Big name as the hero",
    thumb: (ac) => (
      <svg viewBox="0 0 72 52" fill="none">
        <rect width="72" height="52" rx="4" fill="#f4f4f5" />
        <rect x="8" y="8" width="56" height="10" rx="2" fill={ac} />
        <rect x="14" y="20" width="44" height="3" rx="1.5" fill="#a1a1aa" />
        <circle cx="36" cy="34" r="7" fill={ac} opacity="0.25" />
        <circle cx="36" cy="34" r="4" fill={ac} />
        <rect x="18" y="44" width="36" height="2" rx="1" fill="#d4d4d8" />
      </svg>
    ),
  },
  {
    id: "showcase",
    label: "Showcase",
    desc: "Full-bleed photo hero",
    thumb: (ac) => (
      <svg viewBox="0 0 72 52" fill="none">
        <rect width="72" height="52" rx="4" fill={ac} />
        <rect y="28" width="72" height="24" rx="0" fill="#f4f4f5" />
        <rect y="26" width="72" height="4" rx="2" fill="#f4f4f5" />
        <circle cx="36" cy="28" r="7" fill="#fff" stroke={ac} strokeWidth="1.5" />
        <rect x="20" y="38" width="32" height="3" rx="1.5" fill={ac} />
        <rect x="24" y="43" width="24" height="2" rx="1" fill="#a1a1aa" />
      </svg>
    ),
  },
  {
    id: "mosaic",
    label: "Mosaic",
    desc: "Bento-grid sections",
    thumb: (ac) => (
      <svg viewBox="0 0 72 52" fill="none">
        <rect width="72" height="52" rx="4" fill="#f4f4f5" />
        <circle cx="12" cy="12" r="6" fill={ac} />
        <rect x="22" y="8" width="26" height="3" rx="1.5" fill={ac} />
        <rect x="22" y="13" width="18" height="2" rx="1" fill="#a1a1aa" />
        <rect x="6" y="24" width="28" height="20" rx="3" fill={ac} opacity="0.15" stroke="#e4e4e7" strokeWidth="1" />
        <rect x="38" y="24" width="28" height="9" rx="3" fill={ac} opacity="0.15" stroke="#e4e4e7" strokeWidth="1" />
        <rect x="38" y="35" width="28" height="9" rx="3" fill={ac} opacity="0.15" stroke="#e4e4e7" strokeWidth="1" />
      </svg>
    ),
  },
];

function TemplatePicker({
  state,
  setDraft,
}: {
  state: EditorState;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}) {
  const initialSlug = state.themes.find((t) => t.id === state.card.themeId)?.slug ?? "";
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const selected = pendingSlug ?? savedSlug;
  const [failure, setFailure] = useState<string | null>(null);

  const currentAccent = state.theme.palette.accent;

  async function choose(slug: string) {
    if (pendingSlug) return;
    if (slug === savedSlug) return;
    const themeRow = state.themes.find((t) => t.slug === slug);
    if (!themeRow) return;
    const config = resolveTheme(themeRow.config, null);
    setFailure(null);
    setPendingSlug(slug);
    setDraft((c) => ({ ...c, theme: config }));
    const result = await setCardThemeAction(state.card.id, slug);
    setPendingSlug(null);
    if (result.ok) {
      setSavedSlug(slug);
      setDraft((c) => ({ ...c, theme: undefined }));
    } else {
      setFailure(result.error);
      setDraft((c) => ({ ...c, theme: undefined }));
    }
  }

  return (
    <Panel title="Layout templates" description="Pick a layout — the live preview updates instantly.">
      <div className="grid grid-cols-3 gap-2.5">
        {TEMPLATE_LAYOUTS.map((tpl) => {
          const themeRow = state.themes.find((t) => t.slug === tpl.id || t.config?.layout === tpl.id);
          const isSelected = themeRow ? themeRow.slug === selected : false;
          const isPending = themeRow ? pendingSlug === themeRow.slug : false;

          return (
            <button
              key={tpl.id}
              type="button"
              disabled={!themeRow || pendingSlug !== null}
              onClick={() => themeRow && choose(themeRow.slug)}
              className={cn(
                "flex flex-col gap-1.5 rounded-xl border p-2 text-left transition-all",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-fg bg-surface-2 shadow-sm ring-1 ring-fg/10"
                  : "border-border hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
              )}
            >
              <span className="block overflow-hidden rounded-lg border border-border">
                {tpl.thumb(currentAccent)}
              </span>
              <span className="flex items-center justify-between gap-1 px-0.5">
                <span className="text-[12px] font-semibold text-fg">{tpl.label}</span>
                {isPending && <Loader2 className="size-3 animate-spin text-muted" aria-hidden />}
              </span>
              <span className="px-0.5 text-[11px] leading-tight text-muted">{tpl.desc}</span>
            </button>
          );
        })}
      </div>
      {failure ? (
        <p role="alert" className="mt-3 text-[13px] text-danger">{failure}</p>
      ) : null}
    </Panel>
  );
}

/**
 * Publishing, and everything that follows from it.
 *
 * `setCardPublishedAction` is the single switch that puts the link live or takes
 * it down — the public route filters on `status`, so there is no cache to
 * invalidate and the change is immediate in both directions.
 *
 * The readiness list below is derived from the saved card, not a checklist the
 * user ticks off: each item is either satisfied by the current data or it names
 * the exact thing that is missing. Publishing is never blocked by it — a card
 * with only a name is still a valid card — but it makes an empty card obvious
 * before it is shared with someone.
 */
export function BuilderPublishPanel({
  state,
  onGoToDetails,
  setDraft,
}: {
  state: EditorState;
  onGoToDetails: () => void;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}) {
  const { run, pending } = useActionRunner();
  const busy = pending !== null;
  const url = useCardUrl(state.card.username);
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  const [qrPng, setQrPng] = useState<string | null>(null);

  const { card } = state;
  const published = card.status === "published";
  const suspended = card.status === "suspended";

  const checks = [
    { label: "Name", done: Boolean(card.fullName.trim()) },
    { label: "A way to be reached", done: Boolean(card.phone || card.email || card.whatsapp) },
    { label: "Public link", done: Boolean(card.username) },
  ];
  const missing = checks.filter((check) => !check.done);

  async function setStatus(next: boolean) {
    setConfirmingUnpublish(false);
    await run("publish", () => setCardPublishedAction(card.id, next), {
      success: next ? "Your card is live." : "Your card is back to draft.",
    });
  }

  if (suspended) {
    return (
      <Panel
        title="This card is suspended"
        description="It is not visible to visitors and cannot be published from here."
      >
        <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3.5">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p className="text-[13px] leading-relaxed text-muted">
            Suspension usually follows a payment or policy issue. Email{" "}
<a href={`mailto:${publicConfig.supportEmail}`} className="underline underline-offset-2">
                {publicConfig.supportEmail}
            </a>{" "}
            with the card link and we will take a look.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <TemplatePicker state={state} setDraft={setDraft} />

      <Panel
        title={published ? "Your card is live" : "Publish your card"}
        description={
          published
            ? "Anyone with the link can view it. Taking it down hides it again immediately."
            : "Publishing makes your card readable by anyone with the link. Nothing is visible until you do."
        }
        action={
          published ? (
            <Badge tone="success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Live
            </Badge>
          ) : (
            <Badge tone="neutral">Draft</Badge>
          )
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant={published ? "outline" : "primary"}
            disabled={busy}
            onClick={() => {
              if (published && !confirmingUnpublish) {
                setConfirmingUnpublish(true);
                return;
              }
              void setStatus(!published);
            }}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : published ? (
              <Power className="size-4" aria-hidden />
            ) : (
              <Rocket className="size-4" aria-hidden />
            )}
            {pending ? "Working..." : published ? "Take offline" : "Publish card"}
          </Button>

          {published ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/card/${card.username}`} target="_blank">
                <Eye className="size-3.5" aria-hidden />
                View as a visitor
              </Link>
            </Button>
          ) : null}
        </div>

        {/* Destructive, so it asks first — but only once. */}
        {confirmingUnpublish ? (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3"
          >
            <p className="text-[13px] leading-relaxed text-muted">
              The link will stop working for visitors straight away.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="danger"
                disabled={busy}
                onClick={() => void setStatus(false)}
              >
                Yes, take it offline
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingUnpublish(false)}
              >
                Keep it live
              </Button>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel
        title="Before you share"
        description="Not required — but a card with these filled gets a response."
      >
        <ul className="space-y-2.5">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2.5 text-[13px]">
              {check.done ? (
                <BadgeCheck className="size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <CircleAlert className="size-4 shrink-0 text-subtle" aria-hidden />
              )}
              <span className={check.done ? "text-fg" : "text-muted"}>
                {check.label}
                {!check.done ? <span className="text-subtle"> — not set yet</span> : null}
              </span>
            </li>
          ))}
        </ul>

        {missing.length > 0 ? (
          <p className="mt-4 border-t border-border pt-3 text-[12.5px] leading-relaxed text-subtle">
            You can publish now and fill these in later.
            <button
              type="button"
              onClick={onGoToDetails}
              className="ml-1 font-medium text-muted underline underline-offset-2 transition-colors hover:text-fg"
            >
              Open the Details tab
            </button>{" "}
            to add them.
          </p>
        ) : null}
      </Panel>

      <Panel
        title="Share it"
        description="One link works everywhere: in a signature, a QR code, or a message."
      >
        <ShareBar username={card.username} />

        {published ? (
          <div className="mt-5 flex flex-wrap items-center gap-5">
            <div
              className="rounded-xl border border-border bg-surface-2 p-3"
              // The QR always renders on white so it stays scannable, whatever the
              // card's palette is.
            >
              <QrImage
                value={url}
                size={128}
                alt={`QR code linking to ${url}`}
                onEncoded={setQrPng}
                fallback={
                  <p className="text-[11px] leading-snug text-muted">
                    QR unavailable.
                    <br />
                    Copy the link instead.
                  </p>
                }
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg">
                <Globe className="size-3.5 text-muted" aria-hidden />
                Print it anywhere
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
                Save the code as an image and put it on a business card, a menu, or a
                shopfront. Anyone who scans it opens the card you published.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2"
                disabled={!qrPng}
                onClick={() => {
                  if (!qrPng) return;
                  const link = document.createElement("a");
                  link.href = qrPng;
                  link.download = `${card.username}-qr.png`;
                  link.click();
                }}
              >
                <Download className="size-3.5" aria-hidden />
                {qrPng ? "Download PNG" : "Preparing code..."}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-[12.5px] leading-relaxed text-subtle">
            The QR code appears once the card is live — a code pointing at a page
            visitors cannot open yet would be worse than none.
          </p>
        )}
      </Panel>
    </div>
  );
}