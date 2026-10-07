"use client";

import { Slot } from "@/components/ui/slot";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:   "dv-btn dv-btn-primary",
  secondary: "dv-btn dv-btn-lime",
  outline:   "dv-btn dv-btn-outline",
  ghost:     "dv-btn dv-btn-ghost",
  danger:    "dv-btn",
  whatsapp:  "dv-btn",
};

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary:   {},
  secondary: {},
  outline:   {},
  ghost:     {},
  danger:    { background: "var(--dv-danger)", color: "#fff", padding: "0.875rem 2rem" },
  whatsapp:  { background: "#25d366", color: "#fff", padding: "0.875rem 2rem" },
};

const SIZES: Record<Size, string> = {
  sm: "dv-btn-sm",
  md: "",
  lg: "dv-btn-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  asChild?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant = "primary", size = "md", loading = false, asChild = false, fullWidth = false, disabled, children, style, ...props },
    ref,
  ) {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        ref={ref}
        aria-busy={loading || undefined}
        disabled={disabled || loading}
        className={cn(VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
        style={{ ...VARIANT_STYLES[variant], ...style }}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {children}
      </Component>
    );
  },
);
