"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

import { Panel, useActionRunner } from "@/components/builder/action-kit";
import { BuilderPhotosPanel } from "@/components/builder/panels/photos-panel";
import { Button } from "@/components/ui/button";
import { Input, Select, Switch, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";
import {
  saveBusinessHoursAction,
  savePaymentAction,
  saveProductsAction,
  saveServicesAction,
  saveSocialLinksAction,
} from "@/lib/cards/actions";
import type { PreviewDraft } from "@/lib/cards/editor-preview";
import type { EditorState } from "@/lib/cards/editor-types";
import type { CtaType } from "@/lib/cards/types";

/**
 * "Content" — photos, links, services, products, hours and UPI.
 *
 * Every list is edited as local rows and written wholesale by one action, because
 * that is what the actions do (delete-then-insert) and because it makes the
 * preview exact: what is on screen is exactly what will be saved.
 *
 * Rows carry a synthetic id while unsaved, so React keys stay stable without
 * pretending the database has already assigned one.
 */
export function BuilderContentPanel({
  state,
  draft,
  setDraft,
}: {
  state: EditorState;
  draft: PreviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}) {
  return (
    <div className="space-y-5">
      <LinksPanel state={state} draft={draft} setDraft={setDraft} />
      <PhotosPanel state={state} />
      <ServicesPanel state={state} draft={draft} setDraft={setDraft} />
      <ProductsPanel state={state} draft={draft} setDraft={setDraft} />
      <HoursPanel state={state} draft={draft} setDraft={setDraft} />
      <PaymentPanel state={state} draft={draft} setDraft={setDraft} />
    </div>
  );
}

/* ── Photos ──────────────────────────────────────────────────────────────── */

/** Profile photo and gallery — a different storage flow, so its own component. */
function PhotosPanel({ state }: { state: EditorState }) {
  return <BuilderPhotosPanel state={state} />;
}

/* ── Social links ───────────────────────────────────────────────────────── */

interface SocialDraft {
  id: string;
  platform: string;
  url: string;
  label: string;
}

const PLATFORMS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
  { value: "github", label: "GitHub" },
  { value: "website", label: "Website" },
  { value: "custom", label: "Something else" },
];

function LinksPanel(props: PanelProps) {
  const { state, draft, setDraft } = props;
  const { run, pending, lastSaved } = useActionRunner();
  const [rows, setRows] = useState<SocialDraft[]>(
    (draft.socialLinks ?? state.socials).map((row) => ({
      id: row.id,
      platform: row.platform,
      url: row.url,
      label: row.label ?? "",
    })),
  );

  function commit(next: SocialDraft[]) {
    setRows(next);
    setDraft((current) => ({ ...current, socialLinks: next.map((row, index) => ({
      id: row.id,
      platform: row.platform,
      url: row.url,
      label: row.label || null,
      position: (index + 1) * 10,
    })) }));
  }

  return (
    <Panel
      title="Links"
      description="Profile links shown as buttons. Order is the order they appear in."
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            commit([
              ...rows,
              { id: `new-${rows.length}-${rows.length}`, platform: "linkedin", url: "", label: "" },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          Add link
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No links yet"
          description="Add your LinkedIn, Instagram or website so people can find you elsewhere."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => commit([{ id: "new-0-0", platform: "linkedin", url: "", label: "" }])}
            >
              <Plus className="size-3.5" aria-hidden />
              Add your first link
            </Button>
          }
        />
      ) : (
        <>
          <ul className="space-y-2.5">
            {rows.map((row, index) => (
              <li key={row.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
                <div className="grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)_auto]">
                  <Select
                    label="Platform"
                    value={row.platform}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, platform: event.target.value } : r)))
                    }
                  >
                    {PLATFORMS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Link"
                    type="url"
                    placeholder="https://linkedin.com/in/you"
                    value={row.url}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, url: event.target.value } : r)))
                    }
                  />

                  <RemoveButton
                    label={`Remove link ${index + 1}`}
                    onClick={() => commit(rows.filter((_, i) => i !== index))}
                  />
                </div>

                <div className="mt-3">
                  <Input
                    label="Button text"
                    hint="Optional. Defaults to the platform name."
                    placeholder="View my portfolio"
                    value={row.label}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, label: event.target.value } : r)))
                    }
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <Button type="button" loading={pending === "social"}
              style={lastSaved === "social" && pending !== "social" ? { background: "var(--dv-success)" } : {}}
              onClick={() => run("social", () => saveSocialLinksAction({ cardId: state.card.id, rows }), { success: "Links saved." })}>
              {lastSaved === "social" && pending !== "social" ? "✓ Saved" : "Save links"}
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}

