"use client";

import { UserCheck } from "lucide-react";
import { CardView } from "@/components/card/card-view";
import { demoCard } from "@/lib/cards/demo";
import type { ThemeShowcase } from "@/lib/marketing/themes";

export function CardPreview({
  themes,
}: {
  themes: ThemeShowcase[];
  qrValue?: string;
  tone?: "light" | "dark";
}) {
  const active = themes.find((t) => t.slug === "professional") ?? themes[0];

  if (!active) return null;

  const previewCard = { ...demoCard, theme: active.config };

  return (
    <div className="w-full">
      {/* ── Outer wrapper: phone centred, tags absolutely positioned ── */}
      <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>

        {/* Lime glow behind phone */}
        <div aria-hidden style={{
          position: "absolute",
          top: "10%", left: "50%",
          transform: "translateX(-50%)",
          width: "18rem", height: "24rem",
          background: "radial-gradient(ellipse, rgba(199,255,47,0.55) 0%, transparent 70%)",
          filter: "blur(32px)",
          zIndex: 0,
          pointerEvents: "none",
        }} />

        {/* ── iPhone X — clean sharp frame, notch only, full screen content ── */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Left side buttons */}
          <div aria-hidden style={{ position: "absolute", left: "-3px", top: "5rem",  width: "3px", height: "1.6rem", background: "linear-gradient(to right,#4a4a4a,#777)", borderRadius: "2px 0 0 2px" }} />
          <div aria-hidden style={{ position: "absolute", left: "-3px", top: "7.4rem", width: "3px", height: "2.6rem", background: "linear-gradient(to right,#4a4a4a,#777)", borderRadius: "2px 0 0 2px" }} />
          <div aria-hidden style={{ position: "absolute", left: "-3px", top: "10.6rem",width: "3px", height: "2.6rem", background: "linear-gradient(to right,#4a4a4a,#777)", borderRadius: "2px 0 0 2px" }} />
          {/* Right power button */}
          <div aria-hidden style={{ position: "absolute", right: "-3px", top: "8rem",  width: "3px", height: "3.8rem", background: "linear-gradient(to left,#4a4a4a,#777)",  borderRadius: "0 2px 2px 0" }} />

          {/* Body */}
          <div style={{
            width: "18rem",
            borderRadius: "3rem",
            background: "linear-gradient(160deg,#4a4a4a 0%,#2c2c2c 50%,#1a1a1a 100%)",
            padding: "9px 8px",
            boxShadow: [
              "0 50px 100px rgba(0,0,0,0.55)",
              "0 20px 40px rgba(0,0,0,0.35)",
              "0 0 0 1px rgba(255,255,255,0.13)",
              "0 0 0 2.5px rgba(0,0,0,0.9)",
              "inset 0 1px 0 rgba(255,255,255,0.08)",
            ].join(", "),
          }}>

            {/* Screen */}
            <div style={{ borderRadius: "2.5rem", overflow: "hidden", position: "relative", background: "#000" }}>

              {/* Notch only — no status bar */}
              <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: "7rem", height: "1.5rem",
                background: "#1a1a1a",
                borderRadius: "0 0 1.1rem 1.1rem",
                zIndex: 20,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
              }} aria-hidden>
                <div style={{ width: "2rem", height: "0.18rem", background: "#333", borderRadius: "999px" }} />
                <div style={{ width: "0.4rem", height: "0.4rem", borderRadius: "50%", background: "#222", border: "1px solid #3a3a3a" }} />
              </div>

              {/* Full screen card — starts from very top, notch overlays */}
              <div style={{
                height: "38rem",
                overflowY: "auto",
                overscrollBehavior: "contain",
                scrollbarWidth: "none" as const,
                background: "#fff",
              }}>
                <CardView card={previewCard} preview />
              </div>

              {/* Home indicator */}
              <div style={{ height: "1.4rem", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "5.5rem", height: "0.22rem", background: "#000", borderRadius: "999px", opacity: 0.14 }} />
              </div>

              {/* Glare */}
              <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5, borderRadius: "2.5rem", background: "linear-gradient(135deg,rgba(255,255,255,0.07) 0%,transparent 40%)" }} />
            </div>
          </div>

          {/* Drop shadow */}
          <div aria-hidden style={{ position: "absolute", bottom: "-1rem", left: "50%", transform: "translateX(-50%)", width: "70%", height: "1rem", background: "rgba(0,0,0,0.3)", filter: "blur(14px)", borderRadius: "50%" }} />
        </div>
      </div>
    </div>
  );
}
