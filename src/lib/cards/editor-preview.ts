import type { EditorState } from "@/lib/cards/editor-types";
import type { BusinessHour, CardData, CardSection, ThemeConfig } from "@/lib/cards/types";

/**
 * Editor state → `CardData`, for the builder's live preview.
 *
 * The builder shows the *real* renderer, so the preview must be fed a real
 * `CardData`. Two rules make that honest:
 *
 *  1. No invented content. Collections the builder does not edit are passed
 *     through from `state.extras`; if the owner has none, the section renders
 *     empty — which is what a visitor would see, not a placeholder.
 *  2. Local drafts win. Unsaved form state is overlaid here so typing updates
 *     the preview immediately, and a failed save leaves the preview showing
 *     exactly what the user sees in the form rather than snapping back.
 */

export interface PreviewDraft {
  card?: Partial<CardData>;
  theme?: ThemeConfig;
  sections?: CardSection[];
  socialLinks?: CardData["socialLinks"];
  services?: CardData["services"];
  products?: CardData["products"];
  gallery?: CardData["gallery"];
  businessHours?: CardData["businessHours"];
  payment?: CardData["payment"];
}

function minutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const [hours, mins] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return null;
  return Math.min(1439, hours * 60 + mins);
}

export function editorPreview(state: EditorState, draft: PreviewDraft = {}): CardData {
  const { card, extras, plan } = state;

  const sections =
    draft.sections ??
    state.sections.map((section, index) => ({
      key: section.key,
      enabled: section.enabled,
      position: section.position || index,
      config: {},
    }));

  return {
    id: card.id,
    username: draft.card?.username ?? card.username,
    type: card.type,
    fullName: draft.card?.fullName ?? card.fullName,
    designation: draft.card?.designation ?? card.designation,
    company: draft.card?.company ?? card.company,
    bio: draft.card?.bio ?? card.bio,
    photoUrl: draft.card?.photoUrl ?? card.photoUrl,
    coverUrl: draft.card?.coverUrl ?? card.coverUrl,
    logoUrl: card.logoUrl,

    phone: draft.card?.phone ?? card.phone,
    whatsapp: draft.card?.whatsapp ?? card.whatsapp,
    email: draft.card?.email ?? card.email,
    website: draft.card?.website ?? card.website,

    address: draft.card?.address ?? card.address,
    city: draft.card?.city ?? card.city,
    state: draft.card?.state ?? card.state,
    country: card.country,
    pincode: draft.card?.pincode ?? card.pincode,
    latitude: card.latitude,
    longitude: card.longitude,

    showBusinessHours: draft.card?.showBusinessHours ?? card.showBusinessHours,
    openToEnquiries: card.openToEnquiries,
    openToAppointments: card.openToAppointments,

    // The builder is an internal surface, so the preview keeps branding on
    // regardless of plan — removing it would make the preview lie about layout.
    showBranding: !plan.limits.remove_branding,

    theme: draft.theme ?? state.theme,
    sections,
    socialLinks: draft.socialLinks ?? state.socials,
    // The builder has no image field for services, products or gallery rows
    // yet, so these carry `imageUrl: null` — the same value the public read
    // model produces when the column is empty.
    services: draft.services ?? state.services.map((row) => ({ ...row, imageUrl: null })),
    products: draft.products ?? state.products.map((row) => ({ ...row, imageUrl: null })),
    catalogues: extras.catalogues,
    portfolio: extras.portfolio,
    gallery:
      draft.gallery ??
      state.gallery.map((row, index) => ({
        ...row,
        width: null,
        height: null,
        position: (index + 1) * 10,
      })),
    videos: extras.videos,
    businessHours: draft.businessHours ?? hours(state),
    reviews: extras.reviews,
    testimonials: extras.testimonials,
    offers: extras.offers,
    payment: draft.payment ?? state.payment,

    viewCount: card.viewCount,
    publishedAt: card.publishedAt,
  };
}

/** `HH:MM` strings in the editor → the minute offsets the renderer expects. */
function hours(state: EditorState): BusinessHour[] {
  return state.hours.map((row) => ({
    dayOfWeek: row.dayOfWeek,
    isOpen: row.isOpen,
    opensAt: row.is24h ? 0 : minutes(row.opensAt),
    closesAt: row.is24h ? 1439 : minutes(row.closesAt),
    is24h: row.is24h,
  }));
}