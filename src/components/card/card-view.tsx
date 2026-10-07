import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Quote,
  Sparkles,
  Store,
} from "lucide-react";

import {
  Rating,
  SaveContactButton,
  ShareButton,
  StickyActions,
  TrackedLink,
  ViewTracker,
  WhatsappIcon,
} from "@/components/card/actions";
import { OpenNowPill } from "@/components/card/open-now-pill";
import { AppointmentForm, EnquiryForm, PriceTag } from "@/components/card/forms";
import { GalleryGrid } from "@/components/card/gallery";
import { QrImage, UpiQr } from "@/components/card/qr";
import {
  accentTextClass,
  avatarClass,
  avatarSizeForLayout,
  buttonClass,
  itemCardClass,
  nameClass,
  sectionBodyPad,
  sectionSpacing,
  sectionSurface,
  sectionTitleClass,
  themeStyle,
} from "@/lib/cards/theme";
import { SECTION_META } from "@/lib/cards/sections";
import {
  resolveCta,
  type BusinessHour,
  type CardData,
  type CardSection,
  type CtaType,
  type Layout,
  type SectionKey,
} from "@/lib/cards/types";
import { cn, discountPercent, formatINR, toEmbedUrl } from "@/lib/utils";

/**
 * Public card renderer.
 *
 * A Server Component: every section renders to HTML on the server, so the card
 * is indexable and appears instantly on a slow connection (sections 50 and 73).
 * Only genuinely interactive pieces — forms, gallery, share, tracking — are
 * client components imported into this tree.
 *
 * All theming flows through `--c-*` custom properties scoped to the root, so the
 * ten themes need no per-theme component.
 */

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(mins).padStart(2, "0")} ${suffix}`;
}

/** Is the business open right now, in the visitor's timezone? (section 20) */
export function isOpenNow(hours: BusinessHour[]): { open: boolean; today: BusinessHour | null } {
  const now = new Date();
  const today = hours.find((h) => h.dayOfWeek === now.getDay()) ?? null;
  if (!today?.isOpen) return { open: false, today };
  if (today.is24h) return { open: true, today };
  if (today.opensAt === null || today.closesAt === null) return { open: false, today };
  const minutes = now.getHours() * 60 + now.getMinutes();
  return { open: minutes >= today.opensAt && minutes < today.closesAt, today };
}

export function CardView({
  card,
  demo = false,
  preview = false,
}: {
  card: CardData;
  /** Renders the "sample card" chrome. Never set on a real card route. */
  demo?: boolean;
  /**
   * Marketing preview mode: no analytics beacon and no sticky action bar.
   *
   * The preview renders the *real* renderer so what a visitor sees on the landing
   * page is exactly what they get — but it must not record a view against a
   * fixture id that may not exist, and a `position: fixed` bar has no meaning
   * inside a phone mock-up.
   */
  preview?: boolean;
}) {
  const theme = card.theme;
  const ordered = [...card.sections].sort((a, b) => a.position - b.position);

  // `showcase` bleeds its hero to the viewport edges and pins the identity over
  // the photo, so it opts out of the shared page container.
  if (theme.layout === "showcase") {
    return (
      <div className="dv-card" style={themeStyle(theme)}>
        {preview ? null : <ViewTracker cardId={card.id} username={card.username} />}
        {demo ? <DemoBanner /> : null}
        <ShowcaseLayout card={card} sections={ordered} preview={preview} />
        <CardFooter card={card} demo={demo} />
        {preview ? null : <StickyActions card={card} />}
      </div>
    );
  }

  return (
    <div className="dv-card" style={themeStyle(theme)}>
      {preview ? null : <ViewTracker cardId={card.id} username={card.username} />}

      <div className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
        {demo ? <DemoBanner /> : null}

        <div className="mx-auto w-full max-w-2xl pb-24">
          <IdentityBlock card={card} />

          <div className={cn("px-4 sm:px-5", theme.layout === "mosaic" && "mosaic-grid")}>
            {ordered
              .filter((section) => section.enabled)
              .map((section) => (
                <CardSectionBlock
                  key={section.key}
                  card={card}
                  sectionKey={section.key}
                  config={section.config}
                  preview={preview}
                />
              ))}
          </div>

          <CardFooter card={card} demo={demo} />
        </div>
      </div>

      {preview ? null : <StickyActions card={card} />}
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-400/95 px-4 py-1.5 text-[12px] font-semibold text-amber-950 backdrop-blur">
      <Sparkles className="size-3.5" aria-hidden />
      Sample card — create your own in about two minutes
    </div>
  );
}

/* ── Identity ──────────────────────────────────────────────────────────────── */

function IdentityBlock({ card }: { card: CardData }) {
  const theme = card.theme;
  const layout = theme.layout;

  // `poster` and `ledger` are both left-aligned, but poster centres its avatar
  // above an oversized name while ledger keeps everything on one horizontal row.
  const isCentered = layout === "centered" || layout === "editorial" || layout === "poster";
  const showCover = theme.showCover && Boolean(card.coverUrl);

  const identity = (
    <div
      className={cn(
        "flex flex-col",
        isCentered ? "items-center text-center" : "items-start text-left",
        layout === "split" && "sm:flex-row sm:items-center sm:gap-5 sm:text-left",
        layout === "editorial" && "gap-4",
        layout === "poster" && "gap-3",
        layout === "ledger" && "flex-row items-center gap-3.5",
        layout === "mosaic" && "flex-row items-center gap-3.5",
      )}
    >
      <Avatar card={card} />

      <div className="min-w-0 flex-1">
        <h1
          className={cn(nameClass(theme.nameStyle), "text-balance")}
          style={{
            fontSize: `calc(1.5rem * var(--c-font-scale) * ${
              layout === "editorial" ? 1.25 : layout === "poster" ? 1.7 : 1
            })`,
            lineHeight: 1.15,
          }}
        >
          {card.fullName}
        </h1>

        {card.designation ? (
          <p
            className={cn(
              "mt-1.5 text-[15px] leading-snug",
              accentTextClass(theme.accentMode),
            )}
            style={{ fontWeight: 500, color: theme.accentMode === "bold" ? undefined : "var(--c-fg)" }}
          >
            {card.designation}
          </p>
        ) : null}

        {card.company ? (
          <p className="mt-0.5 text-[13px] text-[var(--c-muted)]">{card.company}</p>
        ) : null}

        <OpenNowPill businessHours={card.businessHours} showBusinessHours={card.showBusinessHours} />

        <PrimaryActions card={card} align={isCentered ? "center" : "start"} />
      </div>
    </div>
  );

  // `poster` promotes the type and skips the banner chrome entirely; `ledger`
  // gets a single hairline instead of a band.
  if (layout === "poster") {
    return (
      <header className="px-4 pt-10 pb-2 sm:px-5">
        {identity}
        <div className="mt-6 h-px w-full" style={{ backgroundColor: "var(--c-border)" }} />
      </header>
    );
  }

  if (layout === "ledger") {
    return (
      <header className="px-4 pt-6 pb-2 sm:px-5">
        {identity}
        <div className="mt-5 h-px w-full" style={{ backgroundColor: "var(--c-accent)" }} />
      </header>
    );
  }

  if (layout === "mosaic") {
    return (
      <header className="px-4 pt-5 pb-1 sm:px-5">
        <div
          className={cn(
            sectionSurface(theme.sectionStyle) || "rounded-2xl",
            "flex flex-row items-center gap-3.5 p-3",
          )}
        >
          {identity}
        </div>
      </header>
    );
  }

  return (
    <header>
      <HeroBanner card={card} />
      <div
        className={cn(
          "px-4 sm:px-5",
          sectionSpacing(theme.density),
          // On a cover layout the avatar is pulled up to overlap the image.
          showCover && "-mt-12 sm:-mt-14",
        )}
      >
        <div
          className={cn(
            theme.hero === "cover" || theme.hero === "solid"
              ? "rounded-2xl border border-[var(--c-border)] bg-[var(--c-surface)] p-5 shadow-sm"
              : "",
          )}
        >
          {identity}
        </div>
      </div>
    </header>
  );
}

/**
 * The banner band above the identity.
 *
 * `photo` and `accent` are the taller, heavier variants used by `showcase`; they
 * fall back to a gradient when a card has no cover, so a template never renders a
 * hole where an image should be.
 */
function HeroBanner({ card }: { card: CardData }) {
  const theme = card.theme;
  const { hero } = theme;

  if (hero === "none") return null;

  if ((hero === "cover" || hero === "photo") && card.coverUrl) {
    return (
      <div className={cn("relative w-full overflow-hidden", hero === "photo" ? "h-52 sm:h-64" : "h-40 sm:h-48")}>
        <Image
          src={card.coverUrl}
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 100vw, 640px"
          className="object-cover"
        />
        <div
          className={cn(
            "absolute inset-0",
            hero === "photo"
              ? "bg-gradient-to-t from-black/70 via-black/25 to-transparent"
              : "bg-gradient-to-b from-black/45 via-black/5 to-transparent",
          )}
        />
      </div>
    );
  }

  if (hero === "gradient") {
    return (
      <div
        className="h-28 w-full sm:h-32"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--c-accent) 0%, var(--c-accent-soft) 100%)",
        }}
      />
    );
  }

  if (hero === "accent") {
    return (
      <div
        className="h-20 w-full sm:h-24"
        style={{
          backgroundImage:
            "linear-gradient(120deg, var(--c-accent) 0%, var(--c-fg) 140%)",
        }}
      />
    );
  }

  // `solid`, and the no-cover fallback for `photo`/`accent`.
  return <div className="h-1.5 w-full" style={{ backgroundColor: "var(--c-accent)" }} />;
}

/**
 * `showcase` — a full-bleed photo hero with the identity pinned over it.
 *
 * It bypasses the shared page container entirely, so the photo runs to the
 * viewport edges on every width. When there is no cover image the hero falls back
 * to a tinted band and the identity still reads against a dark scrim.
 */
function ShowcaseLayout({
  card,
  sections,
  preview = false,
}: {
  card: CardData;
  sections: CardSection[];
  preview?: boolean;
}) {
  const theme = card.theme;

  return (
    <div className="min-h-dvh bg-[var(--c-bg)] text-[var(--c-fg)]">
      <header className="relative">
        <div className="relative h-72 w-full overflow-hidden sm:h-96">
          {card.coverUrl ? (
            <Image
              src={card.coverUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="size-full"
              style={{
                backgroundImage: "linear-gradient(150deg, var(--c-accent) 0%, var(--c-fg) 130%)",
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto w-full max-w-2xl px-5 pb-7">
            <div className="flex items-end gap-4">
              <Avatar card={card} />
              <div className="min-w-0 flex-1 pb-1">
                <h1
                  className={cn(nameClass(theme.nameStyle), "text-balance text-white")}
                  style={{
                    fontSize: "calc(1.75rem * var(--c-font-scale))",
                    lineHeight: 1.1,
                    textShadow: "0 1px 12px rgb(0 0 0 / 0.35)",
                  }}
                >
                  {card.fullName}
                </h1>
                {card.designation ? (
                  <p
                    className="mt-1.5 text-[15px] leading-snug text-white/90"
                    style={{ fontWeight: 500 }}
                  >
                    {card.designation}
                  </p>
                ) : null}
                {card.company ? (
                  <p className="mt-0.5 text-[13px] text-white/70">{card.company}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-4 pt-6 sm:px-5">
        <PrimaryActions card={card} align="start" />

        <div className="mt-4">
          {sections
            .filter((section) => section.enabled)
            .map((section) => (
              <CardSectionBlock
                key={section.key}
                card={card}
                sectionKey={section.key}
                config={section.config ?? {}}
                preview={preview}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function Avatar({ card }: { card: CardData }) {
  const theme = card.theme;
  const sizeClass = avatarSizeForLayout(theme);
  // `showcase` pins the avatar over a photo, so the ring is light, not surface-coloured.
  const ring = theme.layout === "showcase" ? "border-white/70" : "border-[var(--c-surface)]";
  const initials =
    card.fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "TZ";

  if (card.photoUrl) {
    return (
      <Image
        src={card.photoUrl}
        alt={card.fullName}
        width={112}
        height={112}
        priority
        className={cn(
          sizeClass,
          avatarClass(theme.avatarShape),
          "shrink-0 border-2 object-cover shadow-sm",
          ring,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        avatarClass(theme.avatarShape),
        "flex shrink-0 items-center justify-center border-2 text-white shadow-sm",
        ring,
      )}
      style={{ backgroundColor: "var(--c-accent)" }}
      aria-hidden
    >
      <span
        className="font-semibold tracking-tight"
        style={{
          fontSize: `calc(${theme.avatarSize === "xl" ? "2.1" : theme.avatarSize === "lg" ? "1.7" : "1.3"}rem * var(--c-font-scale))`,
        }}
      >
        {initials}
      </span>
    </div>
  );
}



function PrimaryActions({
  card,
  align,
}: {
  card: CardData;
  align: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap gap-2",
        align === "center" ? "justify-center" : "justify-start",
      )}
    >
      {card.whatsapp ? (
        <TrackedLink
          cardId={card.id}
          eventType="whatsapp_click"
          href={`https://wa.me/91${card.whatsapp}`}
          external
          className={cn(
            "inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition-[filter] active:scale-[0.98]",
            buttonClass(card.theme.buttonStyle),
          )}
        >
          <WhatsappIcon className="size-4" />
          WhatsApp
        </TrackedLink>
      ) : null}

      {card.phone ? (
        <TrackedLink
          cardId={card.id}
          eventType="call_click"
          href={`tel:+91${card.phone}`}
          className={cn(
            "inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition-[filter] active:scale-[0.98]",
            buttonClass(card.theme.buttonStyle),
          )}
        >
          <Phone className="size-4" />
          Call
        </TrackedLink>
      ) : null}

      {card.email ? (
        <TrackedLink
          cardId={card.id}
          eventType="email_click"
          href={`mailto:${card.email}`}
          className={cn(
            "inline-flex h-10 items-center gap-2 px-4 text-sm font-medium transition-[filter] active:scale-[0.98]",
            buttonClass(card.theme.buttonStyle),
          )}
        >
          <Mail className="size-4" />
          Email
        </TrackedLink>
      ) : null}

      <SaveContactButton
        card={card}
        variant={card.theme.buttonStyle === "solid" ? "outline" : "solid"}
        size="sm"
        className="h-10"
      />
    </div>
  );
}

