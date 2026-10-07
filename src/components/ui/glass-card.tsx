"use client";

import { useEffect, useRef } from "react";

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  enableTilt?: boolean;
  /** accent colour — defaults to DV lime */
  accentColor?: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** kept for API compat — ignored, always white */
  backgroundColor?: string;
  /** kept for API compat — ignored */
  containerBackground?: string;
}

export default function GlassCard({
  title,
  subtitle,
  description,
  enableTilt = false,
  accentColor = "#C7FF2F",
  children,
  className,
  style,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const glow = glowRef.current;
    if (!card || !enableTilt) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;
    let targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;

    const onMove = (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRY =  x * 14;
      targetRX = -y * 10;
      if (glow) {
        glow.style.left    = `${(x + 0.5) * 100}%`;
        glow.style.top     = `${(y + 0.5) * 100}%`;
        glow.style.opacity = "1";
      }
    };

    const onLeave = () => {
      targetRX = 0; targetRY = 0;
      if (glow) glow.style.opacity = "0";
    };

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      currentRX += (targetRX - currentRX) * 0.1;
      currentRY += (targetRY - currentRY) * 0.1;
      card.style.transform =
        `perspective(900px) rotateX(${currentRX}deg) rotateY(${currentRY}deg) scale3d(1.015,1.015,1.015)`;
    };

    card.addEventListener("pointermove", onMove, { passive: true });
    card.addEventListener("pointerleave", onLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
      card.style.transform = "";
    };
  }, [enableTilt]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        position: "relative",
        background: "#ffffff",
        border: "1.5px solid rgba(0,0,0,0.08)",
        borderRadius: "var(--dv-r-md, 20px)",
        padding: "1.75rem",
        overflow: "hidden",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        transformStyle: "preserve-3d",
        willChange: enableTilt ? "transform" : undefined,
        transition: "box-shadow 0.25s ease, border-color 0.25s ease",
        cursor: enableTilt ? "default" : undefined,
        ...style,
      }}
      onMouseEnter={e => {
        if (!enableTilt) {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.15)";
        }
      }}
      onMouseLeave={e => {
        if (!enableTilt) {
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
        }
      }}
    >
      {/* Lime accent top stripe */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: "3px",
          background: accentColor,
          borderRadius: "var(--dv-r-md, 20px) var(--dv-r-md, 20px) 0 0",
        }}
      />

      {/* Frosted glass shimmer */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.0) 60%)",
          pointerEvents: "none",
          borderRadius: "inherit",
        }}
      />

      {/* Moving glow on tilt */}
      <div
        ref={glowRef}
        aria-hidden
        style={{
          position: "absolute",
          width: "10rem",
          height: "10rem",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}55 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          opacity: 0,
          transition: "opacity 0.3s ease",
          left: "50%",
          top: "50%",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {subtitle ? (
          <p style={{
            margin: "0 0 0.375rem",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--dv-gray-light, #888)",
          }}>
            {subtitle}
          </p>
        ) : null}

        {title ? (
          <h3 style={{
            margin: "0 0 0.625rem",
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--dv-black, #000)",
            lineHeight: 1.15,
          }}>
            {title}
          </h3>
        ) : null}

        {description ? (
          <p style={{
            margin: 0,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "var(--dv-gray, #555)",
          }}>
            {description}
          </p>
        ) : null}

        {children}
      </div>
    </div>
  );
}
