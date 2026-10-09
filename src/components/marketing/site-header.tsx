"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { nav } from "@/lib/marketing/content";

export function SiteHeader({ overDark = false }: { overDark?: boolean }) {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  void overDark;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header
      ref={headerRef}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.97)" : "#fff",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(0,0,0,0.08)" : "1px solid transparent",
        transition: "all 0.3s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div
        className="dv-container"
        style={{
          height: scrolled ? "3.75rem" : "4.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          transition: "height 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* Logo */}
        <BrandMark href="/" />

        {/* Desktop nav */}
        <nav aria-label="Main" className="dv-desktop-nav" style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "0.5rem 0.875rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "rgba(0,0,0,0.65)",
                textDecoration: "none",
                borderRadius: "var(--dv-r-sm)",
                transition: "color 0.15s, background 0.15s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#000";
                e.currentTarget.style.background = "rgba(0,0,0,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(0,0,0,0.65)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="dv-desktop-ctas" style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <Link
            href="/login"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "rgba(0,0,0,0.6)",
              textDecoration: "none",
              borderRadius: "var(--dv-r-sm)",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#000";
              e.currentTarget.style.background = "rgba(0,0,0,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(0,0,0,0.6)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.5625rem 1.125rem",
              fontSize: "0.875rem",
              fontWeight: 800,
              color: "#fff",
              background: "#000",
              borderRadius: "var(--dv-r-sm)",
              textDecoration: "none",
              letterSpacing: "0.01em",
              transition: "opacity 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Create Card →
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="dv-mobile-btn"
          style={{
            display: "none",
            background: "rgba(0,0,0,0.08)",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            color: "#000",
            borderRadius: "var(--dv-r-sm)",
            transition: "background 0.15s",
          }}
        >
          {open
            ? <X style={{ width: "1.5rem", height: "1.5rem" }} />
            : <Menu style={{ width: "1.5rem", height: "1.5rem" }} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="mobile-menu"
          style={{
          background: "#fff",
            borderTop: "1px solid rgba(0,0,0,0.1)",
            padding: "1rem 1.5rem 1.5rem",
          }}
        >
          <nav aria-label="Mobile" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  padding: "0.875rem 1rem",
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "#000",
                  textDecoration: "none",
                  borderRadius: "var(--dv-r-sm)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", justifyContent: "center",
                  padding: "0.875rem", fontSize: "0.9375rem", fontWeight: 700,
                  color: "#000", textDecoration: "none",
                  border: "2px solid rgba(0,0,0,0.2)", borderRadius: "var(--dv-r-sm)",
                  transition: "border-color 0.15s",
                }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", justifyContent: "center",
                  padding: "0.875rem", fontSize: "0.9375rem", fontWeight: 800,
                  color: "#fff", background: "#000", textDecoration: "none",
                  borderRadius: "var(--dv-r-sm)",
                }}
              >
                Create Your Card →
              </Link>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .dv-desktop-nav,
          .dv-desktop-ctas { display: none !important; }
          .dv-mobile-btn   { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
