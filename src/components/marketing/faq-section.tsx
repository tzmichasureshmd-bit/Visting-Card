"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/ui/primitives";

const FAQS = [
  { q: "What is a digital visiting card?", a: "A digital visiting card is a mobile-friendly web page with all your contact details, services, social links and more — shareable as a link or QR code. No app needed for the person viewing it." },
  { q: "Can I update my card after publishing?", a: "Yes, anytime. Edit your card from the dashboard and changes go live immediately. Your link and QR code never change." },
  { q: "Can I share it on WhatsApp?", a: "Absolutely. Copy your card link and paste it into any WhatsApp chat. It opens directly in the browser — no app install required." },
  { q: "Can people save my contact from the card?", a: "Yes. Your card includes a Save Contact button that downloads a .vcf file with your name, phone, email, photo and company." },
  { q: "Can I use a QR code?", a: "Every card gets a QR code automatically. Download it from your dashboard and print it on brochures, banners, or packaging." },
  { q: "Can I customise the design?", a: "Yes. Choose from multiple templates, pick your colours and fonts, and toggle sections on or off. Your design can be changed at any time." },
  { q: "Can I create multiple cards?", a: "The Free plan includes one card. Pro and Business plans allow multiple cards — useful for different roles, brands or team members." },
] as const;

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={index * 0.04}>
      <div style={{ borderRadius: "var(--dv-r-md)", border: "1px solid var(--dv-border)", background: "var(--dv-white)", overflow: "hidden", transition: "border-color 0.2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--dv-border-md)")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--dv-border)")}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "1.25rem 1.5rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
          <span style={{ fontSize: "1rem", fontWeight: 600, color: "var(--dv-black)" }}>{q}</span>
          <span style={{ flexShrink: 0, color: "var(--dv-gray-light)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s ease" }} aria-hidden>
            <ChevronDown style={{ width: "1.125rem", height: "1.125rem" }} />
          </span>
        </button>
        <div style={{ maxHeight: open ? "20rem" : 0, overflow: "hidden", transition: "max-height 0.3s cubic-bezier(0.16,1,0.3,1)" }}>
          <p style={{ margin: 0, padding: "0 1.5rem 1.25rem", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.65 }}>{a}</p>
        </div>
      </div>
    </Reveal>
  );
}

export function FaqSection() {
  return (
    <section className="dv-section dv-section-off-white">
      <div className="dv-container" style={{ maxWidth: "52rem" }}>
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Common questions" description="Everything you need to know about DV Card." />
        </Reveal>
        <div style={{ marginTop: "3rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {FAQS.map((faq, i) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
