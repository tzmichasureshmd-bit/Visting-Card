import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  tone = "light",
  href,
  className,
  compact = false,
}: {
  tone?: "light" | "dark";
  href?: string;
  className?: string;
  compact?: boolean;
}) {
  const isDark = tone === "dark";

  const content = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.625rem" }}>
      {/* Logo mark */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.125rem",
          height: "2.125rem",
          borderRadius: "0.5rem",
          background: "var(--dv-lime)",
          fontSize: "0.6875rem",
          fontWeight: 900,
          color: "var(--dv-black)",
          letterSpacing: "-0.02em",
          flexShrink: 0,
          border: "1.5px solid rgba(0,0,0,0.12)",
        }}
        aria-hidden
      >
        DV
      </span>

      {!compact ? (
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            style={{
              fontSize: "0.9375rem",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: isDark ? "#fff" : "var(--dv-black)",
              textTransform: "uppercase",
            }}
          >
            DV CARD
          </span>
          <span
            style={{
              fontSize: "0.5625rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: isDark ? "rgba(255,255,255,0.45)" : "var(--dv-gray-light)",
              marginTop: "0.1875rem",
            }}
          >
            Digital Visiting Card
          </span>
        </span>
      ) : null}
    </span>
  );

  const cls = cn("inline-flex items-center", className);

  if (!href) return <span className={cls}>{content}</span>;

  return (
    <Link
      href={href}
      className={cn(cls, "dv-brand-link")}
      style={{ textDecoration: "none" }}
    >
      {content}
    </Link>
  );
}
