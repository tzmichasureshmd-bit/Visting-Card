import { Hero } from "@/components/marketing/hero";
import {
  AudienceStrip,
  BigStatement,
  DesignsSection,
  FaqSection,
  FinalCta,
  GlassCardsSection,
  HowSection,
  OnCardSection,
  PricingSection,
  ProblemSection,
  StorySection,
} from "@/components/marketing/sections";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { getPricingTiers } from "@/lib/marketing/pricing";
import { getShowcaseThemes } from "@/lib/marketing/themes";

export default async function Home() {
  const [themes, tiers] = await Promise.all([getShowcaseThemes(), getPricingTiers()]);

  return (
    <>
      {/* No overDark — marketing is lime/white/black */}
      <SiteHeader />

      <main id="content">
        <Hero themes={themes} />
        <AudienceStrip />
        <StorySection />
        <ProblemSection />
        <BigStatement />
        <HowSection />
        <OnCardSection />
        <GlassCardsSection />
        <DesignsSection themes={themes} />
        <PricingSection tiers={tiers} />
        <FaqSection />
        <FinalCta />
      </main>

      <SiteFooter />
    </>
  );
}
