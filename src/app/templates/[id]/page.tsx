import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Crown } from "lucide-react";

import { CardView } from "@/components/card/card-view";
import { Button } from "@/components/ui/button";
import { demoCardWithTheme } from "@/lib/cards/demo";
import { getShowcaseTheme, getShowcaseThemes } from "@/lib/marketing/themes";

/**
 * One design, rendered large.
 *
 * The template gallery previews designs inside a phone frame so they can be
 * compared quickly; this route shows a single design full-width, which is what
 * someone needs before committing to it — and it gives every design its own
 * indexable URL to link to.
 *
 * `generateStaticParams` prerenders all of them at build time from the seeded
 * fallback list, so this works with no Supabase credentials. When the database is
 * configured the same params come from the live table, and `dynamicParams` stays
 * on so a theme an admin adds later resolves on first request instead of 404ing.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  const themes = await getShowcaseThemes();
  return themes.map((theme) => ({ id: theme.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/templates/[id]">): Promise<Metadata> {
  const { id } = await params;
  const theme = await getShowcaseTheme(id);

  if (!theme) return { title: "Template not found" };

  return {
    title: `${theme.name} card template`,
    description: theme.description,
    alternates: { canonical: `/templates/${theme.slug}` },
  };
}

export default async function TemplateDetailPage({ params }: PageProps<"/templates/[id]">) {
  const { id } = await params;
  const [theme, themes] = await Promise.all([getShowcaseTheme(id), getShowcaseThemes()]);

  if (!theme) notFound();

  // The seeded list is sorted, so the neighbours are the previous and next
  // designs — a visitor can step through the whole catalogue without going back.
  const index = themes.findIndex((candidate) => candidate.slug === theme.slug);
  const previous = index > 0 ? themes[index - 1] : null;
  const next = index >= 0 && index < themes.length - 1 ? themes[index + 1] : null;

  return (
    <main className="min-h-dvh bg-surface">
      <div className="border-b border-border bg-surface-2">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/templates"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
          >
            <ArrowLeft className="size-4" aria-hidden />
            All templates
          </Link>
          <Button asChild size="sm" variant="primary">
            <Link href={`/signup?theme=${theme.slug}`}>
              Use {theme.name}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pt-10 pb-16 sm:px-6">
        <header className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {theme.name}
            </h1>
            {theme.isPremium ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-2 py-0.5 text-[11px] font-semibold text-warning">
                <Crown className="size-3" aria-hidden />
                Pro
              </span>
            ) : null}
          </div>
          <p className="mt-3 text-lg leading-relaxed text-pretty text-muted">
            {theme.description}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-4">
            <Spec label="Layout" value={theme.config.layout} />
            <Spec label="Sections" value={theme.config.sectionStyle} />
            <Spec label="Name" value={theme.config.nameStyle} />
            <Spec label="Buttons" value={theme.config.buttonStyle} />
          </dl>
        </header>

        {/* The card itself, at real size rather than in a mock-up. */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-border">
          <CardView card={demoCardWithTheme(theme.config)} demo />
        </div>

        <nav
          aria-label="Template navigation"
          className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6"
        >
          {previous ? (
            <Link
              href={`/templates/${previous.slug}`}
              className="group inline-flex min-w-0 items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[11px] tracking-wide text-subtle uppercase">
                  Previous
                </span>
                <span className="block truncate">{previous.name}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}

          {next ? (
            <Link
              href={`/templates/${next.slug}`}
              className="group inline-flex min-w-0 items-center gap-2 text-right text-sm font-medium text-muted transition-colors hover:text-fg"
            >
              <span className="min-w-0">
                <span className="block text-[11px] tracking-wide text-subtle uppercase">
                  Next
                </span>
                <span className="block truncate">{next.name}</span>
              </span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] tracking-wide text-subtle uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium text-fg capitalize">{value}</dd>
    </div>
  );
}