"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

type ToastInput = Omit<Partial<Toast>, "id"> & { title: string };

const ToastContext = createContext<{ toast: (input: ToastInput) => string; dismiss: (id: string) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = `t${++counter.current}`;
    const next: Toast = {
      id, title: input.title, description: input.description,
      variant: input.variant ?? "info",
      duration: input.duration ?? (input.variant === "error" ? 7000 : 4200),
    };
    setToasts((prev) => [...prev.slice(-3), next]);
    if (Number.isFinite(next.duration)) {
      timers.current.set(id, setTimeout(() => dismiss(id), next.duration));
    }
    return id;
  }, [dismiss]);

  useEffect(() => { const map = timers.current; return () => map.forEach(clearTimeout); }, []);
  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

const VARIANT_CONFIG: Record<ToastVariant, { icon: typeof Info; bg: string; iconColor: string; border: string }> = {
  success: { icon: CheckCircle2, bg: "#f0fdf4", iconColor: "var(--dv-success)", border: "rgba(22,163,74,0.2)" },
  error:   { icon: XCircle,      bg: "#fef2f2", iconColor: "var(--dv-danger)",  border: "rgba(220,38,38,0.2)" },
  warning: { icon: AlertTriangle, bg: "#fffbeb", iconColor: "var(--dv-warning)", border: "rgba(217,119,6,0.2)" },
  info:    { icon: Info,          bg: "var(--dv-lime-soft)", iconColor: "var(--dv-black)", border: "var(--dv-border)" },
};

export function ToastViewport({ toasts, onDismiss }: { toasts?: Toast[]; onDismiss?: (id: string) => void }) {
  const context = useContext(ToastContext);
  const list = toasts ?? [];
  const dismiss = onDismiss ?? context?.dismiss;

  return (
    <div aria-live="polite" aria-atomic="false"
      style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 300, display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "22rem", width: "calc(100vw - 3rem)" }}>
      {list.map((t) => {
        const cfg = VARIANT_CONFIG[t.variant];
        const Icon = cfg.icon;
        return (
          <div key={t.id} role="status"
            style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: "var(--dv-r-md)", boxShadow: "var(--dv-shadow-md)", animation: "dv-fade-up 0.3s ease both" }}>
            <Icon style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0, marginTop: "0.125rem", color: cfg.iconColor }} aria-hidden />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 600, color: "var(--dv-black)" }}>{t.title}</p>
              {t.description ? <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--dv-gray)" }}>{t.description}</p> : null}
            </div>
            <button type="button" onClick={() => dismiss?.(t.id)} aria-label="Dismiss"
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0.125rem", color: "var(--dv-gray-light)", flexShrink: 0 }}>
              <X style={{ width: "1rem", height: "1rem" }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>.");
  return context;
}
