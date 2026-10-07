"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export function TiltCard({ children, className, max = 6 }: {
  children: React.ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1200px) rotateX(${-y * max}deg) rotateY(${x * max}deg) scale(1.01)`;
    };
    const onLeave = () => { el.style.transform = "perspective(1200px) rotateX(0) rotateY(0) scale(1)"; };

    el.style.transition = "transform 0.15s ease";
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [max]);

  return (
    <div ref={ref} className={cn("relative", className)} style={{ transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}
