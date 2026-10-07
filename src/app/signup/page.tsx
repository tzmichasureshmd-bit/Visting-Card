import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isDarkMode } from "@/lib/auth/theme";
import { requireGuest } from "@/lib/auth/session";
import { getShowcaseTheme } from "@/lib/marketing/themes";
import { getPricingTiers } from "@/lib/marketing/pricing";
import { readPlanSlug, readThemeSlug } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Create Your Digital Visiting Card",
  description: "Create a free Digital Visiting Card account and build your digital visiting card.",
  robots: { index: false, follow: false },
};

/**
 * Sign-up.
 *
 * Reads two query parameters:
 *
 * - `?ref=` — referral attribution, passed through a hidden field into Supabase's
 *   `raw_user_meta_data`, which is what the database trigger resolves against
 *   (see `handle_new_user()`).
 * - `?theme=` — the design a visitor picked in the template gallery. It rides
 *   along in the same user metadata so it survives the email-verification hop,
 *   where a query string could not.
 */
export default async function SignUpPage({
  searchParams,
}: PageProps<"/signup">) {
  // Already signed in? There is nothing to register, so go to the account.
  await requireGuest("/dashboard");

  const params = await searchParams;
  const referralCode = typeof params.ref === "string" ? params.ref.slice(0, 40) : "";
  const themeSlug = readThemeSlug(params.theme);
  const planSlug = readPlanSlug(params.plan);
  const isDark = await isDarkMode();

  const tiers = await getPricingTiers();
  const planTier = tiers.find((t) => t.slug === planSlug) ?? null;

  return (
    <AuthShell variant="signup" isDark={isDark}>
      <Suspense fallback={null}>
        <SignUpForm
          isDark={isDark}
          referralCode={referralCode}
          themeSlug={themeSlug}
          theme={themeSlug ? await getShowcaseTheme(themeSlug) : null}
          planSlug={planSlug}
          planTier={planTier}
        />
      </Suspense>
    </AuthShell>
  );
}
