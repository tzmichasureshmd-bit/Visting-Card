import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/auth/onboarding-form";
import { countUserCards, getUserPlan } from "@/lib/cards/limits";
import { requireUser } from "@/lib/auth/session";
import { getShowcaseTheme } from "@/lib/marketing/themes";
import { readThemeSlug } from "@/lib/validation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create Your Digital Visiting Card",
  description: "Add the details that make your digital visiting card yours.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: PageProps<"/onboarding">) {
  const user = await requireUser();
  const supabase = await createClient();
  const cards = await countUserCards(supabase, user.id);
  if (cards > 0) redirect("/dashboard");

  const params = await searchParams;
  const { data: auth } = await supabase.auth.getUser();
  const themeSlug =
    readThemeSlug(params.theme) || readThemeSlug(auth.user?.user_metadata?.theme_slug);

  const [theme, plan] = await Promise.all([
    themeSlug ? getShowcaseTheme(themeSlug) : null,
    getUserPlan(supabase, user.id),
  ]);
  const premiumLocked = theme?.isPremium === true && !plan.limits.premium_themes;

  const prefilledName = String(auth.user?.user_metadata?.full_name ?? "");
  const prefilledEmail = user.email;

  return (
    <OnboardingForm
      prefilledName={prefilledName}
      prefilledEmail={prefilledEmail}
      themeSlug={themeSlug}
      theme={premiumLocked ? null : theme}
      lockedTheme={premiumLocked ? theme : null}
    />
  );
}
