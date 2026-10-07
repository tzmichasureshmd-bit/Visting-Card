import { cn } from "@/lib/utils";

export function Card({ className, interactive, ...props }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn("dv-card", interactive && "cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg", className)}
      {...props}
    />
  );
}

export function CardHeader({ title, description, action, className }: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 py-4", className)}
      style={{ borderBottom: "1px solid var(--dv-border)" }}>
      <div>
        <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--dv-black)", letterSpacing: "-0.02em" }}>{title}</h2>
        {description ? <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--dv-gray)" }}>{description}</p> : null}
      </div>
      {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-3.5", className)}
      style={{ borderTop: "1px solid var(--dv-border)" }}
      {...props} />
  );
}

export function Badge({ tone = "neutral", className, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass: Record<string, string> = {
    neutral: "dv-badge dv-badge-neutral",
    brand:   "dv-badge dv-badge-lime",
    success: "dv-badge dv-badge-success",
    warning: "dv-badge",
    danger:  "dv-badge dv-badge-danger",
    info:    "dv-badge",
  };
  const toneStyle: Record<string, React.CSSProperties> = {
    warning: { background: "rgba(217,119,6,0.1)", color: "var(--dv-warning)" },
    info:    { background: "rgba(37,99,235,0.1)", color: "#2563eb" },
  };
  return (
    <span className={cn(toneClass[tone], className)} style={toneStyle[tone]} {...props}>
      {children}
    </span>
  );
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-flex", className)} aria-hidden style={{ width: "0.5rem", height: "0.5rem" }}>
      <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--dv-success)", opacity: 0.6, animation: "dv-pulse-dot 1.5s ease-in-out infinite" }} />
      <span style={{ position: "relative", width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: "var(--dv-success)", display: "inline-flex" }} />
    </span>
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("dv-skeleton", className)} aria-hidden {...props} />;
}

export function EmptyState({ icon: Icon, title, description, action, className }: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-16", className)}>
      {Icon ? (
        <div style={{ width: "3rem", height: "3rem", borderRadius: "var(--dv-r-md)", background: "var(--dv-off-white)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <Icon className="size-6" />
        </div>
      ) : null}
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--dv-black)" }}>{title}</h3>
      {description ? <p style={{ margin: "0.5rem 0 0", maxWidth: "36ch", fontSize: "0.9375rem", color: "var(--dv-gray)", lineHeight: 1.6 }}>{description}</p> : null}
      {action ? <div style={{ marginTop: "1.5rem" }}>{action}</div> : null}
    </div>
  );
}

export function Progress({ value, max = 100, className, label }: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className={cn("overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ height: "0.5rem", borderRadius: "999px", background: "var(--dv-off-white)" }}
    >
      <div style={{ width: `${pct}%`, height: "100%", borderRadius: "999px", background: "var(--dv-lime)", transition: "width 0.5s ease" }} />
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "center", className }: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" ? "mx-auto text-center" : "text-left", className)}>
      {eyebrow ? <p className="dv-eyebrow" style={{ marginBottom: "0.75rem" }}>{eyebrow}</p> : null}
      <h2 className="dv-display-md" style={{ margin: 0, color: "var(--dv-black)" }}>{title}</h2>
      {description ? <p className="dv-body" style={{ marginTop: "1rem" }}>{description}</p> : null}
    </div>
  );
}
