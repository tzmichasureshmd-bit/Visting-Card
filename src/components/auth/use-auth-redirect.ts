"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import type { ActionResult } from "@/lib/validation";

/**
 * Sends the browser onward once an auth action succeeds.
 *
 * The Server Action cannot call `redirect()` itself, because that would throw and
 * discard the action state — including the case where a successful sign-up needs
 * to report "check your inbox" instead of navigating. So the action returns the
 * destination and this hook performs the navigation on the client.
 *
 * `useRef` guards against a double push when React re-runs the effect in
 * development strict mode.
 */
export function useAuthRedirect(
  state: ActionResult<{ redirectTo?: string }> | null,
  isPending: boolean,
): void {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (isPending || !state?.ok) return;

    const target = state.data?.redirectTo;
    if (!target) return;
    if (handled.current) return;
    handled.current = true;

    // `refresh()` first so the new session cookie is picked up by the server
    // component tree on the destination route; without it the destination can
    // briefly render as signed-out.
    router.push(target);
    router.refresh();
  }, [state, isPending, router]);
}
