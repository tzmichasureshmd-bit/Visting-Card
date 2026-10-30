"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

import TypewriterText from "@/components/ui/typewriter-text";
import { CardPreview } from "@/components/marketing/card-preview";
import { hero } from "@/lib/marketing/content";
import { publicConfig } from "@/lib/public-config";
import type { ThemeShowcase } from "@/lib/marketing/themes";

export function Hero({ themes }: { themes: ThemeShowcase[] }) {
  const demoUrl = `${publicConfig.appUrl}/demo`;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const eyebrowRef = useRef<HTMLDivElement>(null);
  const line1Ref   = useRef<HTMLDivElement>(null);
  const line2Ref   = useRef<HTMLDivElement>(null);
  const line3Ref   = useRef<HTMLDivElement>(null);
  const subRef     = useRef<HTMLDivElement>(null);
  const ctaRef     = useRef<HTMLDivElement>(null);
  const phoneRef   = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const heroRef    = useRef<HTMLElement>(null);

  /* ── GSAP entrance ─────────────────────────────────────────── */
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    async function animate() {
      try {
        const gsapModule = await import("gsap");
        const gsap = (gsapModule as unknown as { gsap?: typeof import("gsap")["default"] }).gsap ?? gsapModule.default;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const els = [eyebrowRef.current, line1Ref.current, line2Ref.current, line3Ref.current, subRef.current, ctaRef.current];
        gsap.set(els, { opacity: 0, y: 48 });
        gsap.set(phoneRef.current, { opacity: 0, y: 80, scale: 0.92, rotateX: 8 });
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.to(eyebrowRef.current, { opacity: 1, y: 0, duration: 0.6, delay: 0.1 })
          .to(line1Ref.current,   { opacity: 1, y: 0, duration: 0.7 }, "-=0.35")
          .to(line2Ref.current,   { opacity: 1, y: 0, duration: 0.7 }, "-=0.55")
          .to(line3Ref.current,   { opacity: 1, y: 0, duration: 0.7 }, "-=0.55")
          .to(subRef.current,     { opacity: 1, y: 0, duration: 0.6 }, "-=0.4")
          .to(ctaRef.current,     { opacity: 1, y: 0, duration: 0.6 }, "-=0.45")
          .to(phoneRef.current,   { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 1.1, ease: "power4.out" }, "-=0.7");
        cleanup = () => tl.kill();
      } catch { /* GSAP unavailable */ }
    }
    animate();
    return () => cleanup?.();
  }, []);

  /* ── Three.js tilt ─────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    const phone  = phoneRef.current;
    if (!canvas || !phone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    let animId: number;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let cleanup: (() => void) | undefined;
    async function initThree() {
      try {
        const three = await import("three");
        const { Scene, PerspectiveCamera, WebGLRenderer, DirectionalLight, AmbientLight, PlaneGeometry, MeshStandardMaterial, Mesh, Color } = three;
        const w = canvas!.offsetWidth || 320;
        const h = canvas!.offsetHeight || 560;
        const renderer = new WebGLRenderer({ canvas: canvas!, alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        const scene = new Scene();
        const camera = new PerspectiveCamera(35, w / h, 0.1, 100);
        camera.position.z = 5;
        scene.add(new AmbientLight(0xffffff, 0.6));
        const dir = new DirectionalLight(0xffffff, 0.8);
        dir.position.set(2, 3, 4);
        scene.add(dir);
        const geo = new PlaneGeometry(2.2, 3.8, 1, 1);
        const mat = new MeshStandardMaterial({ color: new Color(0xC7FF2F), roughness: 0.3, metalness: 0.1 });
        scene.add(new Mesh(geo, mat));
        const onMove = (e: PointerEvent) => {
          const rect = phone!.getBoundingClientRect();
          targetX = ((e.clientX - rect.left) / rect.width  - 0.5) * 0.3;
          targetY = ((e.clientY - rect.top)  / rect.height - 0.5) * 0.3;
        };
        const onLeave = () => { targetX = 0; targetY = 0; };
        phone!.addEventListener("pointermove", onMove, { passive: true });
        phone!.addEventListener("pointerleave", onLeave);
        const tick = () => {
          animId = requestAnimationFrame(tick);
          currentX += (targetX - currentX) * 0.08;
          currentY += (targetY - currentY) * 0.08;
          phone!.style.transform = `perspective(1200px) rotateY(${currentX * 18}deg) rotateX(${-currentY * 12}deg)`;
          renderer.render(scene, camera);
        };
        tick();
        cleanup = () => {
          cancelAnimationFrame(animId);
          phone!.removeEventListener("pointermove", onMove);
          phone!.removeEventListener("pointerleave", onLeave);
          renderer.dispose(); geo.dispose(); mat.dispose();
        };
      } catch { /* Three.js unavailable */ }
    }
    initThree();
    return () => cleanup?.();
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const handleMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      setMousePos({
        x: (clientX / innerWidth - 0.5) * 20,
        y: (clientY / innerHeight - 0.5) * 20
      });
    };
    hero.addEventListener('mousemove', handleMove);
    return () => hero.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <section 
      ref={heroRef}
      style={{ 
        background: "linear-gradient(135deg, #84cc16 0%, #a3e635 50%, #84cc16 100%)",
        overflow: "hidden", 
        position: "relative", 
        minHeight: "100dvh", 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center" 
      }}
    >
      {/* Animated gradient orbs - BIGGER & MORE VISIBLE */}
      <motion.div 
        aria-hidden
        animate={{
          x: mousePos.x * 3,
          y: mousePos.y * 3,
          scale: [1, 1.3, 1],
        }}
        transition={{ 
          type: "spring", 
          stiffness: 30, 
          damping: 20,
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ 
          position: "absolute", 
          top: "-10%", 
          left: "-5%", 
          width: "800px", 
          height: "800px",
          background: "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)",
          borderRadius: "50%",
          filter: "blur(120px)",
          pointerEvents: "none"
        }} 
      />
      <motion.div 
        aria-hidden
        animate={{
          x: mousePos.x * -2,
          y: mousePos.y * -2,
          scale: [1.2, 1, 1.2],
        }}
        transition={{ 
          type: "spring", 
          stiffness: 30, 
          damping: 20,
          scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ 
          position: "absolute", 
          bottom: "-15%", 
          right: "-10%", 
          width: "900px", 
          height: "900px",
          background: "radial-gradient(circle, rgba(0,0,0,0.15) 0%, transparent 60%)",
          borderRadius: "50%",
          filter: "blur(140px)",
          pointerEvents: "none"
        }} 
      />

      {/* Floating particles */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: `${Math.random() * 100}%`,
              y: `${Math.random() * 100}%`,
              scale: 0 
            }}
            animate={{ 
              y: [`${Math.random() * 100}%`, `${Math.random() * 80}%`],
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeOut"
            }}
            style={{
              position: "absolute",
              width: "4px",
              height: "4px",
              background: "rgba(255,255,255,0.8)",
              borderRadius: "50%",
            }}
          />
        ))}
      </div>

      <div className="dv-container" style={{ paddingTop: "clamp(2.5rem, 6vw, 8rem)", paddingBottom: "clamp(2.5rem, 5vw, 6rem)", position: "relative" }}>
        <div className="dv-hero-grid">

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", zIndex: 1 }}>
            <motion.div 
              ref={eyebrowRef} 
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, type: "spring", bounce: 0.4 }}
              style={{ marginBottom: "2rem" }}
            >
              <motion.span 
                whileHover={{ scale: 1.05 }}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", padding: "0.5rem 1.25rem", background: "rgba(255,255,255,0.35)", backdropFilter: "blur(10px)", borderRadius: "999px", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(0,0,0,0.9)", border: "2px solid rgba(255,255,255,0.5)", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles style={{ width: "1rem", height: "1rem" }} aria-hidden />
                </motion.div>
                {hero.eyebrow}
              </motion.span>
            </motion.div>

            <h1 style={{ margin: 0 }}>
              <motion.div 
                ref={line1Ref} 
                initial={{ opacity: 0, x: -100, rotateX: 45 }}
                animate={{ opacity: 1, x: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.3, type: "spring", stiffness: 80 }}
                whileHover={{ scale: 1.02, x: 10, transition: { duration: 0.2 } }}
                className="dv-display-xl" 
                style={{ 
                  color: "#000", 
                  display: "block",
                  textShadow: "0 4px 30px rgba(0,0,0,0.15)",
                  cursor: "default"
                }}
              >
                YOUR
              </motion.div>
              <motion.div 
                ref={line2Ref}
                initial={{ opacity: 0, x: -100, rotateX: 45 }}
                animate={{ opacity: 1, x: 0, rotateX: 0 }}
                transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 80 }}
                whileHover={{ scale: 1.02, x: 10, transition: { duration: 0.2 } }}
                className="dv-display-xl" 
                style={{ 
                  color: "#000", 
                  display: "block",
                  textShadow: "0 4px 30px rgba(0,0,0,0.15)",
                  cursor: "default"
                }}
              >
                DIGITAL
              </motion.div>
              {/* Typewriter line */}
              <motion.div 
                ref={line3Ref}
                initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.8, delay: 0.7, type: "spring", stiffness: 100 }}
                className="dv-display-xl" 
                style={{ 
                  display: "block", 
                  fontStyle: "italic", 
                  fontWeight: 400, 
                  textTransform: "none", 
                  letterSpacing: "-0.03em", 
                  color: "#fff",
                  textShadow: "0 4px 40px rgba(0,0,0,0.3), 0 2px 10px rgba(132,204,22,0.5)",
                  background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.85) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  position: "relative"
                }}
              >
                <TypewriterText
                  texts={["Identity.", "Visiting Card.", "Brand.", "Presence.", "Story."]}
                  typeSpeed={65}
                  eraseSpeed={35}
                  pauseAfter={1800}
                  enhance
                />
              </motion.div>
            </h1>

            <motion.div 
              ref={subRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              style={{ marginTop: "2rem", maxWidth: "44ch" }}
            >
              <p className="dv-body" style={{ margin: 0, color: "rgba(0,0,0,0.75)", fontSize: "1.125rem", lineHeight: 1.7, fontWeight: 500 }}>
                {hero.subheadline}
              </p>
            </motion.div>

            <motion.div 
              ref={ctaRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }} 
              className="dv-hero-cta"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href={hero.primaryCta.href} 
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem 2rem",
                    background: "#000",
                    color: "#84cc16",
                    fontSize: "1rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    borderRadius: "50px",
                    transition: "all 0.3s",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                  }}
                  className="hero-primary-btn"
                >
                  Create Your Card
                  <ArrowRight style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  href={hero.secondaryCta.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1rem 2rem",
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    color: "#000",
                    fontSize: "1rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    border: "2px solid rgba(0,0,0,0.2)",
                    borderRadius: "50px",
                    transition: "all 0.3s",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                  className="hero-secondary-btn"
                >
                  Explore Designs
                </Link>
              </motion.div>
            </motion.div>

            <motion.ul 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 }}
              style={{ marginTop: "2rem", listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "1.5rem" }} 
              className="dv-hero-proof"
            >
              {hero.proof.map((item, idx) => (
                <motion.li 
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.1 + idx * 0.1 }}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "rgba(0,0,0,0.7)" }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#000", flexShrink: 0 }} aria-hidden />
                  {item}
                </motion.li>
              ))}
            </motion.ul>
          </div>

          {/* RIGHT — phone with DRAMATIC 3D effect */}
          <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: "clamp(0rem, 3vw, 3rem)" }}>
            <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0, width: "100%", height: "100%" }} />
            <motion.div 
              ref={phoneRef}
              initial={{ opacity: 0, y: 150, rotateX: 30, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.6, type: "spring", stiffness: 60 }}
              whileHover={{ 
                scale: 1.08,
                rotateY: 8,
                rotateX: -5,
                transition: { duration: 0.4, type: "spring", stiffness: 300 }
              }}
              style={{ 
                width: "clamp(260px, 32vw, 340px)", 
                position: "relative",
                filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.4))",
                transformStyle: "preserve-3d",
                perspective: "1200px"
              }}
            >
              {/* Multiple glow layers for more effect */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ 
                  position: "absolute",
                  inset: "-30px",
                  background: "radial-gradient(circle, rgba(132,204,22,0.4) 0%, transparent 70%)",
                  borderRadius: "50%",
                  filter: "blur(50px)",
                  zIndex: -1
                }} 
              />
              <motion.div 
                animate={{ 
                  scale: [1.1, 1, 1.1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ 
                  position: "absolute",
                  inset: "-40px",
                  background: "radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)",
                  borderRadius: "50%",
                  filter: "blur(60px)",
                  zIndex: -2
                }} 
              />
              <CardPreview themes={themes} qrValue={demoUrl} tone="light" />
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .dv-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(2rem, 5vw, 5rem);
          align-items: center;
        }
        @media (max-width: 900px) {
          .dv-hero-grid {
            grid-template-columns: 1fr;
            gap: 3rem;
            text-align: center;
          }
          .dv-hero-cta   { justify-content: center !important; }
          .dv-hero-proof { justify-content: center !important; }
        }
        .hero-primary-btn:hover {
          background: #111 !important;
          box-shadow: 0 15px 40px rgba(0,0,0,0.3) !important;
          transform: translateY(-2px);
        }
        .hero-secondary-btn:hover {
          background: rgba(255,255,255,0.35) !important;
          border-color: rgba(0,0,0,0.3) !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }
      `}</style>
    </section>
  );
}
