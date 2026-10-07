"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  BarChart3, Check, Copy, Download, Edit3, Eye, EyeOff,
  Inbox, Loader2, MoreHorizontal, Plus, Search, Share2, Trash2, X,
} from "lucide-react";

import { QrImage } from "@/components/card/qr";
import { Modal, ConfirmDialog } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { deleteCardAction, duplicateCardAction, setCardPublishedAction } from "@/lib/cards/actions";
import { publicConfig } from "@/lib/public-config";
import { timeAgo } from "@/lib/utils";
import type { CardRow } from "@/lib/cards/card-row";

type SortKey = "updated" | "created" | "name_asc" | "name_desc" | "views";
type FilterKey = "all" | "published" | "draft";

function ShareModal({ card, open, onClose }: { card: CardRow; open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [qrPng, setQrPng] = useState<string | null>(null);
  const url = `${publicConfig.appUrl}/card/${card.username}`;

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Modal open={open} onClose={onClose} title="Share your card"
      description="Anyone with this link can open your card." size="sm"
      footer={
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <p style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--dv-gray)" }}>
            {url}
          </p>
          <button type="button" onClick={async () => { await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); }}
            className="dv-btn dv-btn-primary dv-btn-sm" style={{ flexShrink: 0 }}>
            {copied ? <><Check style={{ width: "0.875rem", height: "0.875rem" }} />Copied</> : <><Copy style={{ width: "0.875rem", height: "0.875rem" }} />Copy link</>}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${card.full_name} — Digital Visiting Card\n${url}`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem 1rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", textDecoration: "none", color: "var(--dv-black)" }}>
          <span style={{ width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="white" style={{ width: "1.125rem", height: "1.125rem" }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.548 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
            </svg>
          </span>
          <div>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>WhatsApp</p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--dv-gray)" }}>Send with a pre-written message</p>
          </div>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)" }}>
          <div style={{ background: "var(--dv-white)", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid var(--dv-border)", flexShrink: 0 }}>
            <QrImage value={url} size={96} alt={`QR code for ${card.full_name}`} onEncoded={setQrPng} />
          </div>
          <div>
            <p style={{ margin: "0 0 0.375rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--dv-black)" }}>QR Code</p>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.75rem", color: "var(--dv-gray)" }}>Print it anywhere.</p>
            <button type="button" disabled={!qrPng}
              onClick={() => { if (!qrPng) return; const a = document.createElement("a"); a.href = qrPng; a.download = `${card.username}-qr.png`; a.click(); }}
              className="dv-btn dv-btn-outline dv-btn-sm">
              <Download style={{ width: "0.75rem", height: "0.75rem" }} />
              {qrPng ? "Download PNG" : "Preparing…"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CardMenu({ card, onShare, onDelete, onPublish }: {
  card: CardRow; onShare: () => void; onDelete: () => void; onPublish: (pub: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [dupPending, startDup] = useTransition();
  const published = card.status === "published";

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const url = `${publicConfig.appUrl}/card/${card.username}`;

  const items = [
    { label: "Edit card", icon: <Edit3 style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => router.push(`/builder/${card.id}`) },
    { label: "View live", icon: <Eye style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => window.open(`/card/${card.username}`, "_blank") },
    { label: "Share", icon: <Share2 style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => { setOpen(false); onShare(); } },
    { label: "Copy link", icon: <Copy style={{ width: "0.875rem", height: "0.875rem" }} />, action: async () => { await navigator.clipboard.writeText(url).catch(() => {}); toast({ variant: "success", title: "Link copied" }); setOpen(false); } },
    { label: "Analytics", icon: <BarChart3 style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => router.push(`/dashboard/cards/${card.id}/analytics`) },
    { label: "Leads", icon: <Inbox style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => router.push(`/dashboard/cards/${card.id}/leads`) },
    {
      label: "Duplicate",
      icon: dupPending ? <Loader2 style={{ width: "0.875rem", height: "0.875rem" }} className="animate-spin" /> : <Copy style={{ width: "0.875rem", height: "0.875rem" }} />,
      action: () => startDup(async () => {
        const res = await duplicateCardAction(card.id);
        if (res.ok) { toast({ variant: "success", title: "Card duplicated" }); router.push(`/builder/${res.data.newCardId}`); }
        else toast({ variant: "error", title: res.error });
        setOpen(false);
      }),
    },
    { label: published ? "Unpublish" : "Publish", icon: published ? <EyeOff style={{ width: "0.875rem", height: "0.875rem" }} /> : <Eye style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => { setOpen(false); onPublish(!published); } },
    { label: "Delete card", icon: <Trash2 style={{ width: "0.875rem", height: "0.875rem" }} />, action: () => { setOpen(false); onDelete(); }, danger: true },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen(v => !v)} aria-label="More actions" aria-expanded={open}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", borderRadius: "var(--dv-r-sm)", border: "1px solid var(--dv-border)", background: "var(--dv-white)", cursor: "pointer", color: "var(--dv-gray)" }}>
        <MoreHorizontal style={{ width: "1rem", height: "1rem" }} />
      </button>
      {open && (
        <div role="menu" style={{ position: "absolute", top: "calc(100% + 0.375rem)", right: 0, zIndex: 50, minWidth: "11rem", background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", boxShadow: "var(--dv-shadow-lg)", padding: "0.375rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
          {items.map(item => (
            <button key={item.label} type="button" role="menuitem" onClick={item.action}
              style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 0.75rem", borderRadius: "calc(var(--dv-r-sm) - 2px)", border: "none", background: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, color: (item as { danger?: boolean }).danger ? "var(--dv-danger)" : "var(--dv-black)", textAlign: "left", width: "100%" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = (item as { danger?: boolean }).danger ? "rgba(220,38,38,0.06)" : "var(--dv-off-white)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CardPreview({ card }: { card: CardRow }) {
  const accent = card.theme_accent ?? "#C7FF2F";
  const initials = card.full_name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
  return (
    <div style={{ position: "relative", height: "10rem", background: `linear-gradient(135deg, ${accent}22 0%, ${accent}44 100%)`, borderBottom: "1px solid var(--dv-border)", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: accent }} aria-hidden />
      {card.cover_url ? <Image src={card.cover_url} alt="" fill sizes="400px" className="object-cover opacity-20" /> : null}
      <div style={{ position: "relative", width: "3.5rem", height: "3.5rem", borderRadius: "50%", border: "2px solid var(--dv-white)", overflow: "hidden", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
        {card.photo_url
          ? <Image src={card.photo_url} alt={card.full_name} fill sizes="56px" className="object-cover" />
          : <div style={{ width: "100%", height: "100%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: 700, color: "var(--dv-black)" }}>{initials || "?"}</div>
        }
      </div>
      <div style={{ textAlign: "center", padding: "0 0.75rem" }}>
        <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--dv-black)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "14rem" }}>{card.full_name}</p>
        {card.designation ? <p style={{ margin: "0.125rem 0 0", fontSize: "0.6875rem", color: "var(--dv-gray)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "14rem" }}>{card.designation}</p> : null}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.25rem 0.625rem", borderRadius: "999px", background: "rgba(22,163,74,0.1)", color: "var(--dv-success)" }}>
      <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "var(--dv-success)", display: "inline-block" }} aria-hidden />Live
    </span>
  );
  if (status === "suspended") return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.25rem 0.625rem", borderRadius: "999px", background: "rgba(220,38,38,0.1)", color: "var(--dv-danger)" }}>Suspended</span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0.25rem 0.625rem", borderRadius: "999px", background: "var(--dv-off-white)", color: "var(--dv-gray)", border: "1px solid var(--dv-border)" }}>Draft</span>
  );
}

function CardItem({ card, onRefresh }: { card: CardRow; onRefresh: () => void }) {
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [publishPending, startPublish] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const { toast } = useToast();
  const published = card.status === "published";

  const handlePublish = (pub: boolean) => startPublish(async () => {
    const res = await setCardPublishedAction(card.id, pub);
    if (res.ok) { toast({ variant: "success", title: pub ? "Your card is live." : "Card taken offline." }); onRefresh(); }
    else toast({ variant: "error", title: res.error });
  });

  const handleDelete = () => startDelete(async () => {
    const res = await deleteCardAction(card.id);
    if (res.ok) { toast({ variant: "success", title: "Card deleted." }); onRefresh(); }
    else toast({ variant: "error", title: res.error });
    setDeleteOpen(false);
  });

  return (
    <>
      <article
        style={{ background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-md)", overflow: "hidden", display: "flex", flexDirection: "column", transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s" }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = "var(--dv-shadow-md)"; el.style.transform = "translateY(-2px)"; el.style.borderColor = "rgba(0,0,0,0.15)"; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow = ""; el.style.transform = ""; el.style.borderColor = "var(--dv-border)"; }}
      >
        <CardPreview card={card} />
        <div style={{ padding: "1rem 1rem 0.75rem", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--dv-black)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.full_name}</h3>
              <p style={{ margin: "0.125rem 0 0", fontSize: "0.75rem", color: "var(--dv-gray-light)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/card/{card.username}</p>
            </div>
            <StatusBadge status={card.status} />
          </div>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.875rem", paddingTop: "0.875rem", borderTop: "1px solid var(--dv-border)" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--dv-black)", lineHeight: 1 }}>{card.view_count}</p>
              <p style={{ margin: "0.125rem 0 0", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dv-gray-light)" }}>Views</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--dv-black)", lineHeight: 1 }}>{card.lead_count}</p>
              <p style={{ margin: "0.125rem 0 0", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--dv-gray-light)" }}>Leads</p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--dv-gray-light)" }}>{timeAgo(card.updated_at)}</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1rem", borderTop: "1px solid var(--dv-border)", background: "var(--dv-off-white)" }}>
          <Link href={`/builder/${card.id}`}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "var(--dv-black)", color: "var(--dv-white)", borderRadius: "var(--dv-r-sm)", fontSize: "0.8125rem", fontWeight: 700, textDecoration: "none" }}>
            <Edit3 style={{ width: "0.75rem", height: "0.75rem" }} />Edit
          </Link>
          {published ? (
            <a href={`/card/${card.username}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "transparent", color: "var(--dv-black)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", fontSize: "0.8125rem", fontWeight: 600, textDecoration: "none" }}>
              <Eye style={{ width: "0.75rem", height: "0.75rem" }} />View
            </a>
          ) : (
            <button type="button" disabled={publishPending || card.status === "suspended"} onClick={() => handlePublish(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", background: "var(--dv-lime)", color: "var(--dv-black)", border: "none", borderRadius: "var(--dv-r-sm)", fontSize: "0.8125rem", fontWeight: 700, cursor: "pointer" }}>
              {publishPending ? <Loader2 style={{ width: "0.75rem", height: "0.75rem" }} className="animate-spin" /> : null}
              Publish
            </button>
          )}
          <button type="button" onClick={() => setShareOpen(true)} aria-label="Share"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", borderRadius: "var(--dv-r-sm)", border: "1px solid var(--dv-border)", background: "var(--dv-white)", cursor: "pointer", color: "var(--dv-gray)" }}>
            <Share2 style={{ width: "0.875rem", height: "0.875rem" }} />
          </button>
          <div style={{ marginLeft: "auto" }}>
            <CardMenu card={card} onShare={() => setShareOpen(true)} onDelete={() => setDeleteOpen(true)} onPublish={handlePublish} />
          </div>
        </div>
      </article>
      <ShareModal card={card} open={shareOpen} onClose={() => setShareOpen(false)} />
      <ConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={handleDelete}
        title="Delete this card?" description={`"${card.full_name}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete card" destructive loading={deletePending} />
    </>
  );
}

function EmptyState({ canCreate }: { canCreate: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6rem 2rem" }}>
      <div style={{ width: "7rem", height: "7rem", borderRadius: "var(--dv-r-lg)", background: "var(--dv-lime)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem", boxShadow: "0 8px 32px rgba(199,255,47,0.4)" }} aria-hidden>
        <svg viewBox="0 0 48 48" fill="none" style={{ width: "3rem", height: "3rem" }}>
          <rect x="6" y="8" width="36" height="32" rx="4" stroke="black" strokeWidth="2.5" />
          <circle cx="18" cy="20" r="5" stroke="black" strokeWidth="2.5" />
          <path d="M6 32c3-6 8-9 12-9s9 3 12 9" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 18h6M32 24h4" stroke="black" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <h2 style={{ margin: 0, fontSize: "clamp(1.5rem, 4vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.04em", textTransform: "uppercase", color: "var(--dv-black)", lineHeight: 1 }}>
        Your digital identity<br />starts here.
      </h2>
      <p style={{ margin: "1rem 0 0", maxWidth: "36ch", fontSize: "1rem", color: "var(--dv-gray)", lineHeight: 1.6 }}>
        Create your first Digital Visiting Card and share it anywhere.
      </p>
      {canCreate ? (
        <Link href="/onboarding" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "2rem", background: "var(--dv-black)", color: "var(--dv-white)", padding: "1rem 2rem", borderRadius: "var(--dv-r-sm)", fontWeight: 700, fontSize: "1rem", textDecoration: "none" }}>
          <Plus style={{ width: "1rem", height: "1rem" }} />Create your first card
        </Link>
      ) : null}
    </div>
  );
}

export function MyCardsGrid({ cards: initialCards, canCreate }: { cards: CardRow[]; canCreate: boolean }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [cards] = useState(initialCards);

  const refresh = () => router.refresh();

  const filtered = useMemo(() => {
    let r = [...cards];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(c => c.full_name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q) || (c.designation ?? "").toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q));
    }
    if (filter === "published") r = r.filter(c => c.status === "published");
    else if (filter === "draft") r = r.filter(c => c.status === "draft");
    r.sort((a, b) => {
      if (sort === "updated") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sort === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "name_asc") return a.full_name.localeCompare(b.full_name);
      if (sort === "name_desc") return b.full_name.localeCompare(a.full_name);
      if (sort === "views") return b.view_count - a.view_count;
      return 0;
    });
    return r;
  }, [cards, search, filter, sort]);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" }, { key: "published", label: "Published" }, { key: "draft", label: "Draft" },
  ];
  const SORTS: { key: SortKey; label: string }[] = [
    { key: "updated", label: "Recently updated" }, { key: "created", label: "Recently created" },
    { key: "name_asc", label: "Name A–Z" }, { key: "name_desc", label: "Name Z–A" }, { key: "views", label: "Most viewed" },
  ];

  if (cards.length === 0) return <EmptyState canCreate={canCreate} />;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
        <div style={{ position: "relative", flex: "1 1 14rem", minWidth: "12rem" }}>
          <Search style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", width: "0.875rem", height: "0.875rem", color: "var(--dv-gray-light)", pointerEvents: "none" }} aria-hidden />
          <input type="search" placeholder="Search cards…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", height: "2.5rem", paddingLeft: "2.25rem", paddingRight: search ? "2.25rem" : "0.875rem", background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", fontSize: "0.875rem", color: "var(--dv-black)", outline: "none" }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--dv-black)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--dv-border)")} />
          {search ? (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
              style={{ position: "absolute", right: "0.625rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--dv-gray-light)", padding: "0.25rem", display: "flex" }}>
              <X style={{ width: "0.875rem", height: "0.875rem" }} />
            </button>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: "0.375rem" }}>
          {FILTERS.map(f => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              style={{ padding: "0.375rem 0.875rem", borderRadius: "999px", border: "1px solid", borderColor: filter === f.key ? "var(--dv-black)" : "var(--dv-border)", background: filter === f.key ? "var(--dv-black)" : "var(--dv-white)", color: filter === f.key ? "var(--dv-white)" : "var(--dv-gray)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort cards"
          style={{ height: "2.5rem", padding: "0 2rem 0 0.875rem", background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", fontSize: "0.8125rem", color: "var(--dv-black)", cursor: "pointer", outline: "none", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.625rem center" }}>
          {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {(search || filter !== "all") ? (
        <p style={{ marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--dv-gray)" }}>{filtered.length} {filtered.length === 1 ? "card" : "cards"} found</p>
      ) : null}

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", border: "1px dashed var(--dv-border)", borderRadius: "var(--dv-r-lg)" }}>
          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--dv-black)" }}>No cards match</p>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--dv-gray)" }}>Try a different search or filter.</p>
          <button type="button" onClick={() => { setSearch(""); setFilter("all"); }}
            style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", background: "var(--dv-off-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "var(--dv-black)" }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(17rem, 1fr))", gap: "1.25rem" }}>
          {filtered.map(card => <CardItem key={card.id} card={card} onRefresh={refresh} />)}
          {canCreate ? (
            <Link href="/onboarding"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", minHeight: "18rem", border: "2px dashed var(--dv-border)", borderRadius: "var(--dv-r-md)", textDecoration: "none", color: "var(--dv-gray)", transition: "border-color 0.15s, color 0.15s, background 0.15s" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--dv-black)"; el.style.color = "var(--dv-black)"; el.style.background = "var(--dv-off-white)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--dv-border)"; el.style.color = "var(--dv-gray)"; el.style.background = "transparent"; }}>
              <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", border: "2px dashed currentColor", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden>
                <Plus style={{ width: "1.25rem", height: "1.25rem" }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.02em" }}>Create new card</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>Takes about 2 minutes</p>
              </div>
            </Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
