"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteCardAction, duplicateCardAction } from "@/lib/cards/actions";

export function DeleteCardButton({ cardId, cardName }: { cardId: string; cardName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-muted">Delete &ldquo;{cardName}&rdquo;?</span>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await deleteCardAction(cardId);
              if (result.ok) {
                toast({ variant: "success", title: "Card deleted." });
                router.refresh();
              } else {
                toast({ variant: "error", title: result.error });
              }
              setConfirming(false);
            });
          }}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Delete
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="text-muted hover:text-danger"
      onClick={() => setConfirming(true)}
    >
      <Trash2 className="size-3.5" aria-hidden />
      Delete
    </Button>
  );
}

export function DuplicateCardButton({ cardId }: { cardId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await duplicateCardAction(cardId);
          if (result.ok) {
            toast({ variant: "success", title: "Card duplicated." });
            router.push(`/builder/${result.data.newCardId}`);
          } else {
            toast({ variant: "error", title: result.error });
          }
        });
      }}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" aria-hidden />}
      Duplicate
    </Button>
  );
}