/* ── Section shell ─────────────────────────────────────────────────────────── */

/**
 * The two form sections carry their own heading inside their body, so they are
 * the exception to `SECTION_META.title`.
 */
const FORM_SECTION_TITLES: Partial<Record<SectionKey, string>> = {
  enquiry: "Send an enquiry",
  appointment: "Book an appointment",
};

function CardSectionBlock({
  card,
  sectionKey,
  config,
  preview = false,
}: {
  card: CardData;
  sectionKey: SectionKey;
  config: Record<string, unknown>;
  preview?: boolean;
}) {
  const theme = card.theme;
  const title = FORM_SECTION_TITLES[sectionKey] ?? SECTION_META[sectionKey].title;

  // Sections render nothing when they have no content, so an unconfigured
  // section never shows an empty heading.
  if (!sectionHasContent(sectionKey, card)) return null;

  const surface =
    theme.sectionStyle === "card"
      ? "rounded-2xl bg-[var(--c-surface)] shadow-sm ring-1 ring-[var(--c-border)]"
      : theme.sectionStyle === "panel"
        ? "rounded-2xl bg-[var(--c-accent-soft)]"
        : "";

  return (
    <section
      id={sectionKey === "enquiry" ? "enquiry" : undefined}
      className={cn(surface, sectionSpacing(theme.density), mosaicSpanClass(card.theme.layout, sectionKey))}
      aria-labelledby={`${sectionKey}-heading`}
    >
      <div className={sectionBodyPad(theme.sectionStyle, theme.density)}>
        {title ? (
          <h2
            id={`${sectionKey}-heading`}
            className={cn(
              sectionTitleClass(theme.sectionTitleStyle),
              theme.sectionTitleStyle === "normal" &&
                "text-[15px] font-semibold tracking-tight text-[var(--c-fg)]",
              theme.sectionTitleStyle === "rule" && "font-semibold",
            )}
            style={
              theme.sectionTitleStyle === "normal"
                ? { fontSize: "calc(0.95rem * var(--c-font-scale))" }
                : undefined
            }
          >
            {title}
          </h2>
        ) : null}

        <div
          className={cn(
            title &&
              theme.sectionStyle !== "card" &&
              theme.sectionStyle !== "panel" &&
              "mt-4",
            title && theme.sectionTitleStyle === "rule" && "mt-4",
          )}
        >
          <SectionContent card={card} sectionKey={sectionKey} config={config} preview={preview} />
        </div>
      </div>
    </section>
  );
}

