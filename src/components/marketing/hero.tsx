"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

import TypewriterText from "@/components/ui/typewriter-text";
import { CardPreview } from "@/components/marketing/card-preview";
import { hero } from "@/lib/marketing/content";
import { publicConfig } from "@/lib/public-config";
import type { ThemeShowcase } from "@/lib/marketing/themes";

export function Hero({ themes }: { themes: ThemeShowcase[] }) {
  const demoUrl = `${publicConfig.appUrl}/demo`;

  const eyebrowRef = useRef<HTMLDivElement>(null);
  const line1Ref   = useRef<HTMLDivElement>(null);
  const line2Ref   = useRef<HTMLDivElement>(null);
  const line3Ref   = useRef<HTMLDivElement>(null);
  const subRef     = useRef<HTMLDivElement>(null);
  const ctaRef     = useRef<HTMLDivElement>(null);
  const phoneRef   = useRef<HTMLDivElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

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

  return (
    <section style={{ background: "var(--dv-lime)", overflow: "hidden", position: "relative", minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {/* Grid overlay */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)", backgroundSize: "100px 100px" }} />

      {/* BG text */}
      <div aria-hidden style={{ position: "absolute", bottom: "-2rem", left: 0, right: 0, overflow: "hidden", pointerEvents: "none", display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingInline: "clamp(1.25rem, 5vw, 5rem)" }}>
        <span className="dv-display" style={{ fontSize: "clamp(5rem, 18vw, 18rem)", color: "rgba(0,0,0,0.06)", lineHeight: 1, userSelect: "none" }}>DV</span>
        <span className="dv-display" style={{ fontSize: "clamp(5rem, 18vw, 18rem)", color: "rgba(0,0,0,0.06)", lineHeight: 1, userSelect: "none" }}>CARD</span>
      </div>

      <div className="dv-container" style={{ paddingTop: "clamp(2.5rem, 6vw, 8rem)", paddingBottom: "clamp(2.5rem, 5vw, 6rem)", position: "relative" }}>
        <div className="dv-hero-grid">

          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div ref={eyebrowRef} style={{ marginBottom: "2rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem", padding: "0.375rem 0.875rem", background: "rgba(0,0,0,0.08)", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(0,0,0,0.65)" }}>
                <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "var(--dv-black)", flexShrink: 0 }} aria-hidden />
                {hero.eyebrow}
              </span>
            </div>

            <h1 style={{ margin: 0 }}>
              <div ref={line1Ref} className="dv-display-xl" style={{ color: "var(--dv-black)", display: "block" }}>YOUR</div>
              <div ref={line2Ref} className="dv-display-xl" style={{ color: "var(--dv-black)", display: "block" }}>DIGITAL</div>
              {/* Typewriter line */}
              <div ref={line3Ref} className="dv-display-xl" style={{ display: "block", fontStyle: "italic", fontWeight: 300, textTransform: "none", letterSpacing: "-0.03em", color: "var(--dv-black)" }}>
                <TypewriterText
                  texts={["Identity.", "Visiting Card.", "Brand.", "Presence.", "Story."]}
                  typeSpeed={65}
                  eraseSpeed={35}
                  pauseAfter={1800}
                  enhance
                />
              </div>
            </h1>

            <div ref={subRef} style={{ marginTop: "2rem", maxWidth: "44ch" }}>
              <p className="dv-body" style={{ margin: 0, color: "rgba(0,0,0,0.65)", fontSize: "1.0625rem" }}>
                {hero.subheadline}
              </p>
            </div>

            <div ref={ctaRef} style={{ marginTop: "2.5rem", display: "flex", flexWrap: "wrap", gap: "0.875rem", alignItems: "center" }} className="dv-hero-cta">
              <Link href={hero.primaryCta.href} className="dv-btn dv-btn-primary dv-btn-lg">
                Create Your Card
                <ArrowRight style={{ width: "1.125rem", height: "1.125rem" }} aria-hidden />
              </Link>
              <Link href={hero.secondaryCta.href} className="dv-btn dv-btn-outline dv-btn-lg">
                Explore Designs
              </Link>
            </div>

            <ul style={{ marginTop: "2rem", listStyle: "none", padding: 0, display: "flex", flexWrap: "wrap", gap: "1.25rem" }} className="dv-hero-proof">
              {hero.proof.map((item) => (
                <li key={item} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: 600, color: "rgba(0,0,0,0.6)" }}>
                  <span style={{ width: "0.375rem", height: "0.375rem", borderRadius: "50%", background: "var(--dv-black)", flexShrink: 0 }} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT — phone, aligned right with breathing room */}
          <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: "clamp(0rem, 3vw, 3rem)" }}>
            <canvas ref={canvasRef} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0, width: "100%", height: "100%" }} />
            <div ref={phoneRef} style={{ width: "clamp(220px, 28vw, 300px)", position: "relative" }}>
              <CardPreview themes={themes} qrValue={demoUrl} tone="light" />
            </div>
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
            gap: 2.5rem;
            text-align: center;
          }
          .dv-hero-cta   { justify-content: center !important; }
          .dv-hero-proof { justify-content: center !important; }
        }
      `}</style>
    </section>
  );
}
