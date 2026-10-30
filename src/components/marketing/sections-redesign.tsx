"use client";

import Link from "next/link";
import { ArrowRight, Check, X, Sparkles, Zap, TrendingUp } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

import { SectionHeading } from "@/components/ui/primitives";
import { story, how, onCard, pricing, LANDING_PLAN_SLUGS } from "@/lib/marketing/content";
import type { PlanTier } from "@/lib/marketing/pricing";

// Animated reveal wrapper
function AnimatedSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 100 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── STORY SECTION - Northeast Tomato Style ────────────────────────────── */
export function StorySection() {
  return (
    <section id="story" style={{ 
      padding: "clamp(4rem, 10vw, 8rem) 0",
      background: "#fafafa"
    }}>
      <div className="dv-container">
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "clamp(3rem, 6vw, 6rem)",
          alignItems: "center"
        }}>
          {/* LEFT - Bold statement */}
          <AnimatedSection>
            <div>
              <motion.p 
                style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: 800, 
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "#84cc16",
                  marginBottom: "1.5rem"
                }}
              >
                {story.eyebrow}
              </motion.p>
              <motion.h2
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.5rem)",
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  marginBottom: "1.5rem",
                  textTransform: "uppercase"
                }}
              >
                ONE CARD.
                <br />
                <span style={{ 
                  background: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  UNLIMITED
                </span>
                <br />
                UPDATES.
              </motion.h2>
              <motion.p style={{ 
                fontSize: "1.125rem", 
                lineHeight: 1.7,
                color: "#666",
                marginBottom: "2rem",
                fontWeight: 500
              }}>
                {story.description}
              </motion.p>
              
              {/* Animated pillars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {story.pillars.map((pillar, i) => (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.15 }}
                    whileHover={{ x: 10, transition: { duration: 0.2 } }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      padding: "1.25rem",
                      background: "white",
                      borderRadius: "16px",
                      border: "1px solid #e5e5e5",
                      cursor: "pointer",
                      transition: "box-shadow 0.3s"
                    }}
                    className="story-pillar-card"
                  >
                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#84cc16",
                      fontSize: "1rem",
                      fontWeight: 900,
                      flexShrink: 0,
                      color: "#000"
                    }}>
                      {i + 1}
                    </span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{pillar.title}</h3>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.9375rem", color: "#666", lineHeight: 1.6 }}>{pillar.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          {/* RIGHT - Large visual text */}
          <AnimatedSection delay={0.2}>
            <div style={{ position: "relative" }}>
              <motion.div
                animate={{ 
                  y: [0, -20, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{
                  fontSize: "clamp(4rem, 12vw, 12rem)",
                  fontWeight: 900,
                  lineHeight: 0.9,
                  color: "#84cc16",
                  opacity: 0.1,
                  textTransform: "uppercase",
                  textAlign: "center",
                  userSelect: "none"
                }}
              >
                DV<br/>CARD
              </motion.div>
              
              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                style={{
                  position: "absolute",
                  top: "20%",
                  right: "10%",
                  padding: "1.5rem",
                  background: "white",
                  borderRadius: "20px",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                  minWidth: "180px"
                }}
              >
                <Zap style={{ width: "2rem", height: "2rem", color: "#84cc16", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900 }}>2min</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#666" }}>To create & share</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                style={{
                  position: "absolute",
                  bottom: "25%",
                  left: "5%",
                  padding: "1.5rem",
                  background: "#84cc16",
                  borderRadius: "20px",
                  boxShadow: "0 20px 50px rgba(132,204,22,0.3)",
                  minWidth: "180px"
                }}
              >
                <TrendingUp style={{ width: "2rem", height: "2rem", color: "#000", marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#000" }}>∞</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "rgba(0,0,0,0.7)" }}>Unlimited updates</p>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <style>{`
        .story-pillar-card:hover {
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        @media (max-width: 900px) {
          .dv-container > div {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ── PROBLEM COMPARISON - Bold Cards ──────────────────────────────────── */
export function ProblemSection() {
  const PAPER_CONS = ["Gets lost or thrown away", "Impossible to update", "Printing costs money", "No analytics", "Can't share digitally"];
  const DIGITAL_PROS = ["Always in pocket", "Update instantly", "Free forever", "See views & clicks", "Share anywhere"];

  return (
    <section style={{ 
      padding: "clamp(4rem, 10vw, 8rem) 0",
      background: "linear-gradient(180deg, #fff 0%, #fafafa 100%)"
    }}>
      <div className="dv-container">
        <AnimatedSection>
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2 style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 900,
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: "1rem"
            }}>
              PAPER VS DIGITAL
            </h2>
            <p style={{ fontSize: "1.125rem", color: "#666", maxWidth: "600px", margin: "0 auto" }}>
              One is stuck in the past. The other evolves with you.
            </p>
          </div>
        </AnimatedSection>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "2rem",
          maxWidth: "1000px",
          margin: "0 auto"
        }}>
          {/* Paper Card */}
          <AnimatedSection delay={0.1}>
            <motion.div
              whileHover={{ y: -10 }}
              style={{
                padding: "2.5rem",
                background: "#f5f5f5",
                borderRadius: "24px",
                border: "2px solid #e5e5e5",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ 
                position: "absolute",
                top: 0,
                right: 0,
                width: "100px",
                height: "100px",
                background: "rgba(239, 68, 68, 0.1)",
                borderRadius: "50%",
                filter: "blur(40px)"
              }} />
              
              <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <X style={{ width: "24px", height: "24px", color: "#ef4444" }} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Paper Card</h3>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {PAPER_CONS.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.75rem",
                      fontSize: "0.9375rem",
                      color: "#666"
                    }}
                  >
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#ef4444",
                      flexShrink: 0
                    }} />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatedSection>

          {/* Digital Card */}
          <AnimatedSection delay={0.2}>
            <motion.div
              whileHover={{ y: -10, scale: 1.02 }}
              style={{
                padding: "2.5rem",
                background: "linear-gradient(135deg, #84cc16 0%, #65a30d 100%)",
                borderRadius: "24px",
                border: "3px solid #000",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 25px 50px rgba(132, 204, 22, 0.3)"
              }}
            >
              <div style={{ 
                position: "absolute",
                top: "-50px",
                right: "-50px",
                width: "150px",
                height: "150px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                filter: "blur(40px)"
              }} />
              
              <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Sparkles style={{ width: "24px", height: "24px", color: "#84cc16" }} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#000" }}>Digital Card</h3>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {DIGITAL_PROS.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + 0.2 }}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.75rem",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#000"
                    }}
                  >
                    <Check style={{ width: "20px", height: "20px", flexShrink: 0 }} />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .dv-container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ── CTA BANNER - Northeast Tomato Style ──────────────────────────────── */