/**
 * `mosaic` lays sections out on a two-column grid. The first section and the
 * forms each take the full width, since a narrow column would squeeze them.
 */
function mosaicSpanClass(layout: Layout, key: SectionKey): string {
  if (layout !== "mosaic") return "";
  if (key === "about" || key === "enquiry" || key === "appointment") return "sm:col-span-2";
  return "";
}

function sectionHasContent(key: SectionKey, card: CardData): boolean {
  switch (key) {
    case "about":
      return Boolean(card.bio);
    case "contact":
      return Boolean(card.phone || card.email || card.website || card.address);
    case "social":
      return card.socialLinks.length > 0;
    case "services":
      return card.services.length > 0;
    case "products":
      return card.products.length > 0;
    case "catalogue":
      return card.catalogues.length > 0;
    case "portfolio":
      return card.portfolio.length > 0;
    case "gallery":
      return card.gallery.length > 0;
    case "video":
      return card.videos.length > 0;
    case "payment":
      return Boolean(card.payment?.isActive && card.payment.upiId);
    case "location":
      return Boolean(card.address || card.city);
    case "business_hours":
      return card.showBusinessHours && card.businessHours.length > 0;
    case "reviews":
      return card.reviews.length > 0;
    case "testimonials":
      return card.testimonials.length > 0;
    case "offers":
      return card.offers.length > 0;
    case "enquiry":
      return card.openToEnquiries;
    case "appointment":
      return card.openToAppointments;
    default:
      return false;
  }
}

