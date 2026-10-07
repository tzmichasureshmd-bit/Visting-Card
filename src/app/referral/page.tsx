import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gift, Handshake, Wallet } from "lucide-react";

import { ProseHeader, ProseSection } from "@/components/marketing/prose";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { referral } from "@/lib/marketing/content";

export const metadata: Metadata = {
  title: "Referral Programme",
  description:
    "How the Tzmicha It Solutions referral programme pays you, when commission becomes available, and how payouts work.",
  alternates: { canonical: "/referral" },
};

/**
 * Referral programme terms.
 *
 * Static copy — every number here must match the database defaults rather than
 * being invented for the page:
 *   - commission: `referral_config.commission_percent`, seeded at 20%
 *   - minimum payout: `referral_config.min_payout_paise`, seeded at 50000 (₹500)
 *   - eligibility: `referral_config.eligible_plans`, seeded
 *     {starter,professional,business}
 *
 * The `referral_config` row is the source of truth once an admin edits it, so
 * this page deliberately says "the rate shown in your dashboard" wherever the
 * live figure matters, and quotes the seeded values only as an example.
 */
export default function ReferralPage() {
  const steps = [
    {
      title: "Share your link",
      body: "Every account has a referral code. It lives in your dashboard, and it is what links a signup back to you.",
    },
    {
      title: "Someone signs up and pays",
      body: "Commission is recorded in the database when a payment is verified by the payment provider — never in your browser, so it cannot be forged.",
    },
    {
      title: "It moves from pending to available",
      body: "A reward shows as pending through the refund window, then becomes withdrawable in your wallet.",
    },
    {
      title: "You request a payout",
      body: "UPI or bank transfer, once your balance clears the minimum. We record the payment when it is sent.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <article>
          <ProseHeader
            title="Referral programme"
            summary={referral.description}
            updated="5 October 2026"
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Handshake, label: "Server-side, always" },
              { icon: Wallet, label: "Pending, then available" },
              { icon: Gift, label: "Never clawed back" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <Icon className="size-4 shrink-0 text-brand" aria-hidden />
                <span className="text-[13px] font-medium text-fg">{label}</span>
              </div>
            ))}
          </div>

          <ProseSection title="How it works">
            <ol className="space-y-4">
              {steps.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand-soft-fg"
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block font-medium text-fg">{step.title}</span>
                    <span className="mt-1 block">{step.body}</span>
                  </span>
                </li>
              ))}
            </ol>
          </ProseSection>

          <ProseSection title="The rate and the rules">
            <p>
              Commission is a percentage of the payment made by the person you referred. The
              programme starts at 20% and the current rate is shown in your dashboard — that
              figure is what applies, not any number quoted elsewhere.
            </p>
            <p>
              Commission is earned only on paid plans that are marked eligible (the free plan
              never generates a reward, and neither does a mere signup — somebody has to actually
              pay). The percentage is snapshotted on the reward at the moment it is created, so a
              later change to the rate never rewrites what you have already earned.
            </p>
            <p>
              If the payment is refunded, the matching reward is reversed. After that, rewards are
              never clawed back: if the person you referred renews next year, you earn again.
            </p>
          </ProseSection>

          <ProseSection title="Payouts">
            <p>
              Rewards sit as pending through the refund window, then become available. Once your
              available balance clears the minimum — currently ₹500 — you can request a payout by
              UPI or bank transfer from your dashboard.
            </p>
            <p>
              Payouts are processed by a person, not automatically, and we record a reference when
              one is marked paid. Tzmicha It Solutions never initiates a transfer without a request from you.
            </p>
          </ProseSection>

          <ProseSection title="What gets you removed">
            <p>
              Referring yourself, using fake accounts, or spamming your link will get a programme
              account closed and rewards withheld. Referral is meant for telling people who would
              genuinely benefit, and the rules are written to keep it that way for everyone in it.
            </p>
          </ProseSection>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/signup">
                Create your free card
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legal/contact">Ask a question</Link>
            </Button>
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
