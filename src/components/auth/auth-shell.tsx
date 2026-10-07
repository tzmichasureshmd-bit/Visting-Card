import Link from "next/link";

import { AuthCard, AuthStatement } from "@/components/auth/auth-motion";
import { AUTH_IMAGES, AUTH_TAGLINE, type AuthVariant } from "@/lib/auth/images";

export type { AuthVariant };

export interface AuthShellProps {
  variant: AuthVariant;
  children: React.ReactNode;
  showTagline?: boolean;
  isDark: boolean;
}

export function AuthShell({ variant, children, showTagline = true, isDark }: AuthShellProps) {
  void isDark;
  const image = AUTH_IMAGES[variant];
  const split = image.layout === "split";

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--dv-white)" }}>

      {/* Top bar */}
      <header style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
          <span
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "2.125rem", height: "2.125rem", borderRadius: "0.5rem",
              background: "var(--dv-lime)", fontSize: "0.6875rem", fontWeight: 900,
              color: "var(--dv-black)", border: "1.5px solid rgba(0,0,0,0.12)",
            }}
            aria-hidden
          >
            DV
          </span>
          <span
            style={{
              fontSize: "0.9375rem", fontWeight: 800, letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: split ? "var(--dv-black)" : "var(--dv-black)",
            }}
          >
            DV CARD
          </span>
        </Link>
        <Link
          href="/"
          className="dv-auth-back"
          style={{
            fontSize: "0.875rem", fontWeight: 600,
            color: split ? "rgba(0,0,0,0.55)" : "var(--dv-gray)",
            textDecoration: "none", transition: "color 0.15s",
          }}
        >
          ← Back to site
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex" }}>
        {split ? (
          <>
            {/* Left — LIME editorial panel */}
            <div
              style={{
                flex: "0 0 45%",
                background: "var(--dv-lime)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8rem 4rem 4rem",
                position: "relative",
                overflow: "hidden",
              }}
              className="dv-auth-left"
            >
              {/* Grid overlay */}
              <div
                aria-hidden
                style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />
              {/* Large BG text */}
              <div
                aria-hidden
                style={{
                  position: "absolute", bottom: "-1rem", left: 0, right: 0,
                  overflow: "hidden", pointerEvents: "none",
                  paddingInline: "2rem",
                }}
              >
                <span
                  className="dv-display"
                  style={{ fontSize: "clamp(4rem, 12vw, 10rem)", color: "rgba(0,0,0,0.07)", lineHeight: 1, userSelect: "none" }}
                >
                  DV
                </span>
              </div>
              <div style={{ position: "relative", maxWidth: "28rem" }}>
                <AuthStatement image={image} align="left" tagline={showTagline ? AUTH_TAGLINE : undefined} onLime />
              </div>
            </div>

            {/* Right — white form panel */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8rem 4rem 4rem",
                background: "var(--dv-white)",
              }}
            >
              <div style={{ width: "100%", maxWidth: "26rem" }}>
                <AuthCard>{children}</AuthCard>
                <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--dv-gray-light)" }}>
                  <Link href="/legal/privacy" style={{ color: "var(--dv-gray)", textDecoration: "none" }}>Privacy</Link>
                  <span aria-hidden> · </span>
                  <Link href="/legal/terms" style={{ color: "var(--dv-gray)", textDecoration: "none" }}>Terms</Link>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8rem 2rem 4rem",
              background: "var(--dv-off-white)",
            }}
          >
            <div style={{ width: "100%", maxWidth: "26rem" }}>
              <AuthStatement image={image} align="center" tagline={showTagline ? AUTH_TAGLINE : undefined} />
              <div style={{ marginTop: "2rem" }}>
                <AuthCard>{children}</AuthCard>
              </div>
              <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--dv-gray-light)" }}>
                <Link href="/legal/privacy" style={{ color: "var(--dv-gray)", textDecoration: "none" }}>Privacy</Link>
                <span aria-hidden> · </span>
                <Link href="/legal/terms" style={{ color: "var(--dv-gray)", textDecoration: "none" }}>Terms</Link>
              </p>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .dv-auth-back:hover { color: var(--dv-black) !important; }
        @media(max-width:768px){
          .dv-auth-left { display: none !important; }
          main > div:last-child { padding: 6rem 1.5rem 3rem !important; }
        }
      `}</style>
    </div>
  );
}
