"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { isOpenNow } from "@/components/card/card-view";
import type { BusinessHour } from "@/lib/cards/types";

export function OpenNowPill({
  businessHours,
  showBusinessHours,
}: {
  businessHours: BusinessHour[];
  showBusinessHours: boolean;
}) {
  const open = useSyncExternalStore(
    () => () => {},
    () => isOpenNow(businessHours).open,
    () => false,
  );

  if (!showBusinessHours || businessHours.length === 0) return null;

  return (
    <p className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] text-[var(--c-muted)]">
      <span
        className={cn(
          "size-2 rounded-full",
          open ? "bg-emerald-500" : "bg-[var(--c-muted)]",
        )}
        aria-hidden
      />
      <span style={{ fontWeight: open ? 600 : 400 }}>
        {open ? "Open now" : "Closed now"}
      </span>
    </p>
  );
}
