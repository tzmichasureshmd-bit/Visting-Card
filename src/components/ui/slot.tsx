"use client";

import { cloneElement, forwardRef, isValidElement } from "react";

import { cn } from "@/lib/utils";

/**
 * Minimal `asChild` implementation.
 *
 * Avoids pulling in `@radix-ui/react-slot` for the one thing we need: merging
 * props onto a single child element instead of rendering a wrapper. Only one
 * child is allowed — anything else would make prop merging ambiguous.
 */
export const Slot = forwardRef<
  HTMLElement,
  {
    children?: React.ReactNode;
  } & Record<string, unknown>
>(function Slot({ children, ...slotProps }, ref) {
  if (!children || !isValidElement(children)) return null;

  const child = children as React.ReactElement<Record<string, unknown>>;
  const merged: Record<string, unknown> = { ...slotProps };

  for (const [key, slotValue] of Object.entries(slotProps)) {
    const childValue = child.props[key];

    // Tailwind class merging needs `tailwind-merge`, not naive concatenation.
    if (key === "className") {
      merged[key] = cn(slotValue as string, childValue as string);
    } else if (key === "style") {
      merged[key] = {
        ...(slotProps.style as object | undefined),
        ...(childValue as object | undefined),
      };
    } else if (typeof slotValue === "function" && typeof childValue === "function") {
      // Compose handlers so the child's handler still runs.
      merged[key] = (...args: unknown[]) => {
        (childValue as (...a: unknown[]) => void)(...args);
        (slotValue as (...a: unknown[]) => void)(...args);
      };
    } else {
      merged[key] = childValue ?? slotValue;
    }
  }

  merged.ref = ref;
  merged.children = child.props.children;

  return cloneElement(child, merged);
});