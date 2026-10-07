"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, description, children, footer, size = "md" }: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const { body } = document;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPadding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    const focusTimer = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const target = panel.querySelector<HTMLElement>("[data-autofocus]");
      (target ?? panel).focus();
    }, 20);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); return; }
      if (e.key !== "Tab") return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadding;
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === "sm" ? "28rem" : size === "lg" ? "56rem" : "40rem";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        style={{ position: "relative", width: "100%", maxWidth: maxW, maxHeight: "90dvh", display: "flex", flexDirection: "column", background: "var(--dv-white)", borderRadius: "var(--dv-r-lg)", boxShadow: "var(--dv-shadow-lg)", outline: "none", overflow: "hidden" }}
      >
        {title ? (
          <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--dv-border)" }}>
            <div>
              <h2 id={titleId} style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--dv-black)" }}>{title}</h2>
              {description ? <p id={descriptionId} style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--dv-gray)" }}>{description}</p> : null}
            </div>
            <button type="button" onClick={onClose} aria-label="Close dialog"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", color: "var(--dv-gray)", borderRadius: "var(--dv-r-sm)", flexShrink: 0 }}>
              <X style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </header>
        ) : null}
        <div className="dv-scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>{children}</div>
        {footer ? <footer style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--dv-border)", background: "var(--dv-off-white)" }}>{footer}</footer> : null}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", destructive = false, loading = false }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button type="button" onClick={onClose} disabled={loading}
            className={cn("dv-btn dv-btn-ghost dv-btn-sm")}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} data-autofocus
            className={cn("dv-btn dv-btn-sm", destructive ? "" : "dv-btn-primary")}
            style={destructive ? { background: "var(--dv-danger)", color: "#fff", padding: "0.5rem 1rem" } : {}}>
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      }
    >
      <p style={{ margin: 0, fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.6 }}>{description}</p>
    </Modal>
  );
}
