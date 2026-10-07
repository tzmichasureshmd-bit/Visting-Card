import type { Metadata } from "next";

import { ProseHeader, ProseSection } from "@/components/marketing/prose";
import { publicConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "When Tzmicha It Solutions issues refunds and how to ask for one.",
  alternates: { canonical: "/legal/refunds" },
};

export default function RefundsPage() {
  return (
    <article>
      <ProseHeader
        title="Refund policy"
        summary="If a payment was a mistake or something has gone wrong, we would rather refund it than argue about it."
        updated="5 October 2026"
      />

      <ProseSection title="The short version">
        <p>
          Full refund within 7 days of a first payment, no questions asked. After that, refunds
          are prorated for the unused part of your term if we broke something or if you close your
          account early for a reason that is our fault.
        </p>
      </ProseSection>

      <ProseSection title="The first seven days">
        <p>
          If you paid for a plan and changed your mind within 7 days, email us and we refund the
          full amount to the original payment method. This applies to your first payment only — it
          exists so you can try the paid features without feeling trapped, not as a way to cycle
          through plans for free.
        </p>
      </ProseSection>

      <ProseSection title="After the first seven days">
        <p>
          We refund the unused portion of your term when the reason is on our side: a feature you
          paid for does not work and we cannot fix it within a reasonable time, a billing error on
          our part, or a double charge. We also refund the unused portion if you close a paid
          account early and there is a genuine problem we caused.
        </p>
        <p>
          We do not refund simply because you stopped using the card, or because a plan turned out
          to be more than you needed — that is what the free plan and the cancellation switch are
          for.
        </p>
      </ProseSection>

      <ProseSection title="Duplicate and failed charges">
        <p>
          If you were charged twice, or charged for a subscription that never activated, tell us
          the amount and the date and we will reverse it. Duplicate charges are refunded in full
          without a time limit, because that money was never ours.
        </p>
      </ProseSection>

      <ProseSection title="Referral earnings">
        <p>
          Referral commission is not a payment for a plan, so it is not refundable. If a referred
          payment is refunded, the matching commission is reversed from your wallet — that is
          handled automatically and is described under{" "}
          <a href="/referral" className="text-fg underline underline-offset-2">
            how the referral programme works
          </a>
          .
        </p>
      </ProseSection>

      <ProseSection title="How long it takes">
        <p>
          We approve refunds within 2 working days. After that the money follows the payment
          provider&apos;s schedule — usually 5 to 7 working days to reach a UPI ID or card, though
          your bank may take longer. We will send you a confirmation when we initiate it.
        </p>
      </ProseSection>

      <ProseSection title="How to ask">
        <p>
          Email{" "}
<a href={`mailto:${publicConfig.supportEmail}`} className="text-fg underline underline-offset-2">
              {publicConfig.supportEmail}
          </a>{" "}
          with the email address on the account and roughly when you paid. Including the payment
          reference speeds it up, but it is not required — we can find it.
        </p>
      </ProseSection>
    </article>
  );
}
