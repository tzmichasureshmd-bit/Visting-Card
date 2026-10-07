/**
 * Landing page copy, in one place.
 *
 * Marketing text changes far more often than markup, and it is the part of this
 * codebase a non-engineer needs to review. Keeping it here means a copy edit never
 * risks breaking the layout, and the whole narrative can be read top to bottom.
 *
 * The claims here are deliberately conservative — everything advertised is
 * implemented, and anything gated by a plan says so. No invented statistics,
 * no invented testimonials: the page sells with the product itself.
 *
 * Terminology is fixed: the product is a "Digital Visiting Card", the company is
 * "Tzmicha It Solutions". Neither is abbreviated anywhere in the product.
 */

export const site = {
  name: "Tzmicha It Solutions",
  tagline:
    "Create a Digital Visiting Card that represents you and your business. Share it anywhere. Get contacted instantly.",
  url: "/",
};

export const nav = [
  { href: "#story", label: "Why" },
  { href: "#how", label: "How it works" },
  { href: "#designs", label: "Designs" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
] as const;

export const hero = {
  eyebrow: "Digital Visiting Card by Tzmicha It Solutions",
  headline: "Create a Digital Visiting Card",
  headlineAccent: "that represents you.",
  subheadline:
    "Your identity. Your business. One beautiful Digital Visiting Card you can share as a link or a QR code — and update the moment anything changes.",
  primaryCta: { label: "Create Your Digital Visiting Card", href: "/signup" },
  secondaryCta: { label: "Explore Card Designs", href: "#designs" },
  proof: ["Free to start", "Live in two minutes", "No app for visitors"],
};

/**
 * The story section.
 *
 * A short narrative rather than a feature list, because the first job of the
 * page is to make someone understand the product, not to enumerate it. The
 * `pillars` are the three sentences that make that possible; `points` are the
 * concrete things the card does, which the feature grid below expands on.
 */
export const story = {
  eyebrow: "The idea",
  title: "Your identity. Your business. One beautiful Digital Visiting Card.",
  description:
    "A paper card is printed once and wrong from then on. Your number changes, your role changes, your offer changes — and the card in someone's wallet does not.",
  body: [
    "A Digital Visiting Card is the same idea without the printing. It is a link that opens a page built around you: your photo, your work, and every way to reach you — all one tap away, on any phone, with nothing to install.",
    "You choose a design, fill in what matters, and publish. After that, changing your number or your business takes seconds, and everyone already holding your link sees the change. That is the whole product: one beautiful place that represents you, and that you are never locked out of.",
  ],
  pillars: [
    {
      title: "Introduce yourself properly",
      body: "Share your profile, photo and work as a link instead of a line of text. It opens as a page, not an attachment.",
    },
    {
      title: "Connect instantly",
      body: "Call, WhatsApp, email, website and social links, each one tap away. No retyping your number into a form.",
    },
    {
      title: "Update information anytime",
      body: "New number, new role, new offer. Edit once and every link you have ever shared is already current.",
    },
  ],
  points: [
    "Share contact details that are always correct",
    "Showcase your business, services and products",
    "Link every social profile in one place",
    "Turn a printed QR code into a live page",
    "See who looked, clicked and enquired",
  ],
} as const;

export const how = {
  eyebrow: "How it works",
  title: "Four steps, about two minutes",
  description: "Nothing to install and nothing to print — your Digital Visiting Card is a link.",
  steps: [
    {
      title: "Create your card",
      body: "Sign up with your email. Your card starts empty and private — nothing is public until you say so.",
      image: "createCard" as const,
    },
    {
      title: "Add your details",
      body: "Name, photo, what you do, how to reach you. Add only the sections that fit your work.",
      image: "profile" as const,
    },
    {
      title: "Set your design",
      body: "Pick a style and colour that suits you. Change it whenever you like — your link never changes.",
      image: "hero" as const,
    },
    {
      title: "Share with QR",
      body: "Send the link on WhatsApp, print the QR on your board or brochure, and you are reachable everywhere.",
      image: "shareCard" as const,
    },
  ],
};

export const onCard = {
  eyebrow: "What sits on it",
  title: "Everything a visitor needs, one tap away",
  description:
    "Switch on only what fits your work. Anything you leave out simply does not show.",
  items: [
    {
      icon: "MessageCircle",
      name: "WhatsApp button",
      body: "One tap opens a chat with you.",
    },
    { icon: "Phone", name: "Call & email", body: "Dial or write without typing." },
    { icon: "Download", name: "Save contact", body: "A real .vcf file, photo included." },
    { icon: "QrCode", name: "QR code", body: "Print it anywhere people can scan." },
    { icon: "Briefcase", name: "About & services", body: "What you do and what you offer." },
    { icon: "ShoppingBag", name: "Products", body: "Prices, with sale badges." },
    { icon: "Images", name: "Gallery", body: "Your work, photos or menu." },
    { icon: "Clock", name: "Business hours", body: "Open right now, in their time." },
    { icon: "MapPin", name: "Location", body: "Directions straight to Maps." },
    { icon: "Share2", name: "Social links", body: "Instagram, LinkedIn, and more." },
    { icon: "Wallet", name: "UPI payments", body: "Scan and pay you directly." },
    { icon: "Star", name: "Reviews", body: "What your customers say." },
  ],
};

/**
 * The designs section.
 *
 * The landing page shows a curated set as compact, live previews — the real
 * card renderer scaled down, so what you see is what you get. `/templates` owns
 * the full gallery of every design with the same previews at full size.
 *
 * `FEATURED_THEME_SLUGS` names the themes featured here. Each is resolved
 * against the live theme list, so a slug that does not exist is skipped rather
 * than rendered as an empty card — the section can never claim a design the
 * catalogue does not contain.
 */
export const designs = {
  eyebrow: "Designs",
  title: "Choose Your Digital Visiting Card",
  description:
    "Every design changes where your name sits, how sections flow and how the type is set — not just the colours. Pick one now and switch later without your link ever changing.",
  cta: { label: "Explore all designs", href: "/templates" },
} as const;

/** Curated, in display order. Order here is the order on the page. */
export const FEATURED_THEME_SLUGS = [
  "professional",
  "minimal",
  "luxury",
  "creative",
  "business",
  "portfolio",
  "ledger",
  "atelier",
] as const;

/** Short editorial line per featured design, in the same order as the slugs. */
export const FEATURED_THEME_NOTES: Record<string, string> = {
  professional:
    "A cover banner and a clear, confident hierarchy. The default corporate look — credible without shouting.",
  minimal:
    "No cover, no clutter. Hairline dividers and centred type, for people whose work speaks for itself.",
  luxury:
    "Deep charcoal, warm gold and wide margins. Generous type that reads as considered rather than busy.",
  creative:
    "Asymmetric blocks and a poster feel. For photographers, makers and anyone whose work is the pitch.",
  business:
    "Built for a company: a company profile, services and products, arranged for someone deciding.",
  portfolio:
    "Your work leads. A large image area for case studies, with the contact actions kept to one clear path.",
  ledger:
    "A crisp, structured layout that handles detail — tables, numbers, specifications and catalogues.",
  atelier:
    "Editorial and unhurried, with an off-white surface. Suits studios, interiors and boutique work.",
};

export const audience = {
  eyebrow: "Made for",
  title: "If you hand out cards, this is for you",
  items: [
    "Freelancers",
    "Doctors & clinics",
    "Lawyers",
    "Agents & realtors",
    "Coaches",
    "Shops & restaurants",
    "Consultants",
    "Accountants",
    "Students & job seekers",
    "Sales teams",
    "Photographers",
    "Tradespeople",
  ],
};

/**
 * The three plans shown on the landing page.
 *
 * Feature lists are the short presentation copy; prices and limits still come
 * from the `plans` table (`@/lib/marketing/pricing`). The display names here
 * override the database names so the middle plan reads "Pro" everywhere.
 */
export const pricing = {
  eyebrow: "Pricing",
  title: "Simple plans. Start free.",
  description: "Create your Digital Visiting Card for free. Upgrade only when you need more.",
  plans: {
    free: {
      name: "Free",
      features: ["Digital Visiting Card", "Basic sharing", "QR code"],
    },
    professional: {
      name: "Pro",
      features: ["Custom design", "Products & services", "Analytics", "Custom branding"],
    },
    business: {
      name: "Business",
      features: ["Team cards", "Advanced analytics", "Business features"],
    },
  },
  footnote:
    "Prices in INR per year, taxes included. Cancel any time from your dashboard.",
} as const;

/** The three plan slugs the landing pricing grid shows, in order. */
export const LANDING_PLAN_SLUGS = ["free", "professional", "business"] as const;

export const finalCta = {
  title: "Make your first impression unforgettable.",
  body: "Create a beautiful Digital Visiting Card and share your professional identity anywhere.",
  primary: { label: "Create Your Digital Visiting Card", href: "/signup" },
  secondary: { label: "Explore Designs", href: "#designs" },
} as const;

/**
 * Referral programme copy. Used by the dedicated `/referral` page — the
 * landing page itself stays focused on creating a card.
 */
export const referral = {
  eyebrow: "Referral programme",
  title: "Earn every month someone you referred pays",
  description:
    "Give someone your referral link. When they buy a paid plan, a share of that payment lands in your wallet. You can withdraw once your balance clears the minimum.",
  points: [
    {
      title: "Server-side, always",
      body: "Commission is calculated in the database when a payment is verified — never in the browser, so it cannot be forged.",
    },
    {
      title: "Pending, then available",
      body: "A reward shows as pending through the refund window, then becomes withdrawable.",
    },
    {
      title: "Referral rewards are never clawed back",
      body: "If the person you referred pays again next year, you earn again.",
    },
    {
      title: "Set your own payout details",
      body: "UPI or bank transfer, requested from your dashboard once the minimum is reached.",
    },
  ],
  cta: { label: "Read the referral terms", href: "/referral" },
};

export const footer = {
  columns: [
    {
      title: "Product",
      links: [
        { label: "Why a Digital Visiting Card", href: "#story" },
        { label: "How it works", href: "#how" },
        { label: "What sits on it", href: "#features" },
        { label: "Designs", href: "#designs" },
        { label: "All designs", href: "/templates" },
        { label: "Pricing", href: "#pricing" },
        { label: "Sample card", href: "/demo" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Tzmicha", href: "#story" },
        { label: "Referral programme", href: "/referral" },
        { label: "Become a reseller", href: "/reseller" },
        { label: "Contact us", href: "/legal/contact" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Contact support", href: "/legal/contact" },
        { label: "Help & contact", href: "/legal/contact" },
        { label: "Privacy policy", href: "/legal/privacy" },
        { label: "Terms of service", href: "/legal/terms" },
        { label: "Refund policy", href: "/legal/refunds" },
      ],
    },
  ],
  note: "All rights reserved.",
} as const;