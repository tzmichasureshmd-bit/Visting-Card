"use client";

import Link from "next/link";
import { useRef } from "react";
import { ImagePlus, Loader2, Trash2, Upload, UserRound } from "lucide-react";

import { Panel, useActionRunner, useObjectUrlPreview } from "@/components/builder/action-kit";
import { Button } from "@/components/ui/button";
import {
  addGalleryImageAction,
  removeGalleryImageAction,
  uploadProfilePhotoAction,
} from "@/lib/cards/actions";
import type { EditorState } from "@/lib/cards/editor-types";

/**
 * Profile photo and gallery images.
 *
 * Both write through the existing storage-backed actions, which enforce the
 * plan's `max_gallery_items` and do best-effort object cleanup on removal. The
 * panel's job is only to make those two flows feel immediate: a local preview
 * while uploading, and the read model refreshed once the row exists.
 */
export function BuilderPhotosPanel({ state }: { state: EditorState }) {
  const { run, pending } = useActionRunner();
  const busy = pending !== null;

  const avatarInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const avatar = useObjectUrlPreview();

  const { card, gallery } = state;
  const maxGallery = state.plan.limits.max_gallery_items;
  const atLimit = maxGallery >= 0 && gallery.length >= maxGallery;

  async function uploadAvatar(file: File) {
    const data = new FormData();
    data.set("photo", file);
    await run("avatar", () => uploadProfilePhotoAction(card.id, data), {
      success: "Profile photo updated.",
    });
    avatar.clear();
    if (avatarInput.current) avatarInput.current.value = "";
  }

  async function removeAvatar() {
    const data = new FormData();
    data.set("remove", "true");
    await run("avatar", () => uploadProfilePhotoAction(card.id, data), {
      success: "Profile photo removed.",
    });
    avatar.clear();
    if (avatarInput.current) avatarInput.current.value = "";
  }

  async function addImage(file: File) {
    const data = new FormData();
    data.set("image", file);
    await run("gallery-add", () => addGalleryImageAction(card.id, data), {
      success: "Image added to your gallery.",
    });
    if (galleryInput.current) galleryInput.current.value = "";
  }

  async function removeImage(itemId: string) {
    await run(`gallery-${itemId}`, () => removeGalleryImageAction(itemId));
  }

  const avatarSrc = avatar.url ?? card.photoUrl;

  return (
    <div className="space-y-5">
      <Panel
        title="Profile photo"
        description="Shown in every design — it is the first thing people recognise."
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-2">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- the preview can be an ephemeral object URL, which the image optimiser cannot fetch
              <img src={avatarSrc} alt="" className="size-full object-cover" />
            ) : (
              <UserRound className="size-7 text-subtle" aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => avatarInput.current?.click()}
              >
                {busy && pending === "avatar" ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-3.5" aria-hidden />
                )}
                {card.photoUrl || avatar.url ? "Replace photo" : "Upload photo"}
              </Button>

              {card.photoUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void removeAvatar()}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </Button>
              ) : null}
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
              JPG, PNG, WebP or AVIF · up to 5 MB. A square image looks best.
            </p>
          </div>

          {/* The native control is the real input so the OS picker, drag and
              paste all work; it stays hidden behind the button above. */}
          <input
            ref={avatarInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            aria-label="Profile photo file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              // Show the new face immediately; the saved URL replaces it when the
              // read model comes back.
              avatar.preview(file);
              void uploadAvatar(file);
            }}
            disabled={busy}
          />
        </div>
      </Panel>

      <Panel
        title="Gallery"
        description="Photos and work samples, shown in the gallery section."
        action={
          <span className="text-[12px] text-muted">
            {maxGallery < 0
              ? `${gallery.length} images`
              : `${gallery.length} of ${maxGallery} used`}
          </span>
        }
      >
        {gallery.length > 0 ? (
          <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {gallery.map((item) => (
              <li
                key={item.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded originals from the storage bucket are already sized sensibly; optimising them again costs a server round trip per thumbnail
                */}
                <img
                  src={item.imageUrl}
                  alt={item.caption ?? "Gallery image"}
                  className="size-full object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => void removeImage(item.id)}
                  disabled={busy}
                  aria-label={`Remove ${item.caption ?? "gallery image"}`}
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-fg/85 px-2 py-1.5 text-[11px] font-medium text-bg opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
                >
                  {pending === `gallery-${item.id}` ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-3" aria-hidden />
                  )}
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted">
            No images yet. Add a few and they appear in the gallery section.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy || atLimit}
            onClick={() => galleryInput.current?.click()}
          >
            {pending === "gallery-add" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-3.5" aria-hidden />
            )}
            Add image
          </Button>

          {atLimit ? (
            <p className="text-[12.5px] text-muted">
              Your {state.plan.name} plan includes {maxGallery} gallery images.{" "}
              <Link href="/#pricing" className="underline underline-offset-2">
                Upgrade
              </Link>{" "}
              for more.
            </p>
          ) : null}

          <input
            ref={galleryInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            aria-label="Gallery image file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void addImage(file);
            }}
            disabled={busy || atLimit}
          />
        </div>
      </Panel>
    </div>
  );
}