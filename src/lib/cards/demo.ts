import type { CardData, ThemeConfig } from "@/lib/cards/types";

/**
 * A fully-populated example card.
 *
 * This is a *presentation fixture*, not backend data: it is only reachable from
 * /demo, never from /card/[username], and it is clearly labelled as a sample on
 * the page itself. It exists so the renderer can be reviewed and visually tested
 * before Supabase credentials are configured.
 */
export const demoCard: CardData = {
  id: "00000000-0000-4000-a000-0000000000ff",
  username: "sai-kumar",
  type: "professional",
  fullName: "Sai Kumar",
  designation: "Founder — Tzmicha IT Solutions",
  company: "Tzmicha IT Solutions",
  bio: "I help small businesses win more customers online — from the website that sells for you, to the profile that gets shared in every WhatsApp group. Six years, 120+ projects, and a stubborn belief that a business card should do actual work.",
  photoUrl: "/demo/photo.svg",
  coverUrl: "/demo/cover.svg",
  logoUrl: null,

  phone: "9876543210",
  whatsapp: "9876543210",
  email: "sai@example.com",
  website: "https://example.com",

  address: "4th Floor, Techno Park",
  city: "Hyderabad",
  state: "Telangana",
  country: "India",
  pincode: "500081",
  latitude: 17.4435,
  longitude: 78.3772,

  showBusinessHours: true,
  openToEnquiries: true,
  openToAppointments: true,
  showBranding: true,

  theme: {
    layout: "banner",
    hero: "cover",
    density: "comfortable",
    avatarShape: "rounded",
    avatarSize: "lg",
    buttonStyle: "outline",
sectionStyle: "card",
    cardStyle: "elevated",
    nameStyle: "normal",
    sectionTitleStyle: "normal",
    accentMode: "bold",
    showCover: true,
    showTrustRow: false,
    imageRatio: "4/3",
    fontScale: 1,
    palette: {
      bg: "#f8fafc",
      surface: "#ffffff",
      fg: "#0f172a",
      muted: "#64748b",
      border: "#e2e8f0",
      accent: "#2563eb",
      accentFg: "#ffffff",
      accentSoft: "#eff6ff",
    },
  },

  sections: [
    { key: "about", enabled: true, position: 0, config: {} },
    { key: "contact", enabled: true, position: 1, config: {} },
    { key: "social", enabled: true, position: 2, config: {} },
    { key: "services", enabled: true, position: 3, config: {} },
    { key: "products", enabled: true, position: 4, config: {} },
    { key: "offers", enabled: true, position: 5, config: {} },
    { key: "business_hours", enabled: true, position: 6, config: {} },
    { key: "payment", enabled: true, position: 7, config: {} },
    { key: "location", enabled: true, position: 8, config: {} },
    { key: "portfolio", enabled: true, position: 9, config: {} },
    { key: "gallery", enabled: true, position: 10, config: {} },
    { key: "video", enabled: true, position: 11, config: {} },
    { key: "reviews", enabled: true, position: 12, config: {} },
    { key: "testimonials", enabled: true, position: 13, config: {} },
    { key: "enquiry", enabled: true, position: 14, config: {} },
    { key: "appointment", enabled: true, position: 15, config: {} },
  ],

  socialLinks: [
    { id: "s1", platform: "linkedin", url: "https://linkedin.com/in/example", label: null, position: 0 },
    { id: "s2", platform: "instagram", url: "https://instagram.com/example", label: null, position: 1 },
    { id: "s3", platform: "youtube", url: "https://youtube.com/@example", label: null, position: 2 },
    { id: "s4", platform: "website", url: "https://example.com", label: "View My Portfolio", position: 3 },
    { id: "s5", platform: "custom", url: "https://cal.com/example", label: "Book a 15-min call", position: 4 },
  ],

  services: [
    {
      id: "sv1",
      name: "Website Development",
      description:
        "A fast, mobile-first site that loads fast and turns visitors into enquiries. Includes copy, build and a 30-day support window.",
      imageUrl: null,
      pricePaise: 2500000,
      ctaType: "whatsapp",
      ctaLabel: "Enquire Now",
      ctaValue: null,
      position: 0,
    },
    {
      id: "sv2",
      name: "Brand Identity",
      description:
        "Logo, colour system and typography that make a small business look established.",
      imageUrl: null,
      pricePaise: 850000,
      ctaType: "whatsapp",
      ctaLabel: "Get a Quote",
      ctaValue: null,
      position: 1,
    },
    {
      id: "sv3",
      name: "SEO & Local Listing",
      description:
        "Get found when someone searches for what you do in your own city.",
      imageUrl: null,
      pricePaise: null,
      ctaType: "enquiry",
      ctaLabel: "Enquire",
      ctaValue: null,
      position: 2,
    },
  ],

  products: [
    {
      id: "pr1",
      name: "Audit Call + Action Plan",
      description: "60-minute teardown of your current site with a written 30-day plan.",
      imageUrl: null,
      originalPrice: 99900,
      salePrice: 49900,
      ctaType: "whatsapp",
      ctaLabel: "Buy Now",
      ctaValue: null,
      position: 0,
    },
    {
      id: "pr2",
      name: "Monthly Retainer",
      description: "Ongoing improvements, reporting and support. Cancel any month.",
      imageUrl: null,
      originalPrice: 1500000,
      salePrice: 1250000,
      ctaType: "enquiry",
      ctaLabel: "Enquire",
      ctaValue: null,
      position: 1,
    },
  ],

  catalogues: [
    {
      id: "cat1",
      catalogueId: "cat1",
      title: "Service Packages",
      category: "packages",
      description: "Fixed-scope packages with clear deliverables.",
      coverUrl: null,
      position: 0,
      items: [
        {
          id: "ci1",
          name: "Starter Website",
          description: "5 pages, contact form, basic SEO, 2 weeks.",
          imageUrl: null,
          pricePaise: 1250000,
          offerPaise: 99900,
          ctaType: "whatsapp",
          ctaLabel: "Enquire",
          position: 0,
        },
        {
          id: "ci2",
          name: "Business Website",
          description: "10 pages, blog, analytics, 4 weeks.",
          imageUrl: null,
          pricePaise: 2500000,
          offerPaise: null,
          ctaType: "whatsapp",
          ctaLabel: "Enquire",
          position: 1,
        },
        {
          id: "ci3",
          name: "E-commerce Store",
          description: "Catalogue, cart, payments, training.",
          imageUrl: null,
          pricePaise: 4500000,
          offerPaise: null,
          ctaType: "enquiry",
          ctaLabel: "Enquire",
          position: 2,
        },
      ],
    },
  ],

  portfolio: [
    {
      id: "pf1",
      title: "Sai Kumar — Digital Visiting Card",
      description: "This card. One link, no app install.",
      imageUrl: "/demo/work-1.svg",
      videoUrl: null,
      externalUrl: null,
      category: "Product",
      position: 0,
    },
    {
      id: "pf2",
      title: "Bloom Studio — Brand Site",
      description: "Rebrand plus a five-page site that doubled inbound leads.",
      imageUrl: "/demo/work-2.svg",
      videoUrl: null,
      externalUrl: null,
      category: "Web",
      position: 1,
    },
    {
      id: "pf3",
      title: "Techno Park — Booking Flow",
      description: "Appointment funnel wired straight into WhatsApp.",
      imageUrl: "/demo/gallery-3.svg",
      videoUrl: null,
      externalUrl: null,
      category: "Product",
      position: 2,
    },
  ],

  gallery: [
    { id: "g1", imageUrl: "/demo/gallery-1.svg", caption: "Studio", width: 1200, height: 900, position: 0 },
    { id: "g2", imageUrl: "/demo/gallery-2.svg", caption: "Workshop", width: 1200, height: 900, position: 1 },
    { id: "g3", imageUrl: "/demo/gallery-3.svg", caption: "Client site", width: 1200, height: 900, position: 2 },
    { id: "g4", imageUrl: "/demo/gallery-4.svg", caption: "Print", width: 1200, height: 900, position: 3 },
  ],

  videos: [
    {
      id: "v1",
      title: "How I work",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      kind: "intro",
      thumbnailUrl: null,
      position: 0,
    },
  ],

  businessHours: [
    { dayOfWeek: 0, isOpen: false, opensAt: null, closesAt: null, is24h: false },
    { dayOfWeek: 1, isOpen: true, opensAt: 570, closesAt: 1110, is24h: false },
    { dayOfWeek: 2, isOpen: true, opensAt: 570, closesAt: 1110, is24h: false },
    { dayOfWeek: 3, isOpen: true, opensAt: 570, closesAt: 1110, is24h: false },
    { dayOfWeek: 4, isOpen: true, opensAt: 570, closesAt: 1110, is24h: false },
    { dayOfWeek: 5, isOpen: true, opensAt: 570, closesAt: 1110, is24h: false },
    { dayOfWeek: 6, isOpen: true, opensAt: 630, closesAt: 1050, is24h: false },
  ],

  reviews: [
    {
      id: "r1",
      authorName: "Ananya Rao",
      authorAvatar: null,
      rating: 5,
      body: "Our enquiries tripled in six weeks. The card alone paid for itself.",
    },
    {
      id: "r2",
      authorName: "Vikram Shetty",
      authorAvatar: null,
      rating: 5,
      body: "Finally, something my customers actually use.",
    },
  ],

  testimonials: [
    {
      id: "t1",
      authorName: "Ananya Rao",
      authorDesignation: "Founder",
      authorCompany: "Bloom Studio",
      authorAvatar: null,
      body: "Sai rebuilt our site in under two weeks and our inbound leads have never been better.",
    },
  ],

  offers: [
    {
      id: "o1",
      title: "Free 15-minute discovery call",
      description: "Book a slot this month and get a no-obligation audit of your current online presence.",
      badge: "Limited",
      expiresAt: null,
      position: 0,
    },
  ],

  payment: {
    upiId: "saikumar@upi",
    payeeName: "Sai Kumar",
    note: "Consulting retainer",
    isActive: true,
  },

viewCount: 1284,
  publishedAt: "2026-01-15T09:00:00.000Z",
};

/**
 * The demo fixture re-skinned with an arbitrary theme.
 *
 * Every section is enabled so a visitor switching designs sees the same content
 * rearranged rather than sections appearing and disappearing — the point of the
 * gallery is that the *structure* changes, and that can only be judged when the
 * content is held constant.
 */
export function demoCardWithTheme(theme: ThemeConfig): CardData {
  return {
    ...demoCard,
    theme,
    // `showcase` overlays the identity on the hero, so a cover is what makes the
    // layout legible. Templates that opt out of a cover still render correctly.
    showBranding: true,
  };
}

/** Every seeded theme slug, in catalogue order. Mirrors `supabase/seed.sql`. */
export const demoThemes = [
  "minimal",
  "professional",
  "luxury",
  "dark",
  "creative",
  "business",
  "restaurant",
  "real-estate",
  "medical",
  "portfolio",
  "spotlight",
  "gallery",
  "poster",
  "masthead",
  "ledger",
  "bento",
  "mosaic-dark",
  "atelier",
  "noir",
  "clinic",
  "kiosk",
  "estate",
] as const;