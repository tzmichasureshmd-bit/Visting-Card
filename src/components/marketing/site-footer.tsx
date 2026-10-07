import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { footer, site } from "@/lib/marketing/content";
import { publicConfig } from "@/lib/public-config";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "var(--dv-white)", borderTop: "1px solid var(--dv-border)" }}>

      {/* Large lime CTA band */}
      <div style={{ background: "var(--dv-lime)", padding: "clamp(3rem, 6vw, 5rem) 0", overflow: "hidden", position: "relative" }}>
        {/* Grid overlay */}
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }} />
        <div className="dv-container" style={{ position: "relative" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "2rem" }}>
            <div>
              <p className="dv-eyebrow" style={{ marginBottom: "0.75rem" }}>Start for free</p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "clamp(1.75rem, 4vw, 3rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  color: "var(--dv-black)",
                  lineHeight: 1,
                }}
              >
                CREATE YOUR<br />DIGITAL CARD TODAY.
              </h2>
            </div>
            <Link href="/signup" className="dv-btn dv-btn-primary dv-btn-lg" style={{ flexShrink: 0 }}>
              Create Your Card
              <ArrowRight style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer body */}
      <div className="dv-container" style={{ paddingTop: "3.5rem", paddingBottom: "2rem" }}>
        <div className="dv-footer-grid" style={{ marginBottom: "3rem" }}>
          {/* Brand column */}
          <div>
            <BrandMark tone="light" href={site.url} />
            <p style={{ marginTop: "1rem", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.65, maxWidth: "28ch" }}>
              {site.tagline}
            </p>
            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--dv-gray)", margin: 0 }}>
                <Mail style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} aria-hidden />
                <a
                  href={`mailto:${publicConfig.supportEmail}`}
                  className="dv-footer-link"
                >
                  {publicConfig.supportEmail}
                </a>
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--dv-gray)", margin: 0 }}>
                <MessageCircle style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} aria-hidden />
                <Link href="/legal/contact" className="dv-footer-link">
                  Contact support
                </Link>
              </p>
            </div>
          </div>

          {/* Nav columns */}
          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="dv-eyebrow" style={{ marginBottom: "1rem" }}>{column.title}</h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {column.links.map((link) => (
                  <li key={`${link.href}-${link.label}`}>
                    <Link href={link.href} className="dv-footer-nav-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "0.5rem", borderTop: "1px solid var(--dv-border)", paddingTop: "1.25rem" }}>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--dv-gray-light)" }}>
            &copy; {year} {site.name}. {footer.note}
          </p>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--dv-gray-light)" }}>
            <a href={publicConfig.appUrl} style={{ color: "var(--dv-gray)", textDecoration: "none" }} rel="nofollow">
              {publicConfig.appUrl.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .dv-footer-grid {
          display: grid;
          grid-template-columns: 1.8fr repeat(3, 1fr);
          gap: 2.5rem;
        }
        @media(max-width:1024px){ .dv-footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media(max-width:640px){  .dv-footer-grid { grid-template-columns: 1fr !important; } }
        .dv-footer-link { color: var(--dv-black); text-decoration: none; transition: opacity 0.15s; }
        .dv-footer-link:hover { opacity: 0.65; }
        .dv-footer-nav-link { font-size: 0.9375rem; color: var(--dv-gray); text-decoration: none; transition: color 0.15s; }
        .dv-footer-nav-link:hover { color: var(--dv-black); }
      `}</style>
    </footer>
  );
}
