"use client";

import { useState } from "react";
import { Crown, Loader2, Lock } from "lucide-react";

import { Panel } from "@/components/builder/action-kit";
import { setCardThemeAction } from "@/lib/cards/actions";
import { resolveTheme } from "@/lib/cards/theme";
import type { PreviewDraft } from "@/lib/cards/editor-preview";
import type { EditorState } from "@/lib/cards/editor-types";
import { cn } from "@/lib/utils";

/* ── Layout thumbnails ─────────────────────────────────────────────────────── */

function LayoutThumb({
  layout,
  accent,
  surface,
}: {
  layout: string;
  accent: string;
  surface: string;
}) {
  const bg = surface;
  const ac = accent;
  const mu = "#a1a1aa";
  const bd = "#e4e4e7";

  const thumbs: Record<string, React.ReactNode> = {
    centered: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <circle cx="40" cy="16" r="7" fill={ac} />
        <rect x="26" y="26" width="28" height="3" rx="1.5" fill={ac} />
        <rect x="30" y="31" width="20" height="2" rx="1" fill={mu} />
        <rect x="10" y="37" width="60" height="1.5" rx="0.75" fill={bd} />
        <rect x="14" y="41" width="52" height="2" rx="1" fill={mu} />
        <rect x="18" y="45" width="44" height="2" rx="1" fill={mu} />
      </svg>
    ),
    banner: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <rect width="80" height="18" rx="4" fill={ac} />
        <rect x="0" y="14" width="80" height="4" fill={ac} />
        <circle cx="40" cy="18" r="7" fill={bg} stroke={ac} strokeWidth="1.5" />
        <rect x="24" y="28" width="32" height="3" rx="1.5" fill={ac} />
        <rect x="28" y="33" width="24" height="2" rx="1" fill={mu} />
        <rect x="14" y="38" width="52" height="2" rx="1" fill={mu} />
        <rect x="18" y="42" width="44" height="2" rx="1" fill={mu} />
      </svg>
    ),
    split: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <circle cx="20" cy="20" r="10" fill={ac} />
        <rect x="36" y="13" width="34" height="3" rx="1.5" fill={ac} />
        <rect x="36" y="18" width="24" height="2" rx="1" fill={mu} />
        <rect x="36" y="22" width="28" height="2" rx="1" fill={mu} />
        <rect x="8" y="36" width="64" height="1.5" rx="0.75" fill={bd} />
        <rect x="8" y="40" width="64" height="2" rx="1" fill={mu} />
        <rect x="8" y="44" width="48" height="2" rx="1" fill={mu} />
      </svg>
    ),
    editorial: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <circle cx="40" cy="13" r="6" fill={ac} />
        <rect x="16" y="22" width="48" height="5" rx="2" fill={ac} />
        <rect x="22" y="29" width="36" height="2.5" rx="1.25" fill={mu} />
        <rect x="8" y="35" width="64" height="1.5" rx="0.75" fill={bd} />
        <rect x="12" y="39" width="56" height="2" rx="1" fill={mu} />
        <rect x="16" y="43" width="48" height="2" rx="1" fill={mu} />
        <rect x="20" y="47" width="40" height="2" rx="1" fill={mu} />
      </svg>
    ),
    showcase: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={ac} />
        <rect x="0" y="30" width="80" height="26" rx="0" fill={bg} />
        <rect x="0" y="28" width="80" height="4" rx="2" fill={bg} />
        <circle cx="40" cy="30" r="8" fill={bg} stroke={ac} strokeWidth="1.5" />
        <rect x="22" y="41" width="36" height="3" rx="1.5" fill={ac} />
        <rect x="28" y="46" width="24" height="2" rx="1" fill={mu} />
      </svg>
    ),
    poster: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <rect x="8" y="8" width="64" height="10" rx="2" fill={ac} />
        <rect x="14" y="20" width="52" height="3" rx="1.5" fill={mu} />
        <circle cx="40" cy="34" r="8" fill={ac} opacity="0.3" />
        <circle cx="40" cy="34" r="5" fill={ac} />
        <rect x="20" y="45" width="40" height="2" rx="1" fill={mu} />
      </svg>
    ),
    ledger: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <circle cx="14" cy="14" r="7" fill={ac} />
        <rect x="26" y="10" width="30" height="3" rx="1.5" fill={ac} />
        <rect x="26" y="15" width="22" height="2" rx="1" fill={mu} />
        <rect x="8" y="26" width="64" height="1" rx="0.5" fill={bd} />
        <rect x="8" y="30" width="64" height="1" rx="0.5" fill={bd} />
        <rect x="8" y="34" width="64" height="1" rx="0.5" fill={bd} />
        <rect x="8" y="38" width="64" height="1" rx="0.5" fill={bd} />
        <rect x="10" y="27.5" width="40" height="1.5" rx="0.75" fill={mu} />
        <rect x="10" y="31.5" width="32" height="1.5" rx="0.75" fill={mu} />
        <rect x="10" y="35.5" width="36" height="1.5" rx="0.75" fill={mu} />
        <rect x="10" y="39.5" width="28" height="1.5" rx="0.75" fill={mu} />
      </svg>
    ),
    mosaic: (
      <svg viewBox="0 0 80 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="56" rx="4" fill={bg} />
        <circle cx="14" cy="14" r="7" fill={ac} />
        <rect x="26" y="10" width="28" height="3" rx="1.5" fill={ac} />
        <rect x="26" y="15" width="20" height="2" rx="1" fill={mu} />
        <rect x="8" y="26" width="30" height="22" rx="3" fill={ac} opacity="0.15" />
        <rect x="8" y="26" width="30" height="22" rx="3" stroke={bd} strokeWidth="1" />
        <rect x="42" y="26" width="30" height="10" rx="3" fill={ac} opacity="0.15" />
        <rect x="42" y="26" width="30" height="10" rx="3" stroke={bd} strokeWidth="1" />
        <rect x="42" y="38" width="30" height="10" rx="3" fill={ac} opacity="0.15" />
        <rect x="42" y="38" width="30" height="10" rx="3" stroke={bd} strokeWidth="1" />
      </svg>
    ),
  };

  return (
    <span className="block w-full overflow-hidden rounded-lg border border-border">
      {thumbs[layout] ?? thumbs.centered}
    </span>
  );
}

