"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { CreditCard, UserRound, ArrowRight, CheckCircle2, QrCode } from "lucide-react";

import { createCardAction } from "@/lib/cards/actions";
import type { ThemeShowcase } from "@/lib/marketing/themes";
import type { ActionResult } from "@/lib/validation";

type State = ActionResult<{ cardId: string }> | null;

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp,image/avif";

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
      <label htmlFor={name} className="block text-[13px] font-medium text-fg mb-1.5">
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

function SuccessScreen({ cardId }: { cardId: string }) {
  const router = useRouter();
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <div className="absolute size-28 rounded-full bg-emerald-500/10 animate-ping" style={{ animationDuration: "1.4s" }} />
          <div className="relative flex size-24 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-12 text-emerald-500" strokeWidth={1.5} />
          </div>
        </div>

        <div>
          <h1 className="text-[26px] font-bold text-fg tracking-tight">Card Created! 🎉</h1>
          <p className="mt-2 text-[14px] text-muted leading-relaxed">
            Your digital visiting card is ready. Open the editor to add your photo, pick a design, and publish it.
          </p>
        </div>

        <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-left w-full">
          <QrCode className="size-5 shrink-0 text-muted" aria-hidden />
          <p className="text-[12.5px] text-muted leading-snug">
            A QR code is already on your card — anyone who scans it sees your details instantly.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={() => router.push(`/builder/${cardId}`)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-[14px] font-semibold text-bg hover:opacity-90 transition-opacity"
          >
            Open Card Editor
            <ArrowRight className="size-4" aria-hidden />
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-line text-[13.5px] font-medium text-muted hover:text-fg hover:bg-surface transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export function OnboardingForm({
  prefilledName,
  prefilledEmail,
  themeSlug,
  theme,
  lockedTheme,
}: {
  prefilledName: string;
  prefilledEmail: string;
  themeSlug: string;
  theme: ThemeShowcase | null;
  lockedTheme: ThemeShowcase | null;
}) {
  const [state, formAction, pending] = useActionState<State, FormData>(createCardAction, null);
  const photoInput = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ name: string; url: string } | null>(null);

  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.url);
  }, [photo]);

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(file ? { name: file.name, url: URL.createObjectURL(file) } : null);
  }

  function clearPhoto() {
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto(null);
    if (photoInput.current) photoInput.current.value = "";
  }

  // Show success screen after card created
  if (state?.ok) return <SuccessScreen cardId={state.data.cardId} />;

  const error = state && !state.ok ? state.error : undefined;
  const field = (key: string) => state && !state.ok ? state.fieldErrors?.[key] : undefined;

  return (
    <div className="min-h-dvh bg-bg">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface/90 backdrop-blur px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-fg">
            <CreditCard className="size-3.5" aria-hidden />
          </span>
          <span className="text-[14px] font-semibold text-fg">DV Card</span>
        </div>
        <Link href="/dashboard" className="text-[13px] text-muted hover:text-fg transition-colors">
          Skip for now →
        </Link>
      </header>

      <main className="mx-auto max-w-xl px-5 py-10">
        {/* Heading */}
        <div className="mb-8">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-brand mb-1.5">
            Set up your card
          </p>
          <h1 className="text-[26px] font-bold text-fg tracking-tight leading-tight">
            Create your Digital Visiting Card
          </h1>
          <p className="mt-2 text-[14px] text-muted leading-relaxed">
            A few details make it feel like you. Everything can be changed later from the editor.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-[13.5px] text-danger">
            {error}
          </div>
        )}

        <form action={formAction} noValidate className="space-y-5">
          {themeSlug ? <input type="hidden" name="themeSlug" value={themeSlug} /> : null}

          {/* Theme notice */}
          {(theme || lockedTheme) && (
            <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="size-3 rounded-full shrink-0" style={{ background: theme?.config?.palette?.accent ?? "#a3e635" }} />
              <p className="text-[13px] text-muted flex-1 min-w-0">
                {theme ? (
                  <>Starting from <strong className="text-fg font-semibold">{theme.name}</strong> design.</>
                ) : (
                  <><strong className="text-fg font-semibold">{lockedTheme?.name}</strong> is a Pro style — your card starts on the default. <Link href="/#pricing" className="text-brand underline underline-offset-2">Upgrade</Link> to use it.</>
                )}
              </p>
              <Link href="/templates" className="shrink-0 text-[12.5px] font-medium text-brand underline underline-offset-2">
                {theme ? "Change" : "Browse"}
              </Link>
            </div>
          )}

          {/* Profile photo */}
          <div>
            <span className="block text-[13px] font-medium text-fg mb-1.5">Profile Photo</span>
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-surface-2">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt="" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-7 text-subtle" aria-hidden />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <label className={`inline-flex h-9 cursor-pointer items-center rounded-xl border border-line bg-surface px-3.5 text-[13px] font-medium text-fg hover:bg-surface-2 transition-colors ${pending ? "pointer-events-none opacity-60" : ""}`}>
                  <input ref={photoInput} type="file" name="photo" accept={ACCEPTED_IMAGES} disabled={pending} onChange={onPhotoChange} className="sr-only" />
                  {photo ? "Change photo" : "Choose photo"}
                </label>
                {photo && (
                  <button type="button" onClick={clearPhoto} disabled={pending} className="ml-2 text-[13px] text-muted hover:text-fg transition-colors disabled:opacity-50">
                    Remove
                  </button>
                )}
                <p className="mt-1 text-[12px] text-muted">{photo ? photo.name : "JPG, PNG or WebP · up to 5 MB"}</p>
              </div>
            </div>
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Field label="Full Name" name="fullName" placeholder="e.g. Rahul Sharma" required autoComplete="name" defaultValue={prefilledName} error={field("fullName")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="Profession / Designation" name="designation" placeholder="e.g. Doctor, Architect" autoComplete="organization-title" error={field("designation")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="City" name="city" placeholder="e.g. Mumbai" autoComplete="address-level2" error={field("city")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="Phone" name="phone" type="tel" inputMode="tel" placeholder="10-digit mobile" autoComplete="tel" hint="Shown as a Call button" error={field("phone")} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Field label="WhatsApp" name="whatsapp" type="tel" inputMode="tel" placeholder="Same number is fine" autoComplete="tel" hint="One-tap chat button" error={field("whatsapp")} />
            </div>
            <div className="col-span-2">
              <Field label="Email" name="email" type="email" inputMode="email" placeholder="you@example.com" autoComplete="email" defaultValue={prefilledEmail} error={field("email")} />
            </div>
            <div className="col-span-2">
              <label className="block text-[13px] font-medium text-fg mb-1.5">About / Bio</label>
              <textarea name="bio" rows={3} placeholder="A short intro about yourself or your business…" className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-[border-color,box-shadow] resize-none" />
              {field("bio") && <p className="mt-1 text-[12px] text-danger">{field("bio")}</p>}
            </div>
          </div>

          {/* QR note */}
          <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-4 py-3">
            <QrCode className="size-4 shrink-0 text-muted" aria-hidden />
            <p className="text-[12.5px] text-muted leading-snug">
              A QR code is automatically added to your card — scan it to instantly share your details.
            </p>
          </div>

          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-fg text-[14px] font-semibold text-bg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {pending ? (
              <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2.5" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            ) : <CreditCard className="size-4" aria-hidden />}
            {pending ? "Creating your card…" : "Create My Card"}
          </button>

          <p className="text-center text-[12.5px] text-muted">
            You can pick a design and add more sections in the card editor next.
          </p>
        </form>
      </main>
    </div>
  );
}
