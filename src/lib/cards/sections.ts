import type { SectionKey } from "@/lib/cards/types";

/**
 * Section metadata, in one place.
 *
 * The renderer needs only the heading; the builder needs a blurb and to know
 * which panel owns each section. Keeping all three here means a new section
 * cannot be added to `SECTION_KEYS` without also getting a title and an owner.
 */

export interface SectionMeta {
  /** Heading on the public card. `null` renders no heading (form sections). */
  title: string | null;
  /** Builder-side explanation of what the section is for. */
  description: string;
  /** Builder tab that edits this section's content. */
  panel: "details" | "content" | "sections" | "none";
}

export const SECTION_META: Record<SectionKey, SectionMeta> = {
  about: {
    title: "About",
    description: "Your introduction. A few lines is plenty — this is the first thing people read.",
    panel: "details",
  },
  contact: {
    title: "Contact",
    description: "Phone, email and website, rendered as tap-to-action rows.",
    panel: "details",
  },
  social: {
    title: "Find me online",
    description: "Profile links: LinkedIn, Instagram, YouTube, or anything else.",
    panel: "content",
  },
  services: {
    title: "Services",
    description: "What you offer, each with its own call-to-action.",
    panel: "content",
  },
  products: {
    title: "Products",
    description: "Things you sell, with an optional was/now price.",
    panel: "content",
  },
  catalogue: {
    title: "Catalogue",
    description: "Grouped price lists. Available on paid plans.",
    panel: "none",
  },
  portfolio: {
    title: "Selected work",
    description: "Projects and case studies. Available on paid plans.",
    panel: "none",
  },
  gallery: {
    title: "Gallery",
    description: "Images from your work, shown in the theme's grid.",
    panel: "none",
  },
  video: {
    title: "Watch",
    description: "An intro or showreel. Available on paid plans.",
    panel: "none",
  },
  payment: {
    title: "Pay me",
    description: "A UPI ID visitors can scan or tap to pay.",
    panel: "content",
  },
  location: {
    title: "Find us",
    description: "Your address, shown as a map-friendly block.",
    panel: "details",
  },
  business_hours: {
    title: "Business hours",
    description: "A weekly opening-hours grid, with an open-now indicator.",
    panel: "content",
  },
  reviews: {
    title: "Reviews",
    description: "Ratings and written reviews.",
    panel: "none",
  },
  testimonials: {
    title: "What clients say",
    description: "Written testimonials with a name and role.",
    panel: "none",
  },
  offers: {
    title: "Offers",
    description: "Time-limited offers. Expired ones are hidden automatically.",
    panel: "none",
  },
  enquiry: {
    title: null,
    description: "A contact form that lands straight in your leads.",
    panel: "none",
  },
  appointment: {
    title: null,
    description: "Lets a visitor request a time to meet.",
    panel: "none",
  },
};