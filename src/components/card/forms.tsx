"use client";

import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, CheckCircle2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/field";
import { submitAppointment, submitLead } from "@/app/card/[username]/actions";
import { formatINR, cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation";

/**
 * Public card forms.
 *
 * Both share one pattern: `useActionState` holds the pending/result state so a
 * submission cannot be double-fired (section 65), inline field errors come from
 * the action's `fieldErrors`, and success replaces the form with an animation
 * (section 67). The success copy always tells the visitor what happens next.
 */

function SuccessPanel({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
      className="flex flex-col items-center gap-3 px-2 py-8 text-center"
      role="status"
    >
      <motion.div
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.08, duration: 0.5, bounce: 0.35 }}
        className="flex size-14 items-center justify-center rounded-full bg-[var(--c-accent-soft)]"
      >
        <CheckCircle2 className="size-7 text-[var(--c-accent)]" aria-hidden />
      </motion.div>
      <h3 className="text-lg font-semibold text-[var(--c-fg)]">{title}</h3>
      <p className="max-w-xs text-sm leading-relaxed text-[var(--c-muted)]">
        {description}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1 text-[13px] font-medium text-[var(--c-accent)] underline underline-offset-4"
      >
        Send another
      </button>
    </motion.div>
  );
}

/** Hidden from users, tempting to bots. */
function Honeypot() {
  return (
    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor="dv-website">Website</label>
      <input
        id="dv-website"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

export function EnquiryForm({
  cardId,
  ownerName,
  source = "enquiry",
  prefillMessage,
  disabled = false,
}: {
  cardId: string;
  ownerName: string;
  source?: string;
  prefillMessage?: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionResult<{
    id: string;
    ownerWhatsApp: string | null;
    ownerEmail: string | null;
    ownerName: string;
    senderName: string;
    senderPhone: string;
    message: string;
  }>, FormData>(
    async (_prev, formData) => {
      if (!formData.get("message")) formData.set("message", prefillMessage ?? "");
      return submitLead(formData) as never;
    },
    { ok: false, error: "" },
  );
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.ok ? undefined : state.fieldErrors;

  useEffect(() => {
    if (!state.ok || !state.data) return;
    formRef.current?.reset();

    const { ownerWhatsApp, ownerEmail, senderName, senderPhone, message, ownerName: oName } = state.data;
    const text = encodeURIComponent(
      `Hi ${oName}, I'm ${senderName} (${senderPhone}). ${message || `I'd like to know more about your services.`}`
    );

    if (ownerWhatsApp) {
      const num = ownerWhatsApp.replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${text}`, "_blank", "noopener");
    } else if (ownerEmail) {
      window.open(
        `mailto:${ownerEmail}?subject=${encodeURIComponent(`Enquiry from ${senderName}`)}&body=${text}`,
        "_blank",
      );
    }
  }, [state]);

  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <SuccessPanel
          key="done"
          title="Enquiry sent!"
          description={`Your message has been sent to ${ownerName}${
            state.data?.ownerWhatsApp ? " via WhatsApp" :
            state.data?.ownerEmail ? " via email" : ""
          }. They'll get back to you shortly.`}
          onReset={() => window.location.reload()}
        />
      ) : (
        <motion.form
          key="form"
          ref={formRef}
          action={action}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <fieldset disabled={disabled} className="space-y-4">
          <input type="hidden" name="cardId" value={cardId} />
          <input type="hidden" name="source" value={source} />
          <Honeypot />

          <Input
            name="name"
            label="Your name"
            autoComplete="name"
            required
            maxLength={120}
            placeholder="Priya Sharma"
            error={errors?.name}
          />
          <Input
            name="phone"
            type="tel"
            inputMode="numeric"
            label="Phone / WhatsApp"
            autoComplete="tel"
            required
            placeholder="98765 43210"
            error={errors?.phone}
          />
          <Input
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@example.com"
            hint="Optional"
            error={errors?.email}
          />
          <Textarea
            name="message"
            label="Message"
            placeholder={`Hi ${ownerName}, I'd like to know more about…`}
            defaultValue={prefillMessage}
            error={errors?.message}
          />

          {state.ok === false && state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[13px] text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            className="w-full"
          >
            {!pending ? <Send className="size-4" aria-hidden /> : null}
            {pending ? "Sending…" : "Send Enquiry"}
          </Button>
          <p className="text-center text-xs text-[var(--c-muted)]">
            Your details are shared only with {ownerName}.
          </p>
          </fieldset>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

export function AppointmentForm({
  cardId,
  ownerName,
  services,
  disabled = false,
}: {
  cardId: string;
  ownerName: string;
  services: string[];
  /** Renders the form inert — the builder preview must never file a request. */
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionResult<{ id: string }>, FormData>(
    // `useActionState` calls the action as (previousState, formData), so the
    // plain (formData) Server Action signature is adapted here.
    (_prev, formData) => submitAppointment(formData),
    { ok: false, error: "" },
  );
  const errors = state.ok ? undefined : state.fieldErrors;

  // The oldest bookable date is "today" *in the visitor's timezone*. Reading it
  // from the client on first paint is deliberate: computing it on the server would
  // bake in the server's date and either reject a valid request or accept a past
  // one for a visitor in another timezone. `useSyncExternalStore` is the
  // hydration-safe way to do that without a setState-in-effect.
  const minDate = useSyncExternalStore(
    () => () => undefined,
    () => new Date().toISOString().slice(0, 10),
    () => "",
  );

  return (
    <AnimatePresence mode="wait">
      {state.ok ? (
        <SuccessPanel
          key="done"
          title="Request sent"
          description={`${ownerName} will confirm a time with you shortly.`}
          onReset={() => window.location.reload()}
        />
      ) : (
        <motion.form
          key="form"
          action={action}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <input type="hidden" name="cardId" value={cardId} />
          <Honeypot />

          <fieldset disabled={disabled} className="space-y-4">
          <Input
            name="name"
            label="Your name"
            autoComplete="name"
            required
            placeholder="Priya Sharma"
            error={errors?.name}
          />
          <Input
            name="phone"
            type="tel"
            inputMode="numeric"
            label="Phone / WhatsApp"
            autoComplete="tel"
            required
            placeholder="98765 43210"
            error={errors?.phone}
          />
          <Input
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            placeholder="you@example.com"
            hint="Optional"
            error={errors?.email}
          />

          {services.length > 0 ? (
            <Select name="service" label="What is this about?" error={errors?.service}>
              <option value="">Choose a service</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </Select>
          ) : null}

          <div className={cn("grid gap-4", "grid-cols-1 sm:grid-cols-2")}>
            <Input
              name="preferredDate"
              type="date"
              label="Preferred date"
              required
              min={minDate || undefined}
              error={errors?.preferredDate}
            />            <Select name="preferredTime" label="Preferred time" error={errors?.preferredTime}>
              <option value="">Any time</option>
              <option value="Morning (9am – 12pm)">Morning (9am – 12pm)</option>
              <option value="Afternoon (12pm – 5pm)">Afternoon (12pm – 5pm)</option>
              <option value="Evening (5pm – 8pm)">Evening (5pm – 8pm)</option>
            </Select>
          </div>

          <Textarea
            name="message"
            label="Anything we should know?"
            placeholder="Optional notes for the meeting"
            rows={3}
            error={errors?.message}
          />

          {state.ok === false && state.error ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-[13px] text-danger"
            >
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            className="w-full"
          >
            {!pending ? <CalendarCheck className="size-4" aria-hidden /> : null}
            {pending ? "Sending…" : "Request Appointment"}
          </Button>
          </fieldset>
        </motion.form>
      )}
    </AnimatePresence>
  );
}

/** Price label that handles "free", "from" and optional sale pricing. */
export function PriceTag({
  pricePaise,
  className,
}: {
  pricePaise: number | null;
  className?: string;
}) {
  if (pricePaise === null || pricePaise === 0) {
    return (
      <span className={cn("text-sm text-[var(--c-muted)]", className)}>
        Price on request
      </span>
    );
  }
  return (
    <span
      className={cn("text-[15px] font-semibold text-[var(--c-fg)] tabular", className)}
    >
      {formatINR(pricePaise)}
    </span>
  );
}