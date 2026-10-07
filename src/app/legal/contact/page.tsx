import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MessageCircle, ShieldAlert } from "lucide-react";

import { ProseHeader, ProseSection } from "@/components/marketing/prose";
import { publicConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the Tzmicha It Solutions team for support, billing or anything else.",
  alternates: { canonical: "/legal/contact" },
};

const SUPPORT_EMAIL = publicConfig.supportEmail;

/**
 * Contact page.
 *
 * Deliberately no contact form: an unauthenticated form on a marketing route is
 * the single easiest thing on this site to spam, and every channel here already
 * exists. If a form is added later it needs rate limiting (`@/lib/rate-limit`)
 * and a honeypot field — see the pattern in `leadSchema`.
 */
export default function ContactPage() {
  return (
    <article>
      <ProseHeader
        title="Contact us"
        summary="Support, billing, refunds and everything in between. We read every message and reply in the order they arrive."
      />

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong"
        >
          <Mail className="size-5 text-brand" aria-hidden />
          <p className="mt-3 text-[15px] font-semibold text-fg">Email support</p>
          <p className="mt-1 text-sm break-all text-muted transition-colors group-hover:text-fg">
            {SUPPORT_EMAIL}
          </p>
          <p className="mt-2 text-[13px] text-subtle">
            Best for account, card and technical questions.
          </p>
        </a>

        <div className="rounded-xl border border-border bg-surface p-5">
          <Clock className="size-5 text-brand" aria-hidden />
          <p className="mt-3 text-[15px] font-semibold text-fg">Response time</p>
          <p className="mt-1 text-sm text-muted">Monday to Saturday, 10:00 to 19:00 IST.</p>
          <p className="mt-2 text-[13px] text-subtle">
            Most messages are answered within one working day.
          </p>
        </div>
      </div>

      <ProseSection title="Before you write">
        <ul className="space-y-2.5">
          <li className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              For a refund request, the{" "}
              <Link href="/legal/refunds" className="text-fg underline underline-offset-2">
                refund policy
              </Link>{" "}
              lists exactly what qualifies — include the email address on the account.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              For a card that will not open, send us the card link. It is usually a draft that was
              never published, which takes seconds to spot.
            </span>
          </li>
          <li className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
            <span>
              Payment failures almost always resolve on their own once the provider confirms —
              send the amount and the time and we will check rather than guess.
            </span>
          </li>
        </ul>
      </ProseSection>

      <ProseSection title="Report something suspicious">
        <p className="flex gap-2.5">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <span>
            If you have found a card impersonating someone, selling something illegal, or a message
            that looks like phishing in Tzmicha It Solutions&apos; name, email us with the link. We treat these
            ahead of the queue and suspend first while we investigate.
          </span>
        </p>
      </ProseSection>

      <ProseSection title="Referral and reseller questions">
        <p className="flex gap-2.5">
          <MessageCircle className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <span>
            Programme terms live at{" "}
            <Link href="/referral" className="text-fg underline underline-offset-2">
              the referral page
            </Link>
            , and reseller enquiries at the{" "}
            <Link href="/reseller" className="text-fg underline underline-offset-2">
              reseller page
            </Link>
            . Both are good starting points before asking us to explain them one at a time.
          </span>
        </p>
      </ProseSection>
    </article>
  );
}
