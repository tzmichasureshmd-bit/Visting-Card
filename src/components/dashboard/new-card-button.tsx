"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Crown } from "lucide-react";
import { NewCardModal } from "@/components/dashboard/new-card-modal";

export function NewCardButton({ canAdd }: { canAdd: boolean }) {
  const [open, setOpen] = useState(false);

  if (!canAdd) {
    return (
      <Link
        href="/#pricing"
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-medium text-fg hover:bg-surface-2 transition-colors"
      >
        <Crown className="size-4" aria-hidden />
        Upgrade to add another
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-fg px-4 text-[13.5px] font-medium text-bg hover:opacity-90 transition-opacity"
      >
        <Plus className="size-4" aria-hidden />
        New Card
      </button>
      <NewCardModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
