import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Heading block shared by the legal and programme pages.
 *
 * Everything under these routes is static prose, so the only structural
 * decisions — page title, the one-line summary, the way back — live here rather
 * than being retyped in six files.
 */
export function ProseHeader({
  title,
  summary,
  updated,
}: {
  title: string;
  summary: string;
  /** Shown only when provided, so pages without a date do not render an empty row. */
  updated?: string;
}) {
  return (
    <header>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Digital Visiting Card
      </Link>
      <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted">{summary}</p>
      {updated ? <p className="mt-4 text-[13px] text-subtle">Last updated {updated}</p> : null}
    </header>
  );
}

/** A titled section of prose. Heading level is fixed at 2 for a single h1 per page. */
export function ProseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">{children}</div>
    </section>
  );
}
