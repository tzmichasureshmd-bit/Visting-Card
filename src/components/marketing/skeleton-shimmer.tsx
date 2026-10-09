"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

/* ── Data ─────────────────────────────────────────────────────── */
const PROFILE_NAME   = "DV Card";
const PROFILE_HANDLE = "@dvcard";
const PROFILE_BIO    = "Create stunning digital visiting cards. Share your identity with one tap.";
const STATS = [
  { value: "127", label: "Cards" },
  { value: "11K", label: "Shares" },
  { value: "98%", label: "Saves" },
];

const COVER_H   = 120;
const AVATAR_SZ = 56;
const OVERLAP   = 28;

/* ── Shimmer gradient ─────────────────────────────────────────── */
const BASE      = "rgba(255,255,255,0.06)";
const HIGHLIGHT = "rgba(255,255,255,0.14)";
const SHIMMER   = `linear-gradient(90deg,${BASE} 25%,${HIGHLIGHT} 50%,${BASE} 75%)`;

/* ── Bone (pure shimmer block) ────────────────────────────────── */
function Bone({
  width, height, radius = 6, delay = 0,
}: { width: number | string; height: number; radius?: number | string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let kill: (() => void) | undefined;
    (async () => {
      const m = await import("gsap");
      const gsap = m.gsap ?? m.default;
      const tween = gsap.fromTo(
        ref.current,
        { backgroundPosition: "-200% 0" },
        { backgroundPosition: "200% 0", duration: 1.5, ease: "none", repeat: -1, delay },
      );
      kill = () => tween.kill();
    })();
    return () => kill?.();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        width, height, borderRadius: radius, flexShrink: 0,
        background: SHIMMER, backgroundSize: "200% 100%",
      }}
    />
  );
}

/* ── Shimmer wrapper (hides real content, shows shimmer shape) ── */
function Shimmer({
  children, radius = "6px", style, delay = 0,
}: { children: ReactNode; radius?: string; style?: CSSProperties; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let kill: (() => void) | undefined;
    (async () => {
      const m = await import("gsap");
      const gsap = m.gsap ?? m.default;
      const tween = gsap.fromTo(
        ref.current,
        { backgroundPosition: "-200% 0" },
        { backgroundPosition: "200% 0", duration: 1.5, ease: "none", repeat: -1, delay },
      );
      kill = () => tween.kill();
    })();
    return () => kill?.();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        borderRadius: radius, overflow: "hidden",
        background: SHIMMER, backgroundSize: "200% 100%",
        alignSelf: "flex-start", ...style,
      }}
    >
      <div style={{ visibility: "hidden" }}>{children}</div>
    </div>
  );
}

/* ── Skeleton card ────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={cardStyle}>
      <Bone width="100%" height={COVER_H} radius={0} />
      <div style={areaStyle}>
        <div style={{ marginTop: -OVERLAP }}>
          <div style={ringStyle}>
            <Bone width={AVATAR_SZ - 6} height={AVATAR_SZ - 6} radius="50%" delay={0.1} />
          </div>
        </div>
        <Shimmer radius="6px" delay={0.05}>
          <div style={infoStyle}>
            <h3 style={nameStyle}>{PROFILE_NAME}</h3>
            <p style={handleStyle}>{PROFILE_HANDLE}</p>
          </div>
        </Shimmer>
        <Shimmer radius="6px" delay={0.1}>
          <p style={bioStyle}>{PROFILE_BIO}</p>
        </Shimmer>
        <div style={statsRowStyle}>
          {STATS.map((s, i) => (
            <Shimmer key={s.label} radius="8px" delay={0.05 * i} style={{ flex: 1 }}>
              <div style={statItemStyle}>
                <span style={statValStyle}>{s.value}</span>
                <span style={statLblStyle}>{s.label}</span>
              </div>
            </Shimmer>
          ))}
        </div>
        <Shimmer radius="10px">
          <div style={followSizerStyle}>Follow</div>
        </Shimmer>
      </div>
    </div>
  );
}

/* ── Profile card ─────────────────────────────────────────────── */
function ProfileCard() {
  const cardRef  = useRef<HTMLDivElement>(null);
  const nameRef  = useRef<HTMLHeadingElement>(null);
  const handleRef = useRef<HTMLParagraphElement>(null);
  const bioRef   = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let kill: (() => void) | undefined;
    (async () => {
      const m = await import("gsap");
      const gsap = m.gsap ?? m.default;
      const els = [nameRef.current, handleRef.current, bioRef.current, statsRef.current, btnRef.current];
      gsap.set(els, { opacity: 0, y: 16 });
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(cardRef.current,    { opacity: 1, scale: 1, duration: 0.45 })
        .to(els, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07 }, "-=0.2");
      kill = () => tl.kill();
    })();
    return () => kill?.();
  }, []);

  return (
    <div ref={cardRef} style={{ ...cardStyle, opacity: 0, scale: "0.97" } as CSSProperties}>
      <div style={coverStyle} />
      <div style={areaStyle}>
        <div style={{ marginTop: -OVERLAP }}>
          <div style={avatarStyle}>
            <DVLogo />
          </div>
        </div>
        <div style={infoStyle}>
          <h3 ref={nameRef} style={nameStyle}>{PROFILE_NAME}</h3>
          <p ref={handleRef} style={handleStyle}>{PROFILE_HANDLE}</p>
        </div>
        <p ref={bioRef} style={bioStyle}>{PROFILE_BIO}</p>
        <div ref={statsRef} style={statsRowStyle}>
          {STATS.map((s) => (
            <div key={s.label} style={statItemStyle}>
              <span style={statValStyle}>{s.value}</span>
              <span style={statLblStyle}>{s.label}</span>
            </div>
          ))}
        </div>
        <button ref={btnRef} style={followBtnStyle}>Follow</button>
      </div>
    </div>
  );
}