export function CtaBanner() {
  return (
    <section style={{
      padding: "clamp(5rem, 12vw, 10rem) 0",
      background: "linear-gradient(135deg, #84cc16 0%, #a3e635 100%)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated background circles */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
          borderRadius: "50%"
        }}
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-5%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(0,0,0,0.1) 0%, transparent 70%)",
          borderRadius: "50%"
        }}
      />

      <div className="dv-container" style={{ position: "relative", textAlign: "center" }}>
        <AnimatedSection>
          <motion.h2
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              textTransform: "uppercase",
              marginBottom: "1.5rem",
              color: "#000",
              textShadow: "0 2px 20px rgba(0,0,0,0.1)"
            }}
          >
            READY TO GO
            <br />
            <span style={{ fontStyle: "italic", fontWeight: 300 }}>digital?</span>
          </motion.h2>
          <motion.p
            style={{
              fontSize: "1.25rem",
              color: "rgba(0,0,0,0.75)",
              maxWidth: "600px",
              margin: "0 auto 3rem auto",
              fontWeight: 600,
              letterSpacing: "0.02em"
            }}
          >
            Create your professional digital visiting card in 2 minutes. Free forever.
          </motion.p>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.25rem 3rem",
                background: "#000",
                color: "#84cc16",
                fontSize: "1.125rem",
                fontWeight: 800,
                textDecoration: "none",
                borderRadius: "60px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                transition: "all 0.3s"
              }}
              className="cta-button"
            >
              Create Your Card Now
              <ArrowRight style={{ width: "24px", height: "24px" }} />
            </Link>
          </motion.div>
        </AnimatedSection>
      </div>

      <style>{`
        .cta-button:hover {
          box-shadow: 0 25px 70px rgba(0,0,0,0.4) !important;
        }
      `}</style>
    </section>
  );
}

export { StorySection, ProblemSection, CtaBanner };
