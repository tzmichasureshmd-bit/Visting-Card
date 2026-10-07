import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, LineChart, Users } from "lucide-react";

import { ProseHeader, ProseSection } from "@/components/marketing/prose";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { publicConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "For Resellers",
  description:
    "Sell Digital Visiting Cards to your own customers: how reseller accounts work, what you earn, and how to apply.",
  alternates: { canonical: "/reseller" },
};

const SUPPORT_EMAIL = publicConfig.supportEmail;

/**
 * Reseller information page.
 *
 * Static prose only — this route must not touch the reseller tables. Everything
 * described here reflects the schema (0001_schema.sql: `resellers`,
 * `reseller_customers`) but the approval itself is an admin action performed in
 * the admin area, not from this page.
 */
export default function ResellerPage() {
  const benefits = [
    {
      icon: BadgeCheck,
      title: "Your own customers",
      body: "Accounts you bring are linked to you, so their subscriptions show in your book rather than in a shared pool.",
    },
    {
      icon: LineChart,
      title: "Commission on every renewal",
      body: "You earn a percentage of what your customers pay, snapshotted at the time of each payment.",
    },
    {
      icon: Users,
      title: "Room to set pricing",
      body: "Where your account allows it, you choose the retail price and keep the difference.",
    },
  ];

  return (
    <>
      <SiteHeader />
      <main id="content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <article>
          <ProseHeader
            title="For resellers"
            summary="If you already sell to small businesses — printing, signage, web design, local software — Digital Visiting Cards are something you can add to the same conversation."
            updated="5 October 2026"
          />

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, title }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-surface px-4 py-4 text-center"
              >
                <Icon className="mx-auto size-5 text-brand" aria-hidden />
                <p className="mt-2.5 text-[13px] font-medium text-fg">{title}</p>
              </div>
            ))}
          </div>

          <ProseSection title="What a reseller account does">
            <p>
              A reseller account lets you create and manage Digital Visiting Card accounts on behalf of your
              customers. Their cards, plans and billing are visible to you, and each customer
              stays a normal Digital Visiting Card account — you are the one who set it up, not the owner of
              their data.
            </p>
            <p>
              Your commission rate is set per reseller and is shown in your dashboard. Where your
              account has pricing enabled, you also set the retail price your customer pays and
              keep the difference above the wholesale rate.
            </p>
          </ProseSection>

          <ProseSection title="Who this suits">
            <p>
              Printers and signage shops handing over QR codes, freelancers and agencies who build
              identity work, computer shops, and anyone with a book of small-business customers
              who already ask &ldquo;can you do a website for me too&rdquo;.
            </p>
            <p>
              It is not a scheme for buying accounts in bulk to resell later, and it is not a
              white-label platform — the Tzmicha It Solutions brand stays on the product.
            </p>
          </ProseSection>

          <ProseSection title="How to apply">
            <p>
              Send an email to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-fg underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>{" "}
              with your business name, the city you operate in, roughly how many customers you
              would bring across, and a contact phone number.
            </p>
            <p>
              Applications are reviewed by a person, and approval puts the account into a pending
              state until we have confirmed the details with you. There is no fee to apply and no
              minimum commitment — we would rather have resellers who actually sell than sign up
              everyone who asks.
            </p>
          </ProseSection>

          <ProseSection title="Getting paid">
            <p>
              Earnings accumulate in your account and are paid out against a request, by UPI or
              bank transfer, once the balance clears the minimum. Commission follows the same rules
              as the{" "}
              <Link href="/referral" className="text-fg underline underline-offset-2">
                referral programme
              </Link>{" "}
              for refunds: a refunded payment reverses its commission, and nothing is clawed back
              after that.
            </p>
          </ProseSection>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <a href={`mailto:${SUPPORT_EMAIL}?subject=Reseller%20application`}>
                Apply to resell
                <ArrowRight className="size-4" aria-hidden />
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/#pricing">See the plans</Link>
            </Button>
          </div>

          <p className="mt-8 text-[13px] text-subtle">
            Questions before applying? The{" "}
            <Link href="/legal/contact" className="underline underline-offset-2">
              contact page
            </Link>{" "}
            has everything you need — or write to {SUPPORT_EMAIL} directly.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
