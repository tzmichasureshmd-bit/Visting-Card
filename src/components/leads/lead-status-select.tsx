"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Select } from "@/components/ui/field";
import { useActionRunner } from "@/components/builder/action-kit";
import { setLeadStatusAction } from "@/lib/cards/actions";

/**
 * One lead's status control.
 *
 * A `Select` rather than five buttons: there are five states, they are a linear
 * pipeline, and a select keeps the row one line tall so the list stays scannable.
 *
 * The pending state is keyed by lead id so moving one lead does not disable the
 * rest of the list.
 */
const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "converted", label: "Converted" },
  { value: "lost", label: "Lost" },
] as const;

export function LeadStatusSelect({
  leadId,
  initial,
}: {
  leadId: string;
  initial: string;
}) {
  const { run, pending } = useActionRunner();
  const [status, setStatus] = useState(initial);
  const busy = pending === `lead-${leadId}`;

  return (
    <div className="relative">
      <Select
        label="Lead status"
        value={status}
        disabled={busy}
        className="min-w-[9.5rem]"
        onChange={(event) => {
          const next = event.target.value;
          const previous = status;
          setStatus(next);
          void run(`lead-${leadId}`, () => setLeadStatusAction(leadId, next)).then(
            (result) => {
              // The action refreshes the read model; on failure, put the old value
              // back so the control never claims a state the database rejected.
              if (result === null) setStatus(previous);
            },
          );
        }}
      >
        {STATUSES.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {busy ? (
        <Loader2
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 animate-spin text-muted"
          aria-hidden
        />
      ) : null}
    </div>
  );
}