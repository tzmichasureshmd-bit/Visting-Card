"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * Shared plumbing for the builder's action-backed panels.
 *
 * Every panel writes through a Server Action that returns the same
 * `ActionResult` shape, so the "call it, toast the result, refresh the read
 * model" loop is identical everywhere. Centralising it means a panel can never
 * forget the failure branch — which is how a silently failing builder happens.
 */

/**
 * Run a Server Action, toast the outcome, and refresh the server component.
 *
 * `refresh` is what re-reads `getEditorState`, so the preview and the saved
 * state never drift: the reload is the confirmation, not an optimistic guess.
 */
export function useActionRunner() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const run = useCallback(
    async <T,>(
      key: string,
      action: () => Promise<ActionResult<T>>,
      options: { success?: string; onSuccess?: (data: T) => void } = {},
    ): Promise<T | null> => {
      setPending(key);
      try {
        const result = await action();
        if (result.ok) {
          if (options.success) {
            toast({ variant: "success", title: options.success });
          }
          options.onSuccess?.(result.data);
          setLastSaved(key);
          setTimeout(() => setLastSaved(null), 2000);
          router.refresh();
          return result.data;
        }
        toast({ variant: "error", title: result.error });
        return null;
      } catch {
        toast({
          variant: "error",
          title: "Something went wrong. Please check your connection and try again.",
        });
        return null;
      } finally {
        setPending(null);
      }
    },
    [router, toast],
  );

  return { run, pending, lastSaved };
}

/** True while the named action is in flight — pass a key so panels can coexist. */
export function useIsPending(pending: string | null, key: string) {
  return pending === key;
}

/**
 * Read the current origin without an effect.
 *
 * `useSyncExternalStore` is the supported way to read a browser-only value: it
 * returns the server value during SSR, the real one after hydration, and — unlike
 * `useState` + `useEffect` — needs no second render pass to get there.
 */
function subscribeToOrigin() {
  return () => {};
}

function readOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

/**
 * The absolute public URL of a card.
 *
 * Empty until the client reads the origin, which is enough for a QR code to
 * render — the publish panel only shows it once the card is live, by which point
 * hydration has happened.
 */
export function useCardUrl(username: string): string {
  const origin = useSyncExternalStore(subscribeToOrigin, readOrigin, () => "");
  return username ? `${origin}/card/${username}` : "";
}

/**
 * The public URL of a card, with a copy button.
 *
 * Copying is the single most common next action after publishing, so it is a
 * real button with a confirmation rather than "select the text above".
 */
export function ShareBar({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const url = useCardUrl(username);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-[13px] text-muted">
        {url}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            toast({
              variant: "warning",
              title: "Copying is blocked in this browser.",
              description: "Select the address above and copy it manually.",
            });
          }
        }}
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </Button>
      <Button asChild variant="ghost" size="sm">
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </Button>
    </div>
  );
}

/** Shared row-editing helpers for the list panels. */
export function useRowEditor<T extends { id: string }>(initial: T[]) {
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);

  const patch = useCallback((id: string, next: Partial<T>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...next } : row)),
    );
  }, []);

  const add = useCallback((row: T) => {
    setRows((current) => [...current, row]);
  }, []);

  const remove = useCallback((id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  }, []);

  const move = useCallback((id: string, direction: -1 | 1) => {
    setRows((current) => {
      const index = current.findIndex((row) => row.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  return { rows, setRows, saving, setSaving, patch, add, remove, move };
}

/**
 * A local preview for a file the user has just picked.
 *
 * Uploads feel slow without one — you pick an image and stare at the old one
 * until the round trip finishes. The object URL is revoked whenever the preview
 * is replaced and again on unmount, so an editing session cannot leak blob
 * handles.
 */
export function useObjectUrlPreview() {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  const preview = useCallback((file: File) => setUrl(URL.createObjectURL(file)), []);
  const clear = useCallback(() => setUrl(null), []);

  return { url, preview, clear };
}

/** Consistent panel chrome so every tab reads as part of one surface. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-surface", className)}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-fg">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-[13px] leading-snug text-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}