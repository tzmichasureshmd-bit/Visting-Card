"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { Panel } from "@/components/builder/action-kit";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { updateCardAction } from "@/lib/cards/actions";
import type { PreviewDraft } from "@/lib/cards/editor-preview";
import type { EditorState } from "@/lib/cards/editor-types";
import { USERNAME_RULES, validateUsername } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation";

function CardOrigin() {
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  return <>{origin}</>;
}

export function BuilderDetailsPanel({
  state,
  draft,
  setDraft,
}: {
  state: EditorState;
  draft: PreviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}) {
  const card = state.card;
  const router = useRouter();

  const [result, formAction, pending] = useActionState<
    ActionResult<{ cardId: string }> | null,
    FormData
  >(updateCardAction, null);

  const formKeyRef = useRef(0);
  const [formKey, setFormKey] = useState(0);
  const [saved, setSaved] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.ok) {
      router.refresh();
      setDraft((c) => ({ ...c, card: undefined }));
      formKeyRef.current += 1;
      setFormKey(formKeyRef.current);
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const set = (patch: Partial<PreviewDraft["card"]>) =>
    setDraft((c) => ({ ...c, card: { ...c.card, ...patch } }));

  const liveUsername = draft.card?.username ?? card.username;

  const btnStyle =
    saved && !pending
      ? { background: "var(--dv-success)", borderColor: "var(--dv-success)" }
      : {};

  return (
    <form key={formKey} action={formAction} className="space-y-5">
      <input type="hidden" name="cardId" value={card.id} />

      {/* ── Identity ── */}
      <Panel title="Your details" description="What people see first, and how they reach you.">
        <div className="space-y-4">
          <Input
            name="fullName"
            label="Full name"
            required
            defaultValue={card.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            error={result?.ok === false ? result.fieldErrors?.fullName : undefined}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="designation"
              label="Job title"
              placeholder="Design Lead"
              defaultValue={card.designation ?? ""}
              onChange={(e) => set({ designation: e.target.value || null })}
            />
            <Input
              name="company"
              label="Company"
              placeholder="Studio Nine"
              defaultValue={card.company ?? ""}
              onChange={(e) => set({ company: e.target.value || null })}
            />
          </div>
          <Textarea
            name="bio"
            label="About you"
            hint={`${(draft.card?.bio ?? card.bio ?? "").length}/600`}
            rows={4}
            defaultValue={card.bio ?? ""}
            onChange={(e) => set({ bio: e.target.value || null })}
            error={result?.ok === false ? result.fieldErrors?.bio : undefined}
          />
        </div>
      </Panel>

      {/* ── Contact ── */}
      <Panel title="Contact" description="The rows and buttons visitors tap.">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="phone"
              label="Phone"
              inputMode="tel"
              placeholder="9876543210"
              defaultValue={card.phone ?? ""}
              onChange={(e) => set({ phone: e.target.value || null })}
            />
            <Input
              name="whatsapp"
              label="WhatsApp"
              inputMode="tel"
              placeholder="9876543210"
              hint="Leave blank to fall back to your phone number."
              defaultValue={card.whatsapp ?? ""}
              onChange={(e) => set({ whatsapp: e.target.value || null })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="email"
              type="email"
              label="Email"
              defaultValue={card.email ?? ""}
              onChange={(e) => set({ email: e.target.value || null })}
              error={result?.ok === false ? result.fieldErrors?.email : undefined}
            />
            <Input
              name="website"
              label="Website"
              placeholder="example.com"
              defaultValue={card.website ?? ""}
              onChange={(e) => set({ website: e.target.value || null })}
            />
          </div>
        </div>
      </Panel>

      {/* ── Address ── */}
      <Panel title="Address" description="Shown in the Find us section. No geocoding — visitors get a map link.">
        <div className="space-y-4">
          <Textarea
            name="address"
            label="Street address"
            rows={2}
            defaultValue={card.address ?? ""}
            onChange={(e) => set({ address: e.target.value || null })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              name="city"
              label="City"
              defaultValue={card.city ?? ""}
              onChange={(e) => set({ city: e.target.value || null })}
            />
            <Input
              name="state"
              label="State"
              defaultValue={card.state ?? ""}
              onChange={(e) => set({ state: e.target.value || null })}
            />
            <Input
              name="pincode"
              label="PIN code"
              inputMode="numeric"
              defaultValue={card.pincode ?? ""}
              onChange={(e) => set({ pincode: e.target.value || null })}
            />
          </div>
        </div>
      </Panel>

      {/* ── Public link ── */}
      <Panel
        title="Public link"
        description={`${USERNAME_RULES.min}-${USERNAME_RULES.max} letters, numbers and hyphens. This is the address people share.`}
      >
        <div className="space-y-3">
          <Input
            name="username"
            label="Username"
            required
            value={liveUsername}
            onChange={(e) => {
              const next = e.target.value;
              set({ username: next });
              const check = validateUsername(next);
              setUsernameError("error" in check ? check.error : null);
            }}
            error={
              usernameError ??
              (result?.ok === false ? result.fieldErrors?.username : undefined)
            }
          />
          <p className="truncate select-all rounded bg-surface-2 px-3 py-2 font-mono text-xs text-muted">
            <CardOrigin />/card/{liveUsername}
          </p>
        </div>
      </Panel>

      {/* ── Single save button ── */}
      <div className="flex justify-end pb-2">
        <Button
          type="submit"
          loading={pending}
          disabled={!!usernameError}
          style={btnStyle}
        >
          {pending ? "Saving…" : saved ? "✓ Saved" : "Save"}
        </Button>
      </div>
    </form>
  );
}