/* ── Services ───────────────────────────────────────────────────────────── */

const CTA_OPTIONS: { value: CtaType; label: string }[] = [
  { value: "enquiry", label: "Send an enquiry" },
  { value: "whatsapp", label: "WhatsApp me" },
  { value: "call", label: "Call me" },
  { value: "website", label: "Open a website" },
];

interface ServiceDraft {
  id: string;
  name: string;
  description: string;
  price: string;
  ctaType: CtaType;
  ctaLabel: string;
}

function ServicesPanel({ state, draft, setDraft }: PanelProps) {
  const { run, pending, lastSaved } = useActionRunner();
  const [rows, setRows] = useState<ServiceDraft[]>(
    (draft.services ?? state.services).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      price: row.pricePaise === null ? "" : String(row.pricePaise / 100),
      ctaType: row.ctaType,
      ctaLabel: row.ctaLabel ?? "",
    })),
  );

  const max = state.plan.limits.max_services;

  function commit(next: ServiceDraft[]) {
    setRows(next);
    setDraft((current) => ({
      ...current,
      services: next.map((row, index) => ({
        id: row.id,
        name: row.name,
        description: row.description || null,
        imageUrl: null,
        pricePaise: row.price.trim() === "" ? null : Math.round(Number(row.price) * 100),
        ctaType: row.ctaType,
        ctaLabel: row.ctaLabel || null,
        ctaValue: null,
        position: (index + 1) * 10,
      })),
    }));
  }

  return (
    <Panel
      title="Services"
      description="What you offer. Each one gets its own button."
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={max >= 0 && rows.length >= max}
          onClick={() =>
            commit([
              ...rows,
              {
                id: `new-${rows.length}-${rows.length}`,
                name: "",
                description: "",
                price: "",
                ctaType: "enquiry",
                ctaLabel: "",
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          Add service
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No services listed"
          description="Even one service makes the card worth saving — it is the first thing people look for."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                commit([
                  {
                    id: "new-0-0",
                    name: "",
                    description: "",
                    price: "",
                    ctaType: "enquiry",
                    ctaLabel: "",
                  },
                ])
              }
            >
              <Plus className="size-3.5" aria-hidden />
              Add a service
            </Button>
          }
        />
      ) : (
        <>
          {max >= 0 ? (
            <p className="mb-3 text-[13px] text-muted">
              {rows.length} of {max} used on the {state.plan.name} plan.
            </p>
          ) : null}

          <ul className="space-y-2.5">
            {rows.map((row, index) => (
              <li key={row.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_130px_auto]">
                  <Input
                    label="Service"
                    placeholder="Brand identity"
                    value={row.name}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, name: event.target.value } : r)))
                    }
                  />
                  <Input
                    label="Price"
                    inputMode="decimal"
                    placeholder="8500"
                    hint="Rupees. Leave blank to hide."
                    value={row.price}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, price: event.target.value } : r)))
                    }
                  />
                  <RemoveButton
                    label={`Remove service ${index + 1}`}
                    onClick={() => commit(rows.filter((_, i) => i !== index))}
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Textarea
                    label="Description"
                    rows={2}
                    placeholder="What the customer gets, in one or two lines."
                    value={row.description}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, description: event.target.value } : r)))
                    }
                  />
                  <div className="space-y-3">
                    <Select
                      label="Button does"
                      value={row.ctaType}
                      onChange={(event) =>
                        commit(
                          rows.map((r, i) =>
                            i === index ? { ...r, ctaType: event.target.value as CtaType } : r,
                          ),
                        )
                      }
                    >
                      {CTA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Button text"
                      hint="Optional."
                      placeholder="Enquire now"
                      value={row.ctaLabel}
                      onChange={(event) =>
                        commit(rows.map((r, i) => (i === index ? { ...r, ctaLabel: event.target.value } : r)))
                      }
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <Button type="button" loading={pending === "services"}
              style={lastSaved === "services" && pending !== "services" ? { background: "var(--dv-success)" } : {}}
              onClick={() => run("services", () => saveServicesAction({ cardId: state.card.id, rows: rows.map(row => ({ name: row.name, description: row.description, pricePaise: row.price.trim() === "" ? null : Math.round(Number(row.price) * 100), ctaType: row.ctaType, ctaLabel: row.ctaLabel, ctaValue: "" })) }), { success: "Services saved." })}>
              {lastSaved === "services" && pending !== "services" ? "✓ Saved" : "Save services"}
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}

