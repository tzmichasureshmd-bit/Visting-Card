import Link from "next/link";
import {
  ArrowRight, Briefcase, Check, Clock, Download, Images, MapPin,
  MessageCircle, Phone, QrCode, Share2, ShoppingBag, Star, Wallet, X,
} from "lucide-react";

import { Reveal } from "@/components/marketing/reveal";
import GlassCard from "@/components/ui/glass-card";
import { SectionHeading } from "@/components/ui/primitives";
import {
  audience, designs, finalCta, FEATURED_THEME_NOTES, FEATURED_THEME_SLUGS,
  how, LANDING_PLAN_SLUGS, onCard, pricing, story,
} from "@/lib/marketing/content";
import { MARKETING_IMAGES } from "@/lib/marketing/images";
import type { PlanTier } from "@/lib/marketing/pricing";
import type { ThemeShowcase } from "@/lib/marketing/themes";
import { DesignsGrid } from "@/components/marketing/designs-grid";

const SECTION_ICONS = {
  MessageCircle, Phone, Download, QrCode, Briefcase,
  ShoppingBag, Images, Clock, MapPin, Share2, Wallet, Star,
} as const;

/* â”€â”€ Story â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function StorySection() {
  return (
    <section id="story" className="dv-section dv-section-white">
      <div className="dv-container">
        <div className="dv-story-grid">
          <Reveal>
            <SectionHeading eyebrow={story.eyebrow} title={story.title} description={story.description} align="left" />
            <div style={{ marginTop: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {story.body.map((p) => (
                <p key={p} className="dv-body" style={{ margin: 0 }}>{p}</p>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {story.pillars.map((pillar, i) => (
                <li key={pillar.title} className="dv-pillar-card">
                  <span className="dv-pillar-num" aria-hidden>{i + 1}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--dv-black)" }}>{pillar.title}</h3>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.875rem", color: "var(--dv-gray)", lineHeight: 1.65 }}>{pillar.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <ul style={{ listStyle: "none", padding: 0, margin: "1.25rem 0 0", display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem" }}>
              {story.points.map((point) => (
                <li key={point} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "var(--dv-gray)" }}>
                  <Check style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0, color: "var(--dv-black)" }} aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
      <style>{`
        .dv-story-grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(2rem,5vw,6rem); align-items: start; }
        @media(max-width:768px){ .dv-story-grid { grid-template-columns: 1fr !important; } }
        .dv-pillar-card {
          display: flex; gap: 1.125rem; padding: 1.375rem 1.5rem;
          border: 1px solid var(--dv-border); border-radius: var(--dv-r-md);
          background: var(--dv-off-white);
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .dv-pillar-card:hover {
          border-color: var(--dv-border-md);
          transform: translateY(-3px);
          box-shadow: var(--dv-shadow-md);
        }
        .dv-pillar-num {
          display: flex; align-items: center; justify-content: center;
          width: 2rem; height: 2rem; border-radius: 50%;
          background: var(--dv-lime); font-size: 0.75rem; font-weight: 900; flex-shrink: 0;
        }
      `}</style>
    </section>
  );
}

/* â”€â”€ Audience ticker strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function AudienceStrip() {
  const items = [...audience.items, ...audience.items];
  return (
    <section
      style={{
        background: "var(--dv-black)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "1.5rem 0",
        overflow: "hidden",
      }}
    >
      <div className="dv-ticker-wrap" style={{ display: "flex", overflow: "hidden" }}>
        <div className="dv-ticker-inner" aria-hidden>
          {items.map((item, i) => (
            <span
              key={`${item}-${i}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "1.5rem",
                padding: "0 2rem", fontSize: "0.8125rem", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap",
              }}
            >
              {item}
              <span style={{ width: "0.3125rem", height: "0.3125rem", borderRadius: "50%", background: "var(--dv-lime)", flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>
      <p className="sr-only">{audience.eyebrow}: {audience.items.join(", ")}</p>
      <style>{`
        .dv-ticker-inner {
          display: flex;
          width: max-content;
          animation: dv-ticker 28s linear infinite;
        }
        @keyframes dv-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

/* â”€â”€ Problem â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function ProblemSection() {
  const PAPER_CONS = ["Gets lost or thrown away", "Impossible to update", "Printing costs money", "No analytics or tracking", "No direct action buttons", "Can't share digitally"];
  const DIGITAL_PROS = ["Always in your pocket", "Update anytime, instantly", "Free to start", "See views, clicks & saves", "WhatsApp, Call, Email in one tap", "Share as link or QR code"];

  return (
    <section className="dv-section dv-section-lime">
      <div className="dv-container">
        <Reveal>
          <SectionHeading
            eyebrow="The problem"
            title="Still handing out paper cards?"
            description="Paper cards are printed once and wrong from then on. Your number changes, your role changes â€” the card doesn't."
            align="center"
          />
        </Reveal>
        <div className="dv-problem-grid" style={{ marginTop: "3.5rem" }}>
          <Reveal delay={0.05}>
            <div style={{ padding: "2rem", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "var(--dv-r-lg)", background: "rgba(255,255,255,0.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2.25rem", height: "2.25rem", borderRadius: "var(--dv-r-sm)", background: "rgba(0,0,0,0.08)" }}>
                  <X style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />
                </span>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Paper Visiting Card</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {PAPER_CONS.map((item) => (
                  <li key={item} style={{ fontSize: "0.9375rem", color: "rgba(0,0,0,0.5)", paddingLeft: "1rem", position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: "0.5em", width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "rgba(0,0,0,0.2)" }} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div style={{ padding: "2rem", border: "2px solid rgba(0,0,0,0.18)", borderRadius: "var(--dv-r-lg)", background: "var(--dv-white)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2.25rem", height: "2.25rem", borderRadius: "var(--dv-r-sm)", background: "var(--dv-lime)" }}>
                  <Check style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />
                </span>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>DV Card â€” Digital</h3>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {DIGITAL_PROS.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9375rem", fontWeight: 600 }}>
                    <Check style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0 }} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
      <style>{`
        .dv-problem-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media(max-width:640px){ .dv-problem-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

/* â”€â”€ How it works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function HowSection() {
  return (
    <section id="how" className="dv-section dv-section-white">
      <div className="dv-container">
        <Reveal>
          <SectionHeading eyebrow={how.eyebrow} title={how.title} description={how.description} />
        </Reveal>
        <Reveal delay={0.05}>
          <div style={{ marginTop: "2rem", overflow: "hidden" }}>
            <p className="dv-display" style={{ fontSize: "clamp(2.5rem, 7vw, 7rem)", color: "var(--dv-lime)", lineHeight: 1, margin: 0, userSelect: "none" }} aria-hidden>
              FROM ZERO TO LIVE.
            </p>
          </div>
        </Reveal>
        <ol style={{ listStyle: "none", padding: 0, margin: "3rem 0 0" }} className="dv-how-grid">
          {how.steps.map((step, index) => {
            const image = MARKETING_IMAGES[step.image];
            return (
              <li key={step.title}>
                <Reveal delay={index * 0.08}>
                  <article className="dv-how-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.src} alt="" style={{ width: "100%", height: "10rem", objectFit: "cover", objectPosition: image.position }} loading={index === 0 ? "eager" : "lazy"} />
                    <div style={{ padding: "1.375rem" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.875rem", height: "1.875rem", borderRadius: "50%", background: "var(--dv-lime)", fontSize: "0.75rem", fontWeight: 900 }} aria-hidden>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 style={{ margin: "0.75rem 0 0.375rem", fontSize: "0.9375rem", fontWeight: 700, color: "var(--dv-black)" }}>{step.title}</h3>
                      <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--dv-gray)", lineHeight: 1.65 }}>{step.body}</p>
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ol>
      </div>
      <style>{`
        .dv-how-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.5rem; }
        @media(max-width:1024px){ .dv-how-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:640px){  .dv-how-grid { grid-template-columns: 1fr !important; } }
        .dv-how-card {
          border: 1px solid var(--dv-border); border-radius: var(--dv-r-lg);
          overflow: hidden; background: var(--dv-white);
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .dv-how-card:hover { transform: translateY(-6px); box-shadow: var(--dv-shadow-md); }
      `}</style>
    </section>
  );
}

/* â”€â”€ Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function OnCardSection() {
  return (
    <section id="features" className="dv-section" style={{ background: "var(--dv-off-white)" }}>
      <div className="dv-container">
        <Reveal>
          <SectionHeading eyebrow={onCard.eyebrow} title={onCard.title} description={onCard.description} />
        </Reveal>
        <ul style={{ listStyle: "none", padding: 0, margin: "3rem 0 0" }} className="dv-features-grid">
          {onCard.items.map((item, index) => {
            const Icon = SECTION_ICONS[item.icon as keyof typeof SECTION_ICONS] ?? Star;
            return (
              <li key={item.name}>
                <Reveal delay={(index % 4) * 0.06}>
                  <div className="dv-feature-card">
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "2.25rem", height: "2.25rem", borderRadius: "var(--dv-r-sm)", background: "var(--dv-lime)", marginBottom: "0.875rem" }}>
                      <Icon style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />
                    </span>
                    <h3 style={{ margin: "0 0 0.25rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--dv-black)" }}>{item.name}</h3>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--dv-gray)", lineHeight: 1.55 }}>{item.body}</p>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
      <style>{`
        .dv-features-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
        @media(max-width:1024px){ .dv-features-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media(max-width:768px){  .dv-features-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:480px){  .dv-features-grid { grid-template-columns: 1fr !important; } }
        .dv-feature-card {
          padding: 1.375rem; border: 1px solid var(--dv-border);
          border-radius: var(--dv-r-md); background: var(--dv-white);
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .dv-feature-card:hover {
          border-color: var(--dv-border-md);
          transform: translateY(-3px);
          box-shadow: var(--dv-shadow-sm);
        }
      `}</style>
    </section>
  );
}

/* â”€â”€ Big statement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function BigStatement() {
  return (
    <section className="dv-section dv-section-white" style={{ textAlign: "center", overflow: "hidden" }}>
      <div className="dv-container">
        <Reveal>
          <p className="dv-eyebrow" style={{ marginBottom: "2rem" }}>One card. Every connection.</p>
          <h2 className="dv-display-xl" style={{ margin: "0 auto", color: "var(--dv-black)", maxWidth: "16ch" }}>
            ONE CARD.<br />
            EVERY WAY<br />
            <span style={{ WebkitTextStroke: "2px var(--dv-black)", color: "var(--dv-lime)" }}>TO REACH YOU.</span>
          </h2>
          <p className="dv-body" style={{ maxWidth: "44ch", margin: "2rem auto 0", color: "var(--dv-gray)" }}>
            Your number changes. Your role changes. Your business changes.
            <br />Your digital card changes with you.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* â”€â”€ Designs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function DesignsSection({ themes }: { themes: ThemeShowcase[] }) {
  const byslug = new Map(themes.map((t) => [t.slug, t]));
  const featured = FEATURED_THEME_SLUGS.map((slug) => byslug.get(slug)).filter((t): t is ThemeShowcase => Boolean(t));

  return (
    <section id="designs" className="dv-section dv-section-white">
      <div className="dv-container">
        <Reveal>
          <SectionHeading eyebrow={designs.eyebrow} title={designs.title} description={designs.description} />
        </Reveal>
        <DesignsGrid themes={featured} notes={FEATURED_THEME_NOTES} fallbackCount={themes.length} />
        <Reveal>
          <div style={{ marginTop: "2.5rem", textAlign: "center" }}>
            <Link href={designs.cta.href} className="dv-btn dv-btn-outline">
              {designs.cta.label}
              <ArrowRight style={{ width: "1rem", height: "1rem" }} aria-hidden />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function PricingSection({ tiers }: { tiers: PlanTier[] }) {
  const shown = LANDING_PLAN_SLUGS.map((slug) => {
    const tier = tiers.find((c) => c.slug === slug);
    const plan = pricing.plans[slug];
    if (!tier || !plan) return null;
    const cta = slug === "free"
      ? { label: "Create Your Digital Visiting Card", href: "/signup" }
      : { label: `Choose ${plan.name}`, href: tier.cta.href };
    return { tier, name: plan.name, features: [...plan.features], cta };
  }).filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <section id="pricing" className="dv-section dv-section-lime">
      <div className="dv-container">
        <Reveal>
          <SectionHeading eyebrow={pricing.eyebrow} title={pricing.title} description={pricing.description} />
        </Reveal>
        <ul style={{ listStyle: "none", padding: 0, margin: "3.5rem 0 0", alignItems: "start" }} className="dv-pricing-grid">
          {shown.map(({ tier, name, features, cta }, index) => (
            <li key={tier.slug}>
              <Reveal delay={index * 0.08}>
                <div
                  style={{
                    padding: "2rem",
                    border: tier.highlighted ? "2px solid var(--dv-black)" : "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "var(--dv-r-lg)",
                    background: tier.highlighted ? "var(--dv-black)" : "var(--dv-white)",
                    color: tier.highlighted ? "var(--dv-white)" : "var(--dv-black)",
                    display: "flex", flexDirection: "column",
                    transform: tier.highlighted ? "scale(1.04)" : "none",
                    boxShadow: tier.highlighted ? "var(--dv-shadow-lg)" : "none",
                  }}
                >
                  {tier.highlighted && (
                    <p style={{ fontSize: "0.6875rem", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.75rem", color: "var(--dv-lime)" }}>
                      Most popular
                    </p>
                  )}
                  <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>{name}</h3>
                  <p style={{ margin: "0.25rem 0 1.25rem", fontSize: "0.875rem", opacity: 0.6 }}>{tier.tagline}</p>
                  <p style={{ margin: "0 0 1.5rem", display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                    <span style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{tier.price}</span>
                    {tier.period && <span style={{ fontSize: "0.875rem", opacity: 0.55 }}>{tier.period}</span>}
                  </p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>
                    {features.map((feature) => (
                      <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.9375rem", opacity: 0.8 }}>
                        <Check style={{ width: "1rem", height: "1rem", flexShrink: 0, marginTop: "0.125rem", color: tier.highlighted ? "var(--dv-lime)" : "var(--dv-black)" }} aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={cta.href}
                    className="dv-btn"
                    style={{
                      justifyContent: "center",
                      background: tier.highlighted ? "var(--dv-lime)" : "var(--dv-black)",
                      color: tier.highlighted ? "var(--dv-black)" : "var(--dv-white)",
                      padding: "0.9375rem",
                    }}
                  >
                    {cta.label}
                  </Link>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: "1.75rem", textAlign: "center", fontSize: "0.875rem", color: "rgba(0,0,0,0.45)" }}>{pricing.footnote}</p>
      </div>
      <style>{`
        .dv-pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
        @media(max-width:768px){ .dv-pricing-grid { grid-template-columns: 1fr !important; } .dv-pricing-grid li>div { transform: none !important; } }
      `}</style>
    </section>
  );
}


export { FaqSection } from '@/components/marketing/faq-section';

export function GlassCardsSection() {
  const cards = [
    {
      title: "One Link. Everything.",
      subtitle: "Share anywhere",
      description: "WhatsApp, email, QR code â€” one link works everywhere. No app needed on the other end.",
    },
    {
      title: "Updates Instantly.",
      subtitle: "Always current",
      description: "Change your number, role or company. Your card updates live â€” no reprinting, no cost.",
    },
    {
      title: "Real Analytics.",
      subtitle: "Know your reach",
      description: "See who viewed your card, where they came from, and what they tapped.",
    },
    {
      title: "Free to Start.",
      subtitle: "No credit card",
      description: "Create your first Digital Visiting Card in two minutes. Free forever, upgrade when ready.",
    },
  ];

  return (
    <section className="dv-section dv-section-off-white">
      <div className="dv-container">
        <Reveal>
          <SectionHeading
            eyebrow="Why DV Card"
            title="Built for the way business actually works."
            description="Everything you need to share yourself professionally â€” in one link."
          />
        </Reveal>
        <div className="dv-glass-grid" style={{ marginTop: "3rem" }}>
          {cards.map((card, i) => (
            <Reveal key={card.title} delay={i * 0.08}>
              <GlassCard
                title={card.title}
                subtitle={card.subtitle}
                description={card.description}
                enableTilt
                style={{ width: "100%", height: "100%" }}
              />
            </Reveal>
          ))}
        </div>
      </div>
      <style>{`
        .dv-glass-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1024px) { .dv-glass-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 540px)  { .dv-glass-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}

/* ── Final CTA ──────────────────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <section className="dv-section dv-section-white" style={{ textAlign: "center" }}>
      <div className="dv-container">
        <Reveal>
          <h2 className="dv-display" style={{ margin: "0 auto", maxWidth: "22ch" }}>{finalCta.title}</h2>
          <p className="dv-body" style={{ maxWidth: "48ch", margin: "1.25rem auto 2.5rem", color: "var(--dv-gray)" }}>{finalCta.body}</p>
          <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={finalCta.primary.href} className="dv-btn dv-btn-primary">{finalCta.primary.label}</Link>
            <Link href={finalCta.secondary.href} className="dv-btn dv-btn-outline">{finalCta.secondary.label}</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
