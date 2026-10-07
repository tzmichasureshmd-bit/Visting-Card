"use client";

import type { AuthImage } from "@/lib/auth/images";

export function AuthBackground({ image }: { image: AuthImage }) {
  void image;
  return null;
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--dv-white)",
      border: "1px solid var(--dv-border)",
      borderRadius: "var(--dv-r-lg)",
      padding: "2.5rem",
      boxShadow: "var(--dv-shadow-md)",
    }}>
      {children}
    </div>
  );
}

export function AuthStatement({ image, align, tagline, onLime }: {
  image: AuthImage;
  align: "left" | "center";
  tagline?: string;
  onLime?: boolean;
}) {
  const textColor = onLime ? "var(--dv-black)" : "var(--dv-black)";
  const mutedColor = onLime ? "rgba(0,0,0,0.6)" : "var(--dv-gray)";

  return (
    <div style={{ textAlign: align === "center" ? "center" : "left" }}>
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: mutedColor, marginBottom: "1.25rem" }}>
        {image.index}
      </p>
      <p style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.04em", textTransform: "uppercase", color: textColor, marginBottom: "1.25rem" }}>
        {image.lead}
        <span style={{ display: "block", fontStyle: "italic", fontWeight: 300, textTransform: "none", letterSpacing: "-0.02em" }}>{image.emphasis}</span>
        {image.rest}
      </p>
      <p style={{ fontSize: "1rem", color: mutedColor, lineHeight: 1.65, maxWidth: "36ch", margin: align === "center" ? "0 auto" : "0" }}>
        {image.sub}
      </p>
      {tagline ? (
        <p style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: `1px solid ${onLime ? "rgba(0,0,0,0.15)" : "var(--dv-border)"}`, fontSize: "0.875rem", color: mutedColor, maxWidth: "36ch", margin: align === "center" ? "1.5rem auto 0" : "1.5rem 0 0" }}>
          {tagline}
        </p>
      ) : null}
    </div>
  );
}