/* ── Products ───────────────────────────────────────────────────────────── */

interface ProductDraft {
  id: string;
  name: string;
  description: string;
  original: string;
  sale: string;
  ctaType: CtaType;
  ctaLabel: string;
}

function ProductsPanel({ state, draft, setDraft }: PanelProps) {
  const { run, pending, lastSaved } = useActionRunner();
  const [rows, setRows] = useState<ProductDraft[]>(
    (draft.products ?? state.products).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      original: row.originalPrice === null ? "" : String(row.originalPrice / 100),
      sale: row.salePrice === null ? "" : String(row.salePrice / 100),
      ctaType: row.ctaType,
      ctaLabel: row.ctaLabel ?? "",
    })),
  );

  const max = state.plan.limits.max_products;

  function commit(next: ProductDraft[]) {
    setRows(next);
    setDraft((current) => ({
      ...current,
      products: next.map((row, index) => ({
        id: row.id,
        name: row.name,
        description: row.description || null,
        imageUrl: null,
        originalPrice: row.original.trim() === "" ? null : Math.round(Number(row.original) * 100),
        salePrice: row.sale.trim() === "" ? null : Math.round(Number(row.sale) * 100),
        ctaType: row.ctaType,
        ctaLabel: row.ctaLabel || null,
        ctaValue: null,
        position: (index + 1) * 10,
      })),
    }));
  }

  return (
    <Panel
      title="Products"
      description="Things you sell. Set a price on both to show a was/now discount."
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={max >= 0 && rows.length >= max}
          onClick={() =>
            commit([
              ...rows,
              {
                id: `new-${rows.length}-${rows.length}`,
                name: "",
                description: "",
                original: "",
                sale: "",
                ctaType: "enquiry",
                ctaLabel: "",
              },
            ])
          }
        >
          <Plus className="size-3.5" aria-hidden />
          Add product
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Use this for anything with a fixed price — a course, a package, a piece of work."
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                commit([
                  {
                    id: "new-0-0",
                    name: "",
                    description: "",
                    original: "",
                    sale: "",
                    ctaType: "enquiry",
                    ctaLabel: "",
                  },
                ])
              }
            >
              <Plus className="size-3.5" aria-hidden />
              Add a product
            </Button>
          }
        />
      ) : (
        <>
          {max >= 0 ? (
            <p className="mb-3 text-[13px] text-muted">
              {rows.length} of {max} used on the {state.plan.name} plan.
            </p>
          ) : null}

          <ul className="space-y-2.5">
            {rows.map((row, index) => (
              <li key={row.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_120px_auto]">
                  <Input
                    label="Product"
                    placeholder="Design audit"
                    value={row.name}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, name: event.target.value } : r)))
                    }
                  />
                  <Input
                    label="Was"
                    inputMode="decimal"
                    placeholder="999"
                    value={row.original}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, original: event.target.value } : r)))
                    }
                  />
                  <Input
                    label="Now"
                    inputMode="decimal"
                    placeholder="499"
                    value={row.sale}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, sale: event.target.value } : r)))
                    }
                  />
                  <RemoveButton
                    label={`Remove product ${index + 1}`}
                    onClick={() => commit(rows.filter((_, i) => i !== index))}
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Textarea
                    label="Description"
                    rows={2}
                    value={row.description}
                    onChange={(event) =>
                      commit(rows.map((r, i) => (i === index ? { ...r, description: event.target.value } : r)))
                    }
                  />
                  <div className="space-y-3">
                    <Select
                      label="Button does"
                      value={row.ctaType}
                      onChange={(event) =>
                        commit(
                          rows.map((r, i) =>
                            i === index ? { ...r, ctaType: event.target.value as CtaType } : r,
                          ),
                        )
                      }
                    >
                      {CTA_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                    <Input
                      label="Button text"
                      hint="Optional."
                      placeholder="Buy now"
                      value={row.ctaLabel}
                      onChange={(event) =>
                        commit(rows.map((r, i) => (i === index ? { ...r, ctaLabel: event.target.value } : r)))
                      }
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-end">
            <Button type="button" loading={pending === "products"}
              style={lastSaved === "products" && pending !== "products" ? { background: "var(--dv-success)" } : {}}
              onClick={() => run("products", () => saveProductsAction({ cardId: state.card.id, rows: rows.map(row => ({ name: row.name, description: row.description, originalPrice: row.original.trim() === "" ? null : Math.round(Number(row.original) * 100), salePrice: row.sale.trim() === "" ? null : Math.round(Number(row.sale) * 100), ctaType: row.ctaType, ctaLabel: row.ctaLabel, ctaValue: "" })) }), { success: "Products saved." })}>
              {lastSaved === "products" && pending !== "products" ? "✓ Saved" : "Save products"}
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}