function SectionContent({
  card,
  sectionKey,
  config,
  preview = false,
}: {
  card: CardData;
  sectionKey: SectionKey;
  config: Record<string, unknown>;
  preview?: boolean;
}) {
  const theme = card.theme;

  switch (sectionKey) {
    case "about":
      return (
        <p className="text-[15px] leading-relaxed whitespace-pre-line text-[var(--c-muted)]">
          {card.bio}
        </p>
      );

    case "contact":
      return <ContactList card={card} />;

    case "social":
      return <SocialGrid card={card} />;

    case "services":
      return (
        <ul className="space-y-2.5">
          {card.services.map((service) => (
            <li key={service.id} className={cn(itemCardClass(theme.cardStyle), "p-3.5")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-[var(--c-fg)]">
                    {service.name}
                  </h3>
                  {service.description ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--c-muted)]">
                      {service.description}
                    </p>
                  ) : null}
                </div>
                {service.pricePaise ? (
                  <PriceTag pricePaise={service.pricePaise} className="shrink-0" />
                ) : null}
              </div>
              <CtaLink
                card={card}
                ctaType={service.ctaType}
                ctaValue={service.ctaValue}
                label={service.ctaLabel ?? "Enquire"}
                message={`Hi ${card.fullName}, I'm interested in ${service.name}.`}
                className="mt-3"
              />
            </li>
          ))}
        </ul>
      );

    case "products":
      return (
        <ul className="space-y-2.5">
          {card.products.map((product) => {
            const off =
              product.originalPrice && product.salePrice
                ? discountPercent(product.originalPrice, product.salePrice)
                : 0;
            return (
              <li
                key={product.id}
                className={cn(itemCardClass(theme.cardStyle), "overflow-hidden")}
              >
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={400}
                    height={300}
                    loading="lazy"
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[15px] font-semibold text-[var(--c-fg)]">
                      {product.name}
                    </h3>
                    {off > 0 ? (
                      <span className="shrink-0 rounded-md bg-[var(--c-accent)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--c-accent-fg)]">
                        {off}% OFF
                      </span>
                    ) : null}
                  </div>
                  {product.description ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--c-muted)]">
                      {product.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-baseline gap-2">
                    {product.salePrice ? (
                      <>
                        <span className="text-[17px] font-semibold text-[var(--c-fg)] tabular">
                          {formatINR(product.salePrice)}
                        </span>
                        {product.originalPrice &&
                        product.originalPrice > product.salePrice ? (
                          <span className="text-[13px] text-[var(--c-muted)] line-through tabular">
                            {formatINR(product.originalPrice)}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <PriceTag pricePaise={product.originalPrice} />
                    )}
                  </div>
                  <CtaLink
                    card={card}
                    ctaType={product.ctaType}
                    ctaValue={product.ctaValue}
                    label={product.ctaLabel ?? "Buy Now"}
                    message={`Hi ${card.fullName}, I'd like to buy ${product.name}.`}
                    className="mt-3"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      );

    case "catalogue":
      return (
        <div className="space-y-4">
          {card.catalogues.map((catalogue) => (
            <div key={catalogue.id}>
              <h3 className="text-[15px] font-semibold text-[var(--c-fg)]">
                {catalogue.title}
              </h3>
              {catalogue.description ? (
                <p className="mt-0.5 text-[13px] text-[var(--c-muted)]">
                  {catalogue.description}
                </p>
              ) : null}
              <ul className="mt-2.5 space-y-2">
                {catalogue.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--c-border)] px-3.5 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--c-fg)]">
                        {item.name}
                      </p>
                      {item.description ? (
                        <p className="mt-0.5 text-[13px] leading-snug text-[var(--c-muted)]">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      {item.offerPaise ?? item.pricePaise ? (
                        <>
                          <p className="text-sm font-semibold text-[var(--c-fg)] tabular">
                            {formatINR(item.offerPaise ?? item.pricePaise!)}
                          </p>
                          {item.offerPaise && item.pricePaise ? (
                            <p className="text-[12px] text-[var(--c-muted)] line-through tabular">
                              {formatINR(item.pricePaise)}
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );

    case "portfolio":
      return (
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {card.portfolio.map((item) => {
            const Wrapper = item.externalUrl ? "a" : "div";
            return (
              <li key={item.id} className={itemCardClass(theme.cardStyle)}>
                <Wrapper
                  {...(item.externalUrl
                    ? {
                        href: item.externalUrl,
                        target: "_blank",
                        rel: "noopener noreferrer",
                      }
                    : {})}
                  className="block"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={500}
                      height={375}
                      loading="lazy"
                      className={cn(
                        "w-full object-cover",
                        card.theme.imageRatio === "16/9" ? "h-40" : "h-44",
                      )}
                    />
                  ) : null}
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[var(--c-fg)]">
                        {item.title}
                      </h3>
                      {item.externalUrl ? (
                        <ArrowUpRight
                          className="size-4 shrink-0 text-[var(--c-accent)]"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1 text-[13px] leading-snug text-[var(--c-muted)]">
                        {item.description}
                      </p>
                    ) : null}
                    {item.category ? (
                      <p className="mt-2 text-[11px] font-medium tracking-wide text-[var(--c-accent)] uppercase">
                        {item.category}
                      </p>
                    ) : null}
                  </div>
                </Wrapper>
              </li>
            );
          })}
        </ul>
      );

    case "gallery":
      return <GalleryGrid items={card.gallery} />;

    case "video": {
      const video = card.videos[0];
      if (!video) return null;
      const embed = toEmbedUrl(video.url);
      return (
        <div>
          {embed ? (
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                src={embed}
                title={video.title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            </div>
          ) : (
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-3 p-4 transition-transform active:scale-[0.99]",
                itemCardClass(theme.cardStyle),
              )}
            >
              <PlayCircle className="size-8 shrink-0 text-[var(--c-accent)]" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[var(--c-fg)]">
                  {video.title}
                </span>
                <span className="text-[13px] text-[var(--c-muted)]">
                  Watch on YouTube or Vimeo
                </span>
              </span>
              <ExternalLink className="size-4 shrink-0 text-[var(--c-muted)]" aria-hidden />
            </a>
          )}
        </div>
      );
    }

    case "payment":
      return card.payment?.upiId ? (
        <UpiBlock card={card} upiId={card.payment.upiId} note={card.payment.note} />
      ) : null;

    case "location":
      return <LocationBlock card={card} />;

    case "business_hours":
      return <HoursBlock card={card} />;

    case "reviews": {
      const average =
        Math.round(
          (card.reviews.reduce((sum, r) => sum + r.rating, 0) / card.reviews.length) * 10,
        ) / 10;
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-semibold text-[var(--c-fg)] tabular">
              {average.toFixed(1)}
            </span>
            <div>
              <Rating value={Math.round(average)} />
              <p className="mt-0.5 text-[12px] text-[var(--c-muted)]">
                {card.reviews.length} review{card.reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {card.reviews.map((review) => (
              <li
                key={review.id}
                className={cn(itemCardClass(theme.cardStyle), "p-3.5")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--c-fg)]">
                    {review.authorName}
                  </p>
                  <Rating value={review.rating} />
                </div>
                {review.body ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--c-muted)]">
                    {review.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    case "testimonials":
      return (
        <ul className="space-y-2.5">
          {card.testimonials.map((testimonial) => (
            <li
              key={testimonial.id}
              className={cn(itemCardClass(theme.cardStyle), "p-4")}
            >
              <Quote
                className="size-4 text-[var(--c-accent)] opacity-50"
                aria-hidden
              />
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--c-fg)] italic">
                {testimonial.body}
              </p>
              <p className="mt-2.5 text-[13px] text-[var(--c-muted)]">
                <span className="font-semibold text-[var(--c-fg)]">
                  {testimonial.authorName}
                </span>
                {testimonial.authorDesignation || testimonial.authorCompany
                  ? ` · ${[testimonial.authorDesignation, testimonial.authorCompany]
                      .filter(Boolean)
                      .join(", ")}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      );

    case "offers":
      return (
        <ul className="space-y-2.5">
          {card.offers.map((offer) => (
            <li
              key={offer.id}
              className="relative overflow-hidden rounded-xl border border-[var(--c-border)] p-4"
              style={{ backgroundColor: "var(--c-accent-soft)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--c-fg)]">
                    {offer.title}
                  </h3>
                  {offer.description ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--c-muted)]">
                      {offer.description}
                    </p>
                  ) : null}
                </div>
                {offer.badge ? (
                  <span className="shrink-0 rounded-md bg-[var(--c-accent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--c-accent-fg)]">
                    {offer.badge}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      );

    case "enquiry":
      return (
        <div className="mx-auto max-w-md">
          <EnquiryForm cardId={card.id} ownerName={card.fullName} disabled={preview} />
        </div>
      );

    case "appointment":
      return (
        <div className="mx-auto max-w-md">
          <AppointmentForm
            cardId={card.id}
            ownerName={card.fullName}
            services={card.services.map((s) => s.name)}
            disabled={preview}
          />
        </div>
      );

    default:
      void config;
      return null;
  }
}

/* ── Section bodies ────────────────────────────────────────────────────────── */

function CtaLink({
  card,
  ctaType,
  ctaValue,
  label,
  message,
  className,
}: {
  card: CardData;
  ctaType: CtaType;
  ctaValue: string | null;
  label: string;
  message: string;
  className?: string;
}) {
  const resolved = resolveCta(card, ctaType, ctaValue, message);
  if (!resolved) return null;

  const isWhatsApp = ctaType === "whatsapp";
  const isCall = ctaType === "call";
  const eventType =
    isWhatsApp ? "whatsapp_click" : isCall ? "call_click" : ctaType === "website" ? "website_click" : "";

  return (
    <TrackedLink
      cardId={card.id}
      // An enquiry CTA jumps to a form, which is not an interaction worth
      // reporting; only outbound taps are tracked.
      eventType={eventType || "enquiry_cta_click"}
      href={resolved.href}
      external={resolved.external}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 text-sm font-medium transition-[filter]",
        buttonClass(card.theme.buttonStyle),
        card.theme.buttonStyle === "outline" ? "h-9 px-3.5" : "h-10 px-4",
        className,
      )}
    >
      {isWhatsApp ? <WhatsappIcon className="size-4" /> : null}
      {label}
      {!isWhatsApp && !isCall && resolved.external ? (
        <ExternalLink className="size-3.5" aria-hidden />
      ) : null}
    </TrackedLink>
  );
}

function ContactList({ card }: { card: CardData }) {
  type Row = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    href?: string;
    external?: boolean;
    eventType?: string;
  };

  // Built with explicit pushes rather than a chain of `cond && {...}` so every
  // row is typed as `Row` and the icon component stays assignable.
  const rows: Row[] = [];

  if (card.phone) {
    rows.push({
      icon: Phone,
      label: "Phone",
      value: card.phone,
      href: `tel:+91${card.phone}`,
      eventType: "call_click",
    });
  }

  if (card.whatsapp && card.whatsapp !== card.phone) {
    rows.push({
      icon: WhatsappIcon,
      label: "WhatsApp",
      value: card.whatsapp,
      href: `https://wa.me/91${card.whatsapp}`,
      external: true,
      eventType: "whatsapp_click",
    });
  }

  if (card.email) {
    rows.push({
      icon: Mail,
      label: "Email",
      value: card.email,
      href: `mailto:${card.email}`,
      eventType: "email_click",
    });
  }

  if (card.website) {
    rows.push({
      icon: ExternalLink,
      label: "Website",
      value: card.website.replace(/^https?:\/\//, ""),
      href: /^https?:\/\//i.test(card.website) ? card.website : `https://${card.website}`,
      external: true,
      eventType: "website_click",
    });
  }

  const address = [card.address, card.city, card.state, card.pincode].filter(Boolean).join(", ");
  if (address) {
    rows.push({ icon: MapPin, label: "Address", value: address });
  }

  return (
    <ul className="divide-y divide-[var(--c-border)]">
      {rows.map((row) => {
        const Icon = row.icon;
        const body = (
          <>
            <Icon className="size-4 shrink-0 text-[var(--c-accent)]" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] text-[var(--c-muted)]">{row.label}</span>
              <span className="block truncate text-sm text-[var(--c-fg)]">{row.value}</span>
            </span>
          </>
        );

        return (
          <li key={row.label}>
            {row.href ? (
              <TrackedLink
                cardId={card.id}
                eventType={row.eventType ?? "contact_click"}
                href={row.href}
                external={row.external}
                className="flex items-center gap-3 py-3 transition-opacity hover:opacity-80"
              >
                {body}
              </TrackedLink>
            ) : (
              <div className="flex items-center gap-3 py-3">{body}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X",
  twitter: "X",
  telegram: "Telegram",
  threads: "Threads",
  website: "Website",
  custom: "Link",
};

function SocialGrid({ card }: { card: CardData }) {
  return (
    <div className="flex flex-wrap gap-2">
      {card.socialLinks.map((link) => {
        const label = link.label ?? PLATFORM_LABELS[link.platform] ?? link.platform;
        return (
          <TrackedLink
            key={link.id}
            cardId={card.id}
            eventType="website_click"
            href={link.url}
            external
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 text-[13px] font-medium transition-[filter]",
              buttonClass(card.theme.buttonStyle),
              card.theme.buttonStyle === "outline" && "h-9",
              card.theme.buttonStyle === "solid" && "h-10",
            )}
          >
            {label}
            <ExternalLink className="size-3" aria-hidden />
          </TrackedLink>
        );
      })}
    </div>
  );
}

function UpiBlock({
  card,
  upiId,
  note,
}: {
  card: CardData;
  upiId: string;
  note: string | null;
}) {
  // A UPI intent link. Android and most UPI apps open this directly; iOS shows
  // the QR code in-app, which is why the QR is always rendered alongside it.
  const deepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&cu=INR${
    note ? `&pn=${encodeURIComponent(note)}` : ""
  }`;

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--c-muted)]">
        Scan the QR or tap to pay {card.payment?.payeeName ?? card.fullName} directly.
        Payments go straight to the account holder — Tzmicha It Solutions takes no cut.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm ring-1 ring-[var(--c-border)]">
          <UpiQr value={deepLink} size={152} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-[var(--c-muted)]">UPI ID</p>
          <p className="break-all text-sm font-medium text-[var(--c-fg)]">{upiId}</p>
          <TrackedLink
            cardId={card.id}
            eventType="upi_click"
            href={deepLink}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 px-3.5 text-sm font-medium transition-[filter] active:scale-[0.98]",
              buttonClass(card.theme.buttonStyle),
              card.theme.buttonStyle === "outline" ? "h-9" : "h-10",
            )}
          >
            Pay via UPI
          </TrackedLink>
        </div>
      </div>
    </div>
  );
}

function LocationBlock({ card }: { card: CardData }) {
  const hasCoords =
    typeof card.latitude === "number" && typeof card.longitude === "number";
  const mapsHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${card.latitude},${card.longitude}`
    : card.address || card.city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          [card.address, card.city, card.state, card.pincode, card.country]
            .filter(Boolean)
            .join(", "),
        )}`
      : null;

  return (
    <div className="space-y-3">
      <p className="flex gap-2.5 text-sm leading-relaxed text-[var(--c-muted)]">
        <MapPin className="mt-0.5 size-4 shrink-0 text-[var(--c-accent)]" aria-hidden />
        <span>
          {[card.address, card.city, card.state, card.pincode, card.country]
            .filter(Boolean)
            .join(", ")}
        </span>
      </p>
      {mapsHref ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 px-3.5 text-sm font-medium transition-[filter]",
            buttonClass(card.theme.buttonStyle),
            card.theme.buttonStyle === "outline" ? "h-9" : "h-10",
          )}
        >
          <Store className="size-4" aria-hidden />
          Open in Google Maps
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

function HoursBlock({ card }: { card: CardData }) {
  const { open, today } = isOpenNow(card.businessHours);
  const ordered = [...card.businessHours].sort(
    (a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7),
  );

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm">
        <Clock className="size-4 text-[var(--c-accent)]" aria-hidden />
        <span style={{ fontWeight: 600 }}>{open ? "Open now" : "Closed now"}</span>
        {today?.isOpen && !today.is24h && today.opensAt !== null && today.closesAt !== null ? (
          <span className="text-[var(--c-muted)]">
            · until {minutesToTime(today.closesAt)}
          </span>
        ) : null}
      </p>
      <dl className="divide-y divide-[var(--c-border)]">
        {ordered.map((hour) => (
          <div
            key={hour.dayOfWeek}
            className="flex items-baseline justify-between gap-3 py-2"
          >
            <dt
              className={cn(
                "text-sm",
                hour.dayOfWeek === today?.dayOfWeek
                  ? "font-semibold text-[var(--c-fg)]"
                  : "text-[var(--c-muted)]",
              )}
            >
              {DAY_NAMES[hour.dayOfWeek]}
            </dt>
            <dd className="text-sm text-[var(--c-muted)] tabular">
              {!hour.isOpen
                ? "Closed"
                : hour.is24h
                  ? "24 hours"
                  : hour.opensAt !== null && hour.closesAt !== null
                    ? `${minutesToTime(hour.opensAt)} – ${minutesToTime(hour.closesAt)}`
                    : "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────── */

function CardFooter({ card, demo }: { card: CardData; demo: boolean }) {
  const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dvcard.in"}/card/${card.username}`;

  return (
    <footer
      className={cn(
        "mt-6 flex flex-col items-center gap-4 px-4 py-8 text-center",
        "text-[var(--c-muted)]",
      )}
    >
      {/* QR code — always shown, encodes the card's public URL */}
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[var(--c-border)]">
          <QrImage
            value={cardUrl}
            size={140}
            alt={`QR code for ${card.fullName}'s digital visiting card`}
          />
        </div>
        <p className="text-[11.5px] text-[var(--c-muted)]">
          Scan to view this card
        </p>
      </div>

      <div className="flex items-center justify-center gap-2">
        <ShareButton
          cardId={card.id}
          card={card}
          label="Share card"
          variant="outline"
          size="sm"
        />
        <SaveContactButton card={card} variant="outline" size="sm" />
      </div>

      {card.showBranding ? (
        <p className="text-[12px]">
          {demo ? "Sample card" : "Made with"}{" "}
          <Link
            href="/"
            className="font-semibold text-[var(--c-accent)] underline underline-offset-2"
          >
            Tzmicha It Solutions
          </Link>
        </p>
      ) : null}
    </footer>
  );
}