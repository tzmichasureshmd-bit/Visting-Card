"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  BarChart3, CreditCard, Download, ExternalLink, Eye, Gift,
  HelpCircle, Home, LayoutGrid, LayoutTemplate, ListChecks,
  Palette, PenLine, Plus, Rocket, Settings,
  Share2, Smartphone, Sparkles, TrendingUp, User, Wallet,
  MessageCircle, Mail, QrCode, X, Zap,
} from "lucide-react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { SignOutButton } from "@/components/dashboard/sign-out-button";
import { CardView } from "@/components/card/card-view";
import { BuilderPublishPanel } from "@/components/builder/panels/publish-panel";
import { ShareBar } from "@/components/builder/action-kit";
import { BuilderContentPanel } from "@/components/builder/panels/content-panel";
import { BuilderDetailsPanel } from "@/components/builder/panels/details-panel";
import { BuilderSectionsPanel } from "@/components/builder/panels/sections-panel";
import { BuilderStylePanel } from "@/components/builder/panels/style-panel";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { editorPreview, type PreviewDraft } from "@/lib/cards/editor-preview";
import type { EditorState } from "@/lib/cards/editor-types";

const SIDE_NAV = [
  { href: "/dashboard",           label: "Dashboard",  icon: Home },
  { href: "/dashboard/cards",     label: "All Cards",  icon: CreditCard },
  { href: "/templates",           label: "Templates",  icon: LayoutTemplate },
  { href: "/dashboard/analytics", label: "Analytics",  icon: BarChart3 },
  { href: "/dashboard/referrals", label: "Referrals",  icon: Gift },
  { href: "/dashboard/wallet",    label: "Wallet",     icon: Wallet },
  { href: "/dashboard/billing",   label: "Billing",    icon: CreditCard },
  { href: "/dashboard/settings",  label: "Settings",   icon: Settings },
  { href: "/dashboard/help",      label: "Help",       icon: HelpCircle },
] as const;

const TABS = [
  { id: "details",  label: "Details",  icon: User },
  { id: "style",    label: "Design",   icon: Palette },
  { id: "sections", label: "Sections", icon: ListChecks },
  { id: "content",  label: "Content",  icon: LayoutGrid },
  { id: "publish",  label: "Publish",  icon: Rocket },
] as const;

type TabId = (typeof TABS)[number]["id"];

function usePreviewFlash(draft: PreviewDraft) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(draft);
  useEffect(() => {
    if (draft === prev.current) return;
    prev.current = draft;
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 600);
    return () => clearTimeout(t);
  }, [draft]);
  return flash;
}

