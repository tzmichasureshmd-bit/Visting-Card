import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

import { BrandMark } from "@/components/marketing/brand-mark";
import { footer, site } from "@/lib/marketing/content";
import { publicConfig } from "@/lib/public-config";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background: "var(--dv-white)" }}>
      {/* Hero CTA Section */}
      <div 
        style={{ 
          background: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
          padding: "clamp(4rem, 10vw, 8rem) 0",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Decorative pattern overlay */}
        <div 
          aria-hidden 
          style={{ 
            position: "absolute", 
            inset: 0, 
            backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
            pointerEvents: "none" 
          }} 
        />
        
        <div className="dv-container" style={{ position: "relative", textAlign: "center" }}>
          <h2
            style={{
              margin: "0 0 1rem 0",
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "white",
              lineHeight: 1.1,
              textTransform: "uppercase",
            }}
          >
            Let&apos;s get you<br />connected
          </h2>
          <p style={{ 
            fontSize: "clamp(1rem, 2vw, 1.25rem)", 
            color: "rgba(255,255,255,0.95)", 
            marginBottom: "2.5rem",
            maxWidth: "600px",
            margin: "0 auto 2.5rem auto",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontWeight: 600
          }}>
            Create your card. Share everywhere. Get contacted instantly.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link 
              href="/signup" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 2.5rem",
                background: "white",
                color: "#65a30d",
                fontSize: "1rem",
                fontWeight: 700,
                textDecoration: "none",
                borderRadius: "50px",
                transition: "transform 0.2s, box-shadow 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
              className="footer-cta-btn"
            >
              Create Your Card
            </Link>
            <Link 
              href="/templates" 
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 2.5rem",
                background: "transparent",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                textDecoration: "none",
                border: "2px solid white",
                borderRadius: "50px",
                transition: "all 0.2s",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
              className="footer-cta-btn-outline"
            >
              View Designs
            </Link>
          </div>
        </div>
      </div>

      {/* Minimal Footer Info */}
      <div style={{ 
        background: "#fafafa", 
        borderTop: "1px solid #e5e5e5",
        padding: "3rem 0"
      }}>
        <div className="dv-container">
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
            gap: "3rem",
            alignItems: "center",
            textAlign: "center"
          }}>
            {/* Contact Info */}
            <div>
              <p style={{ 
                margin: 0, 
                fontSize: "0.875rem", 
                color: "#666",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem"
              }}>
                Support
              </p>
              <a
                href={`mailto:${publicConfig.supportEmail}`}
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#000",
                  textDecoration: "none",
                  transition: "color 0.2s"
                }}
                className="footer-email"
              >
                {publicConfig.supportEmail}
              </a>
            </div>

            {/* Logo */}
            <div>
              <BrandMark tone="light" href={site.url} />
              <p style={{ 
                margin: "0.75rem 0 0 0", 
                fontSize: "0.875rem", 
                color: "#666"
              }}>
                Professional Digital Cards
              </p>
            </div>

            {/* Website Credit */}
            <div>
              <p style={{ 
                margin: 0, 
                fontSize: "0.75rem", 
                color: "#999",
                textTransform: "uppercase",
                letterSpacing: "0.1em"
              }}>
                &copy; {year} {site.name}
              </p>
              <p style={{ 
                margin: "0.5rem 0 0 0", 
                fontSize: "0.75rem", 
                color: "#999"
              }}>
                <Link href="/legal/privacy" style={{ color: "#999", textDecoration: "none" }}>Privacy</Link>
                {" · "}
                <Link href="/legal/terms" style={{ color: "#999", textDecoration: "none" }}>Terms</Link>
                {" · "}
                <Link href="/legal/contact" style={{ color: "#999", textDecoration: "none" }}>Contact</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .footer-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .footer-cta-btn-outline:hover {
          background: white;
          color: #65a30d;
        }
        .footer-email:hover {
          color: #84cc16;
        }
      `}</style>
    </footer>
  );
}