/* ── Panel ─────────────────────────────────────────────────────────────────── */

export function BuilderStylePanel({
  state,
  setDraft,
}: {
  state: EditorState;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}) {
  const premiumAllowed = state.plan.limits.premium_themes;

  const initialSlug =
    state.themes.find((theme) => theme.id === state.card.themeId)?.slug ?? "";

  // Track the confirmed-saved slug locally so the selection stays correct
  // after a save without needing a full server refresh.
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  // While a save is in flight show the pending slug; otherwise show the last saved.
  const selected = pendingSlug ?? savedSlug;
  const [failure, setFailure] = useState<string | null>(null);

  async function choose(slug: string, config: ReturnType<typeof resolveTheme>) {
    if (pendingSlug) return;
    // Don't re-save the already-active design.
    if (slug === savedSlug) return;
    setFailure(null);
    setPendingSlug(slug);
    // Optimistic preview — feels instant.
    setDraft((current) => ({ ...current, theme: config }));

    const result = await setCardThemeAction(state.card.id, slug);
    setPendingSlug(null);

    if (result.ok) {
      // Commit the selection locally so it stays highlighted.
      setSavedSlug(slug);
      // Drop the optimistic draft — the saved config is now authoritative.
      setDraft((current) => ({ ...current, theme: undefined }));
    } else {
      setFailure(result.error);
      // Revert preview to what was actually saved.
      setDraft((current) => ({ ...current, theme: undefined }));
    }
  }

  return (
    <div className="space-y-5">
      <Panel
        title="Design"
        description="Each design changes the page structure — layout, hero and typography."
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {state.themes.map((theme) => {
            const isSelected = theme.slug === selected;
            const config = resolveTheme(theme.config, null);
            const locked = theme.isPremium && !premiumAllowed;

            return (
              <li key={theme.id}>
                <button
                  type="button"
                  disabled={locked || pendingSlug !== null}
                  aria-pressed={isSelected}
                  onClick={() => choose(theme.slug, config)}
                  className={cn(
                    "flex w-full flex-col gap-2 rounded-xl border p-2.5 text-left",
                    "transition-[border-color,background-color,transform,box-shadow]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    "disabled:cursor-not-allowed",
                    isSelected
                      ? "border-fg bg-surface-2 shadow-sm ring-1 ring-fg/10"
                      : "border-border hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
                    locked && "opacity-60",
                  )}
                >
                  {/* Visual thumbnail */}
                  <LayoutThumb
                    layout={config.layout}
                    accent={config.palette.accent}
                    surface={config.palette.surface}
                  />

                  {/* Label row */}
                  <span className="flex items-center justify-between gap-1 px-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold text-fg">{theme.name}</span>
                      {theme.isPremium ? (
                        <Crown className="size-3 shrink-0 text-warning" aria-label="Premium" />
                      ) : null}
                      {pendingSlug === theme.slug ? (
                        <Loader2 className="size-3 shrink-0 animate-spin text-muted" aria-hidden />
                      ) : null}
                    </span>
                    <span className="text-[11px] capitalize text-muted">
                      {config.layout}
                    </span>
                    {locked ? (
                      <Lock className="size-3 shrink-0 text-muted" aria-hidden />
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {!premiumAllowed ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px] leading-snug text-warning">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Premium designs come with a paid plan. Try{" "}
              <strong className="font-semibold">Poster</strong> or{" "}
              <strong className="font-semibold">Ledger</strong> for a genuinely different page.
            </span>
          </p>
        ) : null}

        {failure ? (
          <p role="alert" className="mt-3 text-[13px] text-danger">
            {failure}
          </p>
        ) : null}
      </Panel>
    </div>
  );
}
