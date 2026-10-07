"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, CreditCard, CheckCircle2, ArrowRight, QrCode } from "lucide-react";
import { createCardAction } from "@/lib/cards/actions";
import type { ActionResult } from "@/lib/validation";

type State = ActionResult<{ cardId: string }> | null;

function Field({
  label, name, type = "text", placeholder, required,
  hint, error, inputMode, autoComplete, defaultValue,
}: {
  label: string; name: string; type?: string; placeholder?: string;
  required?: boolean; hint?: string; error?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string; defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-[13px] font-medium text-fg mb-1">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      <input
        id={name} name={name} type={type} inputMode={inputMode}
        autoComplete={autoComplete} placeholder={placeholder}
        defaultValue={defaultValue} required={required}
        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[border-color,box-shadow]"
      />
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
      {hint && !error && <p className="mt-1 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}

function SuccessPopup({ cardId, onClose }: { cardId: string; onClose: () => void }) {
  const router = useRouter();

  function goToEditor() {
    router.push(`/dashboard/cards/${cardId}`);
    onClose();
  }

  return (
    <div className="flex flex-col items-center text-center px-6 py-10 gap-5">
      {/* Animated check */}
      <div className="relative flex items-center justify-center">
        <div className="absolute size-24 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: "1.4s" }} />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="size-10 text-emerald-500" strokeWidth={1.5} />
        </div>
      </div>

      <div>
        <h2 className="text-[20px] font-bold text-fg tracking-tight">Card Created! 🎉</h2>
        <p className="mt-1.5 text-[13.5px] text-muted leading-relaxed max-w-xs mx-auto">
          Your digital visiting card is ready. Open the editor to add your photo, pick a design, and publish it.
        </p>
      </div>

      {/* QR hint */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-left w-full max-w-xs">
        <QrCode className="size-5 shrink-0 text-muted" aria-hidden />
        <p className="text-[12.5px] text-muted leading-snug">
          A QR code is already on your card — anyone who scans it sees your details instantly.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <button
          type="button"
          onClick={goToEditor}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-fg text-[14px] font-semibold text-bg hover:opacity-90 transition-opacity"
        >
          Open Card Editor
          <ArrowRight className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-line text-[13.5px] font-medium text-muted hover:text-fg hover:bg-surface-2 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export function NewCardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<State, FormData>(createCardAction, null);
  const panelRef = useRef<HTMLDivElement>(null);
  const success = state?.ok ? state.data.cardId : null;

  // Refresh dashboard data when card is created
  useEffect(() => {
    if (success) router.refresh();
  }, [success, router]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && !success) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose, success]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open || success) return;
    const t = setTimeout(() => panelRef.current?.querySelector<HTMLInputElement>("input")?.focus(), 50);
    return () => clearTimeout(t);
  }, [open, success]);

  function handleClose() {
    onClose();
  }

  if (!open) return null;

  const error = state && !state.ok ? state.error : undefined;
  const field = (key: string) => state && !state.ok ? state.fieldErrors?.[key] : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={success ? undefined : handleClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={success ? "Card created" : "Create new card"}
        className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl border border-line bg-surface shadow-xl overflow-hidden"
        style={{ animation: "modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        <style>{`@keyframes modalPop{from{opacity:0;transform:scale(0.92) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>

        {success ? (
          <>
            <div className="flex justify-end px-4 pt-4">
              <button type="button" onClick={handleClose} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg transition-colors" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <SuccessPopup cardId={success} onClose={handleClose} />
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
                  <CreditCard className="size-4" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[15px] font-semibold text-fg">Create New Card</h2>
                  <p className="text-[12px] text-muted">Fill in your details — everything can be changed later</p>
                </div>
              </div>
              <button type="button" onClick={handleClose} className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg transition-colors" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {error && (
                <div className="mb-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[13.5px] text-danger">{error}</div>
              )}
              <form id="new-card-form" action={formAction} noValidate className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Full Name" name="fullName" placeholder="e.g. Rahul Sharma" required autoComplete="name" error={field("fullName")} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="Profession / Designation" name="designation" placeholder="e.g. Doctor, Architect" autoComplete="organization-title" error={field("designation")} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="City" name="city" placeholder="e.g. Mumbai" autoComplete="address-level2" error={field("city")} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="Phone" name="phone" type="tel" inputMode="tel" placeholder="10-digit mobile" autoComplete="tel" hint="Shown as a Call button on your card" error={field("phone")} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <Field label="WhatsApp" name="whatsapp" type="tel" inputMode="tel" placeholder="Same number is fine" autoComplete="tel" hint="Visitors get a one-tap chat button" error={field("whatsapp")} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Email" name="email" type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" error={field("email")} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[13px] font-medium text-fg mb-1">About / Bio</label>
                    <textarea name="bio" rows={3} placeholder="A short intro about yourself or your business…" className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[border-color,box-shadow] resize-none" />
                    {field("bio") && <p className="mt-1 text-[12px] text-danger">{field("bio")}</p>}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-line bg-surface-2">
              <button type="button" onClick={handleClose} disabled={pending} className="inline-flex h-9 items-center rounded-xl border border-line bg-surface px-4 text-[13.5px] font-medium text-fg hover:bg-surface-2 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" form="new-card-form" disabled={pending} aria-busy={pending} className="inline-flex h-9 items-center gap-2 rounded-xl bg-fg px-4 text-[13.5px] font-medium text-bg hover:opacity-90 transition-opacity disabled:opacity-50">
                {pending ? (
                  <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                ) : <CreditCard className="size-3.5" aria-hidden />}
                {pending ? "Creating…" : "Create Card"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