function ShareModal({ username, onClose }: { username: string; onClose: () => void }) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/card/${username}` : `/card/${username}`;
  const waText = encodeURIComponent(`Check out my Digital Visiting Card: ${url}`);
  const mailBody = encodeURIComponent(`Hi,\n\nHere's my Digital Visiting Card: ${url}`);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} onClick={onClose}>
      <div style={{ background: "var(--dv-white)", borderRadius: "var(--dv-r-lg)", padding: "1.5rem", width: "100%", maxWidth: "400px", boxShadow: "var(--dv-shadow-lg)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Share your card</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}><X style={{ width: "1.125rem", height: "1.125rem" }} /></button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <input readOnly value={url} style={{ flex: 1, padding: "0.625rem 0.75rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", fontSize: "0.8125rem", background: "var(--dv-off-white)", color: "var(--dv-black)" }} onClick={(e) => (e.target as HTMLInputElement).select()} />
          <button type="button" onClick={() => navigator.clipboard.writeText(url)} style={{ padding: "0.625rem 1rem", background: "var(--dv-black)", color: "var(--dv-white)", border: "none", borderRadius: "var(--dv-r-sm)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Copy</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", textDecoration: "none", color: "var(--dv-black)", fontSize: "0.875rem", fontWeight: 600 }}><MessageCircle style={{ width: "1rem", height: "1rem", color: "#25D366" }} />WhatsApp</a>
          <a href={`mailto:?subject=My Digital Visiting Card&body=${mailBody}`} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", textDecoration: "none", color: "var(--dv-black)", fontSize: "0.875rem", fontWeight: 600 }}><Mail style={{ width: "1rem", height: "1rem", color: "#4285F4" }} />Email</a>
          <a href={`/card/${username}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", textDecoration: "none", color: "var(--dv-black)", fontSize: "0.875rem", fontWeight: 600 }}><ExternalLink style={{ width: "1rem", height: "1rem" }} />Open card</a>
          <a href={`/api/qr?username=${username}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", textDecoration: "none", color: "var(--dv-black)", fontSize: "0.875rem", fontWeight: 600 }}><QrCode style={{ width: "1rem", height: "1rem" }} />QR Code</a>
        </div>
        <button type="button" onClick={() => { const w = window.open(`/card/${username}?print=1`, "_blank"); if (w) setTimeout(() => w.print(), 1200); }} style={{ marginTop: "0.75rem", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "0.75rem", background: "var(--dv-off-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "var(--dv-black)" }}>
          <Download style={{ width: "1rem", height: "1rem" }} />Download / Print as PDF
        </button>
      </div>
    </div>
  );
}

/* ── Phone frame preview ─────────────────────────────────────────────────── */
function PhonePreview({ children, flash }: { children: React.ReactNode; flash: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "center", padding: "1rem 0" }}>
      <div style={{ position: "relative", width: "min(260px, 100%)", flex: "1 1 0", maxHeight: "560px", background: "#111", borderRadius: "2.5rem", padding: "3px", boxShadow: "0 0 0 1px #333, 0 24px 64px rgba(0,0,0,0.35)" }}>
        <div style={{ position: "absolute", inset: "-3px", borderRadius: "2.6rem", border: "2px solid var(--dv-lime)", opacity: flash ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: "none", zIndex: 10 }} aria-hidden />
        <div style={{ position: "absolute", inset: "-1.5rem", borderRadius: "3rem", background: "var(--dv-lime)", opacity: flash ? 0.2 : 0.05, filter: "blur(2rem)", zIndex: 0, transition: "opacity 0.3s ease", pointerEvents: "none" }} aria-hidden />
        <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: "2.35rem", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ flexShrink: 0, height: "2rem", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "5rem", height: "0.875rem", background: "#000", borderRadius: "999px" }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>{children}</div>
          <div style={{ flexShrink: 0, height: "1.5rem", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "6rem", height: "0.25rem", background: "#d1d5db", borderRadius: "999px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Horizontal card preview ─────────────────────────────────────────────── */
function CardPreview({ children, flash }: { children: React.ReactNode; flash: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "1rem 0", gap: "1rem" }}>
      {/* Front */}
      <div style={{ position: "relative", width: "100%", maxWidth: "400px", aspectRatio: "1.75 / 1", borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: "1px solid rgba(0,0,0,0.08)", background: "#fff", flexShrink: 0 }}>
        <div style={{ position: "absolute", inset: 0, zIndex: 10, boxShadow: "inset 0 0 0 3px var(--dv-lime)", borderRadius: "0.875rem", opacity: flash ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: "none" }} aria-hidden />
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", transform: "scale(0.52)", transformOrigin: "top left", width: "192%", height: "192%" }}>
          {children}
        </div>
      </div>
      {/* Back */}
      <div style={{ width: "100%", maxWidth: "400px", aspectRatio: "1.75 / 1", borderRadius: "0.875rem", background: "var(--dv-black)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <span style={{ fontSize: "1.75rem", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--dv-lime)", textTransform: "uppercase" }}>DV CARD</span>
      </div>
    </div>
  );
}

/* ── Main builder ─────────────────────────────────────────────────────────── */
export function CardBuilder({
  state,
  user,
  planName,
}: {
  state: EditorState;
  user: { email: string; name: string };
  planName: string;
}) {
  const [tab, setTab] = useState<TabId>("details");
  const [draft, setDraft] = useState<PreviewDraft>({});
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [showShare, setShowShare] = useState(false);
  const [previewMode, setPreviewMode] = useState<"phone" | "card">("phone");

  const preview = useMemo(() => editorPreview(state, draft), [state, draft]);
  const published = state.card.status === "published";
  const suspended = state.card.status === "suspended";
  const flash = usePreviewFlash(draft);

  return (
    <div className="bldr-root">
      {showShare && <ShareModal username={state.card.username} onClose={() => setShowShare(false)} />}

      <div className="bldr-shell">
        {/* Lime sidebar */}
        <aside className="bldr-dash-sidebar">
          <div style={{ padding: "1.25rem 1rem 0.875rem" }}>
            <BrandMark href="/dashboard" />
          </div>
          <nav aria-label="Main navigation" style={{ flex: 1, overflowY: "auto", padding: "0 0.75rem", display: "flex", flexDirection: "column", gap: "0.125rem" }}>
            {SIDE_NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="dv-nav-link">
                <Icon style={{ width: "1rem", height: "1rem", flexShrink: 0 }} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div style={{ padding: "0.75rem", borderTop: "1px solid var(--dv-border)" }}>
            <div style={{ padding: "0.5rem 0.75rem", borderRadius: "var(--dv-r-sm)", background: "var(--dv-off-white)", marginBottom: "0.625rem" }}>
              <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 700, color: "var(--dv-black)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
              <span className="dv-badge dv-badge-lime" style={{ fontSize: "0.5625rem", marginTop: "0.2rem" }}>{planName}</span>
            </div>
            <Link href="/onboarding" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "var(--dv-lime)", color: "var(--dv-black)", padding: "0.625rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 700, borderRadius: "var(--dv-r-sm)", marginBottom: "0.5rem" }}>
              <Plus style={{ width: "0.875rem", height: "0.875rem" }} />New Card
            </Link>
            <SignOutButton />
          </div>
        </aside>

        {/* Builder area */}
        <div className="bldr-area">
          {/* Header */}
          <header className="bldr-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
              <Link href="/dashboard/cards" className="bldr-back">← Cards</Link>
              <div style={{ width: "1px", height: "1.25rem", background: "var(--dv-border)", flexShrink: 0 }} aria-hidden />
              <p className="bldr-card-name">{state.card.fullName}</p>
              {published ? (
                <Badge tone="success"><span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "var(--dv-success)", display: "inline-block" }} aria-hidden />Live</Badge>
              ) : suspended ? <Badge tone="danger">Suspended</Badge> : <Badge tone="neutral">Draft</Badge>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
              <Button asChild variant="primary" size="sm" style={{ background: "var(--dv-lime)", color: "var(--dv-black)", border: "none" }}>
                <Link href="/dashboard/billing"><Zap style={{ width: "0.8125rem", height: "0.8125rem" }} aria-hidden /><span className="bldr-hdr-label">Upgrade</span></Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/dashboard/cards/${state.card.id}/analytics`}><TrendingUp style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden /><span className="bldr-hdr-label">Analytics</span></Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowShare(true)}>
                <Share2 style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden /><span className="bldr-hdr-label">Share</span>
              </Button>
            </div>
          </header>

          {/* Mobile Edit/Preview toggle */}
          <div className="bldr-view-toggle">
            <button type="button" onClick={() => setView("edit")} className={`bldr-view-btn${view === "edit" ? " bldr-view-active" : ""}`}>
              <PenLine style={{ width: "0.8125rem", height: "0.8125rem" }} aria-hidden />Edit
            </button>
            <button type="button" onClick={() => setView("preview")} className={`bldr-view-btn${view === "preview" ? " bldr-view-active" : ""}`}>
              <Eye style={{ width: "0.8125rem", height: "0.8125rem" }} aria-hidden />Preview
            </button>
          </div>

          <div className="bldr-body">
            {/* Editor */}
            <div className={`bldr-editor${view === "preview" ? " bldr-panel-hidden" : ""}`}>
              <nav aria-label="Builder sections" style={{ marginBottom: "1rem" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                  {TABS.map(({ id, label, icon: Icon }) => {
                    const sel = tab === id;
                    return (
                      <li key={id}>
                        <button type="button" onClick={() => setTab(id)} aria-current={sel ? "page" : undefined}
                          style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.4375rem 0.75rem", border: `1.5px solid ${sel ? "var(--dv-black)" : "var(--dv-border)"}`, borderRadius: "var(--dv-r-sm)", background: sel ? "var(--dv-black)" : "var(--dv-white)", color: sel ? "var(--dv-white)" : "var(--dv-gray)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
                          <Icon style={{ width: "0.8125rem", height: "0.8125rem" }} aria-hidden />{label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div style={{ background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-lg)", padding: "1.5rem" }}>
                {tab === "details"  ? <BuilderDetailsPanel  state={state} draft={draft} setDraft={setDraft} /> : null}
                {tab === "style"    ? <BuilderStylePanel    state={state} setDraft={setDraft} /> : null}
                {tab === "sections" ? <BuilderSectionsPanel state={state} draft={draft} setDraft={setDraft} /> : null}
                {tab === "content"  ? <BuilderContentPanel  state={state} draft={draft} setDraft={setDraft} /> : null}
                {tab === "publish"  ? <BuilderPublishPanel  state={state} onGoToDetails={() => setTab("details")} setDraft={setDraft} /> : null}
              </div>
              <div style={{ marginTop: "1.25rem" }}><ShareBar username={state.card.username} /></div>
            </div>

            {/* Preview panel */}
            <div className={`bldr-preview${view === "edit" ? " bldr-panel-hidden" : ""}`}>
              <div className="bldr-preview-inner">
                {/* Preview header with Phone/Card toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.8125rem", fontWeight: 600, color: "var(--dv-black)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Eye style={{ width: "0.8125rem", height: "0.8125rem", color: "var(--dv-gray)" }} aria-hidden />Live Preview
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    {/* Phone / Card toggle */}
                    <div style={{ display: "flex", background: "var(--dv-white)", border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)", overflow: "hidden" }}>
                      <button type="button" onClick={() => setPreviewMode("phone")}
                        style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.625rem", border: "none", cursor: "pointer", fontSize: "0.6875rem", fontWeight: 700, background: previewMode === "phone" ? "var(--dv-black)" : "transparent", color: previewMode === "phone" ? "var(--dv-white)" : "var(--dv-gray)", transition: "all 0.15s" }}>
                        <Smartphone style={{ width: "0.75rem", height: "0.75rem" }} aria-hidden />Phone
                      </button>
                      <button type="button" onClick={() => setPreviewMode("card")}
                        style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.3rem 0.625rem", border: "none", cursor: "pointer", fontSize: "0.6875rem", fontWeight: 700, background: previewMode === "card" ? "var(--dv-black)" : "transparent", color: previewMode === "card" ? "var(--dv-white)" : "var(--dv-gray)", transition: "all 0.15s" }}>
                        <CreditCard style={{ width: "0.75rem", height: "0.75rem" }} aria-hidden />Card
                      </button>
                    </div>
                    {published && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/card/${state.card.username}`} target="_blank">Open <ExternalLink style={{ width: "0.75rem", height: "0.75rem" }} aria-hidden /></Link>
                      </Button>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: 0 }}>
                  {previewMode === "phone"
                    ? <PhonePreview flash={flash}><CardView card={preview} preview /></PhonePreview>
                    : <CardPreview flash={flash}><CardView card={preview} preview /></CardPreview>
                  }
                </div>

                <p style={{ marginTop: "0.5rem", textAlign: "center", fontSize: "0.6875rem", color: "var(--dv-gray-light)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", flexShrink: 0 }}>
                  <Sparkles style={{ width: "0.6875rem", height: "0.6875rem" }} aria-hidden />Updates as you type
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bldr-root { height: 100dvh; overflow: hidden; background: var(--dv-off-white); }
        .bldr-shell { display: flex; height: 100%; }
        .bldr-dash-sidebar {
          width: 15.5rem; flex-shrink: 0;
          background: var(--dv-white); border-right: 1px solid var(--dv-border);
          display: flex; flex-direction: column; height: 100%; overflow-y: auto;
        }
        .bldr-area { flex: 1; min-width: 0; display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .bldr-header {
          flex-shrink: 0; background: var(--dv-white);
          border-bottom: 1px solid var(--dv-border); box-shadow: var(--dv-shadow-sm);
          padding: 0 1.25rem; height: 3.5rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .bldr-back { font-size: 0.8125rem; font-weight: 600; color: var(--dv-gray); text-decoration: none; flex-shrink: 0; transition: color 0.15s; white-space: nowrap; }
        .bldr-back:hover { color: var(--dv-black); }
        .bldr-card-name { margin: 0; font-size: 0.9375rem; font-weight: 700; color: var(--dv-black); letter-spacing: -0.02em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
        .bldr-hdr-label { display: inline; }
        .bldr-view-toggle { display: none; }
        .bldr-body { flex: 1; display: flex; flex-direction: row; overflow: hidden; min-height: 0; }
        .bldr-editor { flex: 1; min-width: 0; overflow-y: auto; padding: 1.25rem; box-sizing: border-box; }
        .bldr-preview { flex: 0 0 400px; width: 400px; border-left: 1px solid var(--dv-border); padding: 1.25rem; display: flex; flex-direction: column; box-sizing: border-box; overflow: hidden; background: var(--dv-off-white); }
        .bldr-preview-inner { display: flex; flex-direction: column; height: 100%; min-height: 0; }
        @media (max-width: 1023px) {
          .bldr-root { height: auto; min-height: 100dvh; overflow: visible; }
          .bldr-dash-sidebar { display: none; }
          .bldr-area { height: auto; overflow: visible; }
          .bldr-view-toggle { display: flex; flex-shrink: 0; background: var(--dv-white); border-bottom: 1px solid var(--dv-border); }
          .bldr-view-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.375rem; padding: 0.625rem; font-size: 0.8125rem; font-weight: 600; border: none; cursor: pointer; border-bottom: 2px solid transparent; background: transparent; color: var(--dv-gray); transition: color 0.15s, border-color 0.15s; }
          .bldr-view-active { border-bottom-color: var(--dv-black); color: var(--dv-black); }
          .bldr-body { flex-direction: column; overflow: visible; }
          .bldr-editor { overflow: visible; height: auto; padding: 1rem; }
          .bldr-preview { flex: none; width: 100%; border-left: none; border-top: 1px solid var(--dv-border); padding: 1rem; height: auto; overflow: visible; }
          .bldr-preview-inner { height: auto; }
          .bldr-panel-hidden { display: none !important; }
          .bldr-hdr-label { display: none; }
        }
      `}</style>
    </div>
  );
}
