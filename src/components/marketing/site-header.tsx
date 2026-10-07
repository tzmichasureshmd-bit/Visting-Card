"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { nav } from "@/lib/marketing/content";

export function SiteHeader({ overDark = false }: { overDark?: boolean }) {
  const [open, setOpen]       = useState(false);
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
      className={`dv-navbar${scrolled ? " scrolled" : ""}`}
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
                fontWeight: 600,
                color: "var(--dv-gray)",
                textDecoration: "none",
                borderRadius: "var(--dv-r-sm)",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--dv-black)";
                e.currentTarget.style.background = "var(--dv-off-white)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--dv-gray)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="dv-desktop-ctas" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link
            href="/login"
            style={{
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--dv-gray)",
              textDecoration: "none",
              borderRadius: "var(--dv-r-sm)",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--dv-black)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--dv-gray)")}
          >
            Sign in
          </Link>
          <Link href="/signup" className="dv-btn dv-btn-primary dv-btn-sm">
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
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0.5rem",
            color: "var(--dv-black)",
            borderRadius: "var(--dv-r-sm)",
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
            background: "var(--dv-white)",
            borderTop: "1px solid var(--dv-border)",
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
                  fontWeight: 600,
                  color: "var(--dv-black)",
                  textDecoration: "none",
                  borderRadius: "var(--dv-r-sm)",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--dv-off-white)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {item.label}
              </Link>
            ))}
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--dv-border)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link href="/login" onClick={() => setOpen(false)} className="dv-btn dv-btn-outline" style={{ justifyContent: "center" }}>
                Sign in
              </Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="dv-btn dv-btn-primary" style={{ justifyContent: "center" }}>
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
