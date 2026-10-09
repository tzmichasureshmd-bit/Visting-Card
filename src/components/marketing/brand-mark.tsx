import Image from "next/image";
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
  void tone;

  const content = (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <Image
        src="/images/dvcard/Glosssy logo.png"
        alt="DV Card Logo"
        width={compact ? 28 : 72}
        height={compact ? 28 : 28}
        style={{ objectFit: "contain", flexShrink: 0 }}
        priority
      />
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