/* ── Logo ─────────────────────────────────────────────────────── */
function DVLogo() {
  return (
    <svg viewBox="0 0 1260 454" fill="currentColor" style={{ width: "65%", height: "65%" }}>
      <path d="M475.753 0L226.8 453.6L0 453.6L194.392 99.4116C224.526 44.5081 299.724 0 362.353 0L475.753 0Z" />
      <path d="M1031.93 113.4C1031.93 50.7709 1082.7 0 1145.33 0C1207.96 0 1258.73 50.7709 1258.73 113.4C1258.73 176.029 1207.96 226.8 1145.33 226.8C1082.7 226.8 1031.93 176.029 1031.93 113.4Z" />
      <path d="M518.278 0L745.078 0L496.125 453.6L269.325 453.6L518.278 0Z" />
      <path d="M786.147 0L1012.95 0L818.555 354.188C788.422 409.092 713.223 453.6 650.594 453.6L537.194 453.6L786.147 0Z" />
    </svg>
  );
}

/* ── Wipe transition overlay ──────────────────────────────────── */
function WipeOverlay({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let kill: (() => void) | undefined;
    (async () => {
      const m = await import("gsap");
      const gsap = m.gsap ?? m.default;
      const tl = gsap.timeline({ onComplete: onDone });
      tl.fromTo(ref.current,
        { clipPath: "inset(0 0 0 0%)" },
        { clipPath: "inset(0 0 0 100%)", duration: 0.55, ease: "power2.inOut" },
      );
      kill = () => tl.kill();
    })();
    return () => kill?.();
  }, [onDone]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute", inset: 0, zIndex: 10,
        background: "var(--dv-black)",
        borderRadius: 16,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Main export ──────────────────────────────────────────────── */
export function SkeletonShimmer({ loadDelay = 2500 }: { loadDelay?: number }) {
  const [phase, setPhase] = useState<"skeleton" | "wiping" | "loaded">("skeleton");

  useEffect(() => {
    if (phase !== "skeleton") return;
    const t = setTimeout(() => setPhase("wiping"), loadDelay);
    return () => clearTimeout(t);
  }, [phase, loadDelay]);

  return (
    <div style={containerStyle}>
      <div style={{ position: "relative", width: "100%", maxWidth: 360 }}>
        {phase === "skeleton" && <SkeletonCard />}
        {phase === "wiping"   && (
          <>
            <ProfileCard />
            <WipeOverlay onDone={() => setPhase("loaded")} />
          </>
        )}
        {phase === "loaded"   && <ProfileCard />}
      </div>

      <button
        style={reloadBtnStyle}
        onClick={() => setPhase("skeleton")}
      >
        Reload
      </button>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────── */
const containerStyle: CSSProperties = {
  width: "100%", minHeight: "100dvh",
  display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
  gap: 16, padding: 20, boxSizing: "border-box",
  background: "#0a0a0a",
};

const cardStyle: CSSProperties = {
  width: "100%", borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  backgroundColor: "rgba(255,255,255,0.04)",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

const coverStyle: CSSProperties = {
  width: "100%", height: COVER_H,
  background: "linear-gradient(135deg,#C7FF2F 0%,#a8d926 100%)",
};

const areaStyle: CSSProperties = {
  padding: "0 20px 20px",
  display: "flex", flexDirection: "column", gap: 14,
};

const ringStyle: CSSProperties = {
  width: AVATAR_SZ, height: AVATAR_SZ, borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.04)",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const avatarStyle: CSSProperties = {
  width: AVATAR_SZ, height: AVATAR_SZ, borderRadius: "50%",
  background: "#C7FF2F",
  border: "3px solid rgba(255,255,255,0.04)",
  boxSizing: "border-box",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#000",
};

const infoStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 4 };

const nameStyle: CSSProperties   = { margin: 0, fontSize: 16, fontWeight: 600, color: "#fff", lineHeight: 1.2 };
const handleStyle: CSSProperties = { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.2 };
const bioStyle: CSSProperties    = { margin: 0, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,0.55)" };

const statsRowStyle: CSSProperties = { display: "flex", gap: 8 };

const statItemStyle: CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  padding: "8px 4px", borderRadius: 8,
  backgroundColor: "rgba(255,255,255,0.04)", flex: 1, gap: 2,
};

const statValStyle: CSSProperties = { fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.3 };
const statLblStyle: CSSProperties = { fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 };

const followSizerStyle: CSSProperties = {
  width: "100%", padding: "10px 0", fontSize: 14, fontWeight: 600, textAlign: "center",
};

const followBtnStyle: CSSProperties = {
  width: "100%", padding: "10px 0", fontSize: 14, fontWeight: 600,
  fontFamily: "inherit", borderRadius: 10, border: "none",
  background: "#C7FF2F", color: "#000", cursor: "pointer",
};

const reloadBtnStyle: CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
  background: "transparent", color: "#fff",
  padding: "8px 20px", fontSize: 13, fontWeight: 500,
  fontFamily: "inherit", cursor: "pointer",
};
