"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * Sign-out control for the dashboard header.
 *
 * A form bound to the Server Action rather than a plain `<a>`: Next verifies the
 * Origin header on action POSTs, so this cannot be triggered cross-site. The
 * navigation happens on the client because the action cannot call `redirect()`
 * without discarding its own return value — the same rule the auth forms follow.
 */
export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await signOutAction();
          if (result.ok) {
            router.push(result.data.redirectTo);
            router.refresh();
          }
        });
      }}
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </Button>
  );
}
