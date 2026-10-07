"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";

import { updateProfileAction } from "@/lib/cards/actions";
import type { ActionResult } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

type ProfileState = ActionResult<{ saved: true }> | null;

/**
 * Account details form.
 *
 * The success state is shown inline rather than toasted, because this form is the
 * only thing on the page — a toast that vanishes after two seconds leaves the user
 * unsure whether the save worked.
 *
 * Uses `useActionState`, so the fields are uncontrolled and keep whatever the
 * user typed if the save is refused.
 */
export function ProfileForm({
  fullName,
  phone,
}: {
  fullName: string;
  phone: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null,
  );

  const error = state && !state.ok ? state.error : undefined;
  const field = (key: string) => (state && !state.ok ? state.fieldErrors?.[key] : undefined);
  const saved = state?.ok === true;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      <Input
        name="fullName"
        label="Your name"
        autoComplete="name"
        defaultValue={fullName}
        placeholder="Your full name"
        error={field("fullName")}
      />

      <Input
        name="phone"
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        defaultValue={phone}
        placeholder="10-digit mobile number"
        hint="Used for account messages. Cards have their own number."
        error={field("phone")}
      />

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Saving..." : "Save details"}
        </Button>

        {/* `role="status"` announces the confirmation without moving focus. */}
        <p
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-[13px] text-success"
        >
          {saved ? (
            <>
              <Check className="size-3.5" aria-hidden />
              Saved
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}