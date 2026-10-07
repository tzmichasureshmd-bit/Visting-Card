import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import { serverConfig } from "@/lib/env";
import { formatINR } from "@/lib/utils";

/**
 * Pricing tiers for the landing page.
 *
 * The `plans` table is publicly readable, so prices are read from the database:
 * an admin changing a price in /admin/plans updates this page without a deploy.
 *
 * `FALLBACK_TIERS` mirrors `supabase/seed.sql` and is used when Supabase is not
 * configured — which is what lets the marketing page build and render in a fresh
 * checkout with no credentials. Keep the two in sync when a plan changes.
 */

export interface PlanTier {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricePaise: number;
  /** Rendered price, e.g. "Free" or "₹999". */
  price: string;
  /** Rendered billing period, e.g. "/year". */
  period: string;
  features: string[];
  cta: { label: string; href: string };
  highlighted: boolean;
}

export const FALLBACK_TIERS: PlanTier[] = [
  {
    slug: "free",
    name: "Free",
    tagline: "Everything you need to get a live card.",
    description:
      "A genuinely usable card at no cost. Unlimited time, no trial countdown, and real lead capture.",
    pricePaise: 0,
    price: "Free",
    period: "forever",
    features: [
      "1 Digital Visiting Card",
      "Up to 5 services",
      "Up to 5 products",
      "10 gallery images",
      "Lead capture & enquiries",
      "Appointment requests",
      "UPI payments",
      "QR code & downloads",
      "Referral programme",
    ],
    cta: { label: "Start free", href: "/signup" },
    highlighted: false,
  },
  {
    slug: "starter",
    name: "Starter",
    tagline: "For freelancers building a client base.",
    description:
      "Add services, products, a catalogue and keep an eye on who is getting in touch.",
    pricePaise: 49900,
    price: "₹499",
    period: "per year",
    features: [
      "3 Digital Visiting Cards",
      "Unlimited services & products",
      "50 gallery images",
      "Digital catalogue",
      "Video embeds",
      "Basic QR packs",
      "90-day analytics history",
    ],
    cta: { label: "Choose Starter", href: "/signup?plan=starter" },
    highlighted: false,
  },
  {
    slug: "professional",
    name: "Professional",
    tagline: "For serious professionals and creators.",
    description:
      "Custom domain, deeper analytics and portfolio work. The plan most independent businesses choose.",
    pricePaise: 99900,
    price: "₹999",
    period: "per year",
    features: [
      "5 Digital Visiting Cards",
      "Custom domain",
      "1-year analytics history",
      "Portfolio & video",
      "Premium themes",
      "Remove Tzmicha It Solutions branding",
      "Unlimited catalogue & gallery",
      "Reseller application",
    ],
    cta: { label: "Choose Professional", href: "/signup?plan=professional" },
    highlighted: true,
  },
  {
    slug: "business",
    name: "Business",
    tagline: "For companies with a team.",
    description:
      "Employee cards, a company profile and the analytics to run on numbers.",
    pricePaise: 199900,
    price: "₹1,999",
    period: "per year",
    features: [
      "10 Digital Visiting Cards",
      "Company profile & team cards",
      "15 team members",
      "Role-based dashboards",
      "Priority support",
      "Custom domain",
      "Reseller tools",
    ],
    cta: { label: "Choose Business", href: "/signup?plan=business" },
    highlighted: false,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    tagline: "For organisations that need control.",
    description:
      "Unlimited cards and seats, white labelling, custom integrations and a named contact.",
    pricePaise: 0,
    price: "Custom",
    period: "",
    features: [
      "Unlimited Digital Visiting Cards",
      "Unlimited team members",
      "White-label options",
      "Custom integrations",
      "SSO & audit exports",
      "Named account manager",
    ],
    cta: { label: "Talk to us", href: "/legal/contact" },
    highlighted: false,
  },
];

/** `true` when Supabase is present, so the page can skip the read entirely. */
const plansAreLive = () => serverConfig.isSupabaseConfigured;

/**
 * Plans for the pricing grid.
 *
 * Never throws: a pricing table that fails to render because the database is
 * briefly unreachable would be a worse outcome than showing the seeded prices.
 */
export async function getPricingTiers(): Promise<PlanTier[]> {
  if (!plansAreLive()) return FALLBACK_TIERS;

  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from("plans")
      .select("slug, name, tagline, description, price_paise, features, billing_period, is_custom, is_active, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return FALLBACK_TIERS;

    const tiers = data.map((row) => {
      const isCustom = row.is_custom === true;
      const pricePaise = typeof row.price_paise === "number" ? row.price_paise : 0;
      const fallback = FALLBACK_TIERS.find((tier) => tier.slug === row.slug);

      return {
        slug: String(row.slug),
        name: String(row.name),
        tagline: fallback?.tagline ?? "",
        description: String(row.description ?? fallback?.description ?? ""),
        pricePaise,
        price: isCustom ? "Custom" : pricePaise === 0 ? "Free" : formatINR(pricePaise),
        period: isCustom
          ? ""
          : pricePaise === 0
            ? "forever"
            : row.billing_period === "monthly"
              ? "per month"
              : "per year",
        features: Array.isArray(row.features) ? row.features.map(String) : [],
        cta: isCustom
          ? { label: "Talk to us", href: "/legal/contact" }
          : pricePaise === 0
            ? { label: "Start free", href: "/signup" }
            : { label: `Choose ${row.name}`, href: `/signup?plan=${row.slug}` },
        // Highlight the paid plan people most often pick, rather than hardcoding a
        // slug in two places.
        highlighted: row.slug === "professional",
      } satisfies PlanTier;
    });

    return tiers.length > 0 ? tiers : FALLBACK_TIERS;
  } catch (error) {
    console.error("[pricing] falling back to seeded tiers", error);
    return FALLBACK_TIERS;
  }
}