/* ── Business hours ─────────────────────────────────────────────────────── */

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function HoursPanel({ state, setDraft }: PanelProps) {
  const { run, pending, lastSaved } = useActionRunner();
  const [rows, setRows] = useState(
    state.hours.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      isOpen: row.isOpen,
      opensAt: row.opensAt ?? "09:00",
      closesAt: row.closesAt ?? "18:30",
      is24h: row.is24h,
    })),
  );

  // A fresh card may have no hours rows at all; the panel still shows the week so
  // it can be filled in.
  const week = DAYS.map((_, dayOfWeek) => rows.find((row) => row.dayOfWeek === dayOfWeek) ?? {
    dayOfWeek,
    isOpen: false,
    opensAt: "09:00",
    closesAt: "18:30",
    is24h: false,
  });

  function commit(next: typeof week) {
    setRows(next);
    setDraft((current) => ({
      ...current,
      businessHours: next.map((row) => ({
        dayOfWeek: row.dayOfWeek,
        isOpen: row.isOpen,
        opensAt: row.is24h ? 0 : toMinutes(row.opensAt),
        closesAt: row.is24h ? 1439 : toMinutes(row.closesAt),
        is24h: row.is24h,
      })),
    }));
  }

  return (
    <Panel
      title="Business hours"
      description="A live open/closed indicator appears on your card while you are open."
    >
      <ul className="space-y-2">
        {week.map((row) => {
          const patch = (next: Partial<(typeof week)[number]>) =>
            commit(
              week.map((item) =>
                item.dayOfWeek === row.dayOfWeek ? { ...item, ...next } : item,
              ),
            );

          return (
            <li
              key={row.dayOfWeek}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-3.5 py-2.5"
            >
              <div className="w-24">
                <p className="text-[14px] font-medium text-fg">{DAYS[row.dayOfWeek]}</p>
              </div>

              <div className="min-w-[180px] flex-1">
                <Switch
                  id={`hours-${row.dayOfWeek}`}
                  label={row.isOpen ? "Open" : "Closed"}
                  description={undefined}
                  checked={row.isOpen}
                  onCheckedChange={(next) => patch({ isOpen: next })}
                />
              </div>

              {row.isOpen && !row.is24h ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    label="Opens"
                    value={row.opensAt}
                    onChange={(event) => patch({ opensAt: event.target.value })}
                  />
                  <Input
                    type="time"
                    label="Closes"
                    value={row.closesAt}
                    onChange={(event) => patch({ closesAt: event.target.value })}
                  />
                </div>
              ) : null}

              {row.isOpen ? (
                <label className="flex items-center gap-2 text-[13px] text-muted">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border"
                    checked={row.is24h}
                    onChange={(event) => patch({ is24h: event.target.checked })}
                  />
                  Open 24 hours
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex justify-end">
        <Button type="button" loading={pending === "hours"}
          style={lastSaved === "hours" && pending !== "hours" ? { background: "var(--dv-success)" } : {}}
          onClick={() => run("hours", () => saveBusinessHoursAction({ cardId: state.card.id, rows: week.map(row => ({ dayOfWeek: row.dayOfWeek, isOpen: row.isOpen, opensAt: row.opensAt, closesAt: row.closesAt, is24h: row.is24h })) }), { success: "Business hours saved." })}>
          {lastSaved === "hours" && pending !== "hours" ? "✓ Saved" : "Save hours"}
        </Button>
      </div>
    </Panel>
  );
}

function toMinutes(value: string): number | null {
  const [hours, mins] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return Math.min(1439, hours * 60 + mins);
}

/* ── UPI ────────────────────────────────────────────────────────────────── */

function PaymentPanel({ state, setDraft }: PanelProps) {
  const { run, pending, lastSaved } = useActionRunner();
  const [upiId, setUpiId] = useState(state.payment?.upiId ?? "");
  const [payeeName, setPayeeName] = useState(state.payment?.payeeName ?? "");
  const [note, setNote] = useState(state.payment?.note ?? "");
  const [isActive, setIsActive] = useState(state.payment?.isActive ?? true);

  return (
    <Panel
      title="UPI payments"
      description="Visitors scan a QR or tap a link to pay you directly. Clearing the UPI ID removes the section."
    >
      <div className="space-y-4">
        <Input
          label="UPI ID"
          placeholder="yourname@okhdfcbank"
          value={upiId}
          onChange={(event) => {
            setUpiId(event.target.value);
            setDraft((current) => ({
              ...current,
              payment: {
                upiId: event.target.value || null,
                payeeName: payeeName || null,
                note: note || null,
                isActive,
              },
            }));
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Payee name"
            hint="Shown to the payer."
            value={payeeName}
            onChange={(event) => {
              setPayeeName(event.target.value);
              setDraft((current) => ({
                ...current,
                payment: {
                  upiId: upiId || null,
                  payeeName: event.target.value || null,
                  note: note || null,
                  isActive,
                },
              }));
            }}
          />
          <Input
            label="Note"
            hint="Pre-filled in the payment app."
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setDraft((current) => ({
                ...current,
                payment: {
                  upiId: upiId || null,
                  payeeName: payeeName || null,
                  note: event.target.value || null,
                  isActive,
                },
              }));
            }}
          />
        </div>

        <Switch
          id="payment-active"
          label="Accept payments"
          description="Turn off to keep the section but hide the pay button."
          checked={isActive}
          onCheckedChange={(next) => {
            setIsActive(next);
            setDraft((current) => ({
              ...current,
              payment: {
                upiId: upiId || null,
                payeeName: payeeName || null,
                note: note || null,
                isActive: next,
              },
            }));
          }}
        />

        <div className="flex justify-end">
          <Button type="button" loading={pending === "payment"}
            style={lastSaved === "payment" && pending !== "payment" ? { background: "var(--dv-success)" } : {}}
            onClick={() => run("payment", () => savePaymentAction(null, toFormData({ cardId: state.card.id, upiId, payeeName, note, isActive })), { success: "Payment settings saved." })}>
            {lastSaved === "payment" && pending !== "payment" ? "✓ Saved" : "Save payments"}
          </Button>
        </div>

        {upiId ? (
          <p className="flex items-center gap-2 text-[13px] text-muted">
            <Check className="size-3.5 shrink-0 text-success" aria-hidden />
            Visitors will be able to pay{" "}
            <strong className="font-medium text-fg">{upiId}</strong> at any amount.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

function toFormData(input: {
  cardId: string;
  upiId: string;
  payeeName: string;
  note: string;
  isActive: boolean;
}) {
  const data = new FormData();
  data.set("cardId", input.cardId);
  data.set("upiId", input.upiId);
  data.set("payeeName", input.payeeName);
  data.set("note", input.note);
  data.set("isActive", input.isActive ? "true" : "false");
  return data;
}

/* ── Shared bits ────────────────────────────────────────────────────────── */

interface PanelProps {
  state: EditorState;
  draft: PreviewDraft;
  setDraft: React.Dispatch<React.SetStateAction<PreviewDraft>>;
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={label}
      className="self-end text-muted hover:text-danger"
    >
      <Trash2 className="size-4" aria-hidden />
      <span className="sr-only">Remove</span>
    </Button>
  );
}