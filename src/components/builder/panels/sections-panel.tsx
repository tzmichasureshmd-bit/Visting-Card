"use client";

import { useState } from "react";
import { Check, GripVertical, Loader2, Lock } from "lucide-react";

import { Panel } from "@/components/builder/action-kit";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/field";
import { Badge } from "@/components/ui/primitives";
import { reorderCardSectionsAction, setSectionEnabledAction } from "@/lib/cards/actions";
import type { PreviewDraft } from "@/lib/cards/editor-preview";
import type { EditorState } from "@/lib/cards/editor-types";
import { SECTION_META } from "@/lib/cards/sections";
import { SECTION_KEYS, type CardSection, type SectionKey } from "@/lib/cards/types";
import { allowsSection } from "@/lib/plan-limits";
import { cn } from "@/lib/utils";

/**
 * "Sections" — choose what appears, and in what order.
 *
 * Order is saved explicitly rather than on every arrow click. `card_sections.
 * position` is written by `reorderCardSectionsAction`, which upserts the whole
 * list, so reordering never half-applies — and one write per deliberate reorder is
 * kinder to the rate limit than one per arrow press. The toggle, by contrast,
 * saves straight away through `setSectionEnabledAction`, which is also where plan
 * gating lives — so a locked section cannot be switched on even by a crafted
 * request.
 */
export function BuilderSectionsPanel({
  state,
  draft,
  setDraft,
}: {
  state: EditorState;
  draft: PreviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}) {
  const [busy, setBusy] = useState<SectionKey | null>(null);
  const [lockedNote, setLockedNote] = useState<{ key: SectionKey; reason: string } | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const base: CardSection[] =
    draft.sections ??
    state.sections.map((section, index) => ({
      key: section.key,
      enabled: section.enabled,
      position: section.position || index,
      config: {},
    }));

  // Sections with no stored row still exist conceptually — `isSectionEnabled`
  // defaults to enabled — so the panel shows the full list, not just the rows.
  const ordered: CardSection[] = SECTION_KEYS.map((key, index) =>
    base.find((section) => section.key === key) ?? {
      key,
      enabled: true,
      position: index,
      config: {},
    },
  );

  // The order the server holds, which is what `reorderCardSectionsAction` will
  // overwrite. Compared against the working list to decide whether "Save order"
  // is worth showing at all.
  const savedOrder = state.sections.map((section) => section.key);
  const hasStoredRows = savedOrder.length > 0;

  function move(key: SectionKey, direction: -1 | 1) {
    setDraft((current) => {
      const list = [...(current.sections ?? ordered)];
      const index = list.findIndex((section) => section.key === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return current;
      [list[index], list[target]] = [list[target], list[index]];
      return { ...current, sections: list.map((section, i) => ({ ...section, position: i })) };
    });
  }

  const workingOrder = (draft.sections ?? ordered).map((section) => section.key);
  const reordered =
    hasStoredRows &&
    workingOrder.length === savedOrder.length &&
    workingOrder.some((key, index) => key !== savedOrder[index]);

  async function saveOrder() {
    if (savingOrder) return;
    setOrderError(null);
    setSavingOrder(true);

    const result = await reorderCardSectionsAction(
      state.card.id,
      (draft.sections ?? ordered).map((section) => section.key),
    );
    setSavingOrder(false);

    if (!result.ok) {
      setOrderError(result.error);
      return;
    }
    // The read model now owns the order, so the local override is dropped and the
    // preview falls back to what was saved.
    setDraft((current) => ({ ...current, sections: undefined }));
  }

  async function toggle(key: SectionKey, enabled: boolean) {
    if (busy) return;
    setLockedNote(null);
    setBusy(key);

    // Optimistic, reverted if the server refuses.
    setDraft((current) => ({
      ...current,
      sections: (current.sections ?? ordered).map((section) =>
        section.key === key ? { ...section, enabled } : section,
      ),
    }));

    const result = await setSectionEnabledAction(state.card.id, key, enabled);
    setBusy(null);

    if (!result.ok) {
      setLockedNote({ key, reason: result.error });
      setDraft((current) => ({
        ...current,
        sections: (current.sections ?? ordered).map((section) =>
          section.key === key ? { ...section, enabled: !enabled } : section,
        ),
      }));
    }
  }

  return (
    <Panel
      title="Sections"
      description="Switch off anything you do not need. The preview updates as you go."
    >
      <ul className="space-y-2">
        {ordered.map((section, index) => {
          const meta = SECTION_META[section.key];
          const permitted = allowsSection(state.plan.limits, section.key);

          return (
            <li
              key={section.key}
              className="rounded-xl border border-border bg-surface-2/40 px-3.5 py-2"
            >
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 flex-col gap-0.5 pt-1">
                  <ReorderButton
                    label={`Move ${meta.title ?? section.key} up`}
                    disabled={index === 0}
                    onClick={() => move(section.key, -1)}
                  />
                  <ReorderButton
                    label={`Move ${meta.title ?? section.key} down`}
                    disabled={index === ordered.length - 1}
                    onClick={() => move(section.key, 1)}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-fg">
                    {meta.title ?? SECTION_META[section.key].title ?? humanise(section.key)}
                    {!permitted ? (
                      <Badge tone="warning">
                        <Lock className="size-3" aria-hidden />
                        Plan
                      </Badge>
                    ) : null}
                    {lockedNote?.key === section.key ? (
                      <span role="status" className="text-[12px] text-danger">
                        {lockedNote.reason}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{meta.description}</p>
                </div>

                <div className="shrink-0">
                  <Switch
                    id={`section-${section.key}`}
                    label={`Show ${meta.title ?? humanise(section.key)}`}
                    checked={permitted && section.enabled}
                    disabled={busy !== null || (!permitted && !section.enabled)}
                    onCheckedChange={(next) => toggle(section.key, next)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {reordered ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/60 px-3.5 py-3">
          <p className="min-w-0 flex-1 text-[13px] leading-relaxed text-muted">
            New order applied to the preview. Save it to make it permanent.
          </p>
          <Button
            type="button"
            size="sm"
            disabled={savingOrder}
            onClick={() => void saveOrder()}
          >
            {savingOrder ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Check className="size-3.5" aria-hidden />
            )}
            {savingOrder ? "Saving..." : "Save order"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={savingOrder}
            onClick={() =>
              setDraft((current) => ({ ...current, sections: undefined }))
            }
          >
            Discard
          </Button>
        </div>
      ) : null}

      {orderError ? (
        <p role="alert" className="mt-3 text-[13px] text-danger">
          {orderError}
        </p>
      ) : null}

      <p className="mt-4 text-[13px] leading-relaxed text-muted">
        Switches save straight away. Use the arrows to change the order, then save it.
      </p>
    </Panel>
  );
}

function ReorderButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded p-0.5 text-muted transition-colors hover:text-fg",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-30",
      )}
    >
      <GripVertical className="size-3.5" aria-hidden />
    </button>
  );
}

/** Fallback label for a section with no `title` (the two form sections). */
function humanise(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}