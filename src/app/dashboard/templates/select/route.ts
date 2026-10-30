import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { getUserPlan, countUserCards, limitReached } from "@/lib/cards/limits";

const DEFAULT_THEME_SLUG = "modern" as const;

// Map template IDs to theme slugs
const TEMPLATE_THEME_MAP: Record<string, string> = {
  "business-pro": "professional",
  "creative-designer": "creative",
  "minimal-founder": "minimal",
  "luxury-consultant": "luxury",
  "tech-developer": "dark",
  "restaurant-owner": "restaurant",
  "realtor-agent": "real-estate",
  "medical-doctor": "medical",
  "photographer-portfolio": "portfolio",
  "entrepreneur": "business",
  "freelancer": "minimal",
  "influencer": "spotlight",
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    
    // Get template ID and optional card ID from query params
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("template");
    const cardId = searchParams.get("card"); // If specified, apply to existing card
    
    if (!templateId) {
      return NextResponse.redirect(new URL("/dashboard/templates", request.url));
    }

    // Get user's cards and plan
    const plan = await getUserPlan(supabase, user.id);
    const { data: userCards } = await supabase
      .from("cards")
      .select("id, username, full_name, photo_url")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    // Get theme for template
    const themeSlug = TEMPLATE_THEME_MAP[templateId] || DEFAULT_THEME_SLUG;
    const { data: themeRows } = await supabase
      .from("themes")
      .select("id, slug, is_premium")
      .in("slug", [themeSlug, DEFAULT_THEME_SLUG])
      .eq("is_active", true);

    const themeId =
      themeRows?.find(
        (row) => row.slug === themeSlug && (!row.is_premium || plan.limits.premium_themes)
      )?.id ??
      themeRows?.find((row) => row.slug === DEFAULT_THEME_SLUG)?.id ??
      null;

    // IF USER HAS MULTIPLE CARDS - Need to show selection page
    if (!cardId && userCards && userCards.length > 0 && plan.limits.max_cards !== 1) {
      // Redirect to card selection page
      return NextResponse.redirect(
        new URL(`/dashboard/templates/apply?template=${templateId}`, request.url)
      );
    }

    // IF APPLYING TO EXISTING CARD
    if (cardId && userCards) {
      const targetCard = userCards.find(c => c.id === cardId);
      if (targetCard) {
        // Update existing card's theme
        await supabase
          .from("cards")
          .update({ theme_id: themeId })
          .eq("id", cardId)
          .eq("user_id", user.id);

        // Redirect to card builder
        return NextResponse.redirect(new URL(`/dashboard/cards/${cardId}`, request.url));
      }
    }

    // CREATE NEW CARD (single plan or first card)
    const used = await countUserCards(supabase, user.id);
    if (limitReached(plan.limits.max_cards, used)) {
      const allowed = plan.limits.max_cards;
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=${encodeURIComponent(`Your ${plan.name} plan includes ${allowed} card${allowed === 1 ? "" : "s"}. Upgrade to create another one.`)}`,
          request.url
        )
      );
    }

    const { data: auth } = await supabase.auth.getUser();
    const fullName = String(auth.user?.user_metadata?.full_name || user.email?.split("@")[0] || "My Card");

    const { data: card, error } = await supabase
      .from("cards")
      .insert({
        user_id: user.id,
        full_name: fullName,
        designation: null,
        bio: null,
        phone: null,
        whatsapp: null,
        email: user.email,
        city: null,
        username: `${fullName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36).slice(-4)}`,
        type: "personal",
        status: "draft",
        theme_id: themeId,
      })
      .select("id, username")
      .single();

    if (error || !card) {
      console.error("[template-select] Card creation failed:", error);
      return NextResponse.redirect(
        new URL(
          `/dashboard?error=${encodeURIComponent("Could not create card. Please try again.")}`,
          request.url
        )
      );
    }

    // Seed default sections
    const DEFAULT_SECTIONS = [
      "contact",
      "about",
      "social",
      "links",
      "gallery",
      "products",
      "services",
      "testimonials",
      "work",
    ] as const;

    const { error: sectionError } = await supabase.from("card_sections").insert(
      DEFAULT_SECTIONS.map((key, index) => ({
        card_id: card.id,
        section_key: key,
        position: (index + 1) * 10,
        is_enabled: key === "contact" || key === "about",
      }))
    );

    if (sectionError) {
      console.error("[template-select] Section seeding failed:", sectionError);
    }

    return NextResponse.redirect(new URL(`/dashboard/cards/${card.id}`, request.url));
  } catch (error) {
    console.error("[template-select] Unexpected error:", error);
    return NextResponse.redirect(
      new URL(
        `/dashboard?error=${encodeURIComponent("An error occurred. Please try again.")}`,
        request.url
      )
    );
  }
}
