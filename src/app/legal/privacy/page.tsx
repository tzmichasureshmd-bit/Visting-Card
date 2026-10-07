import type { Metadata } from "next";

import { ProseHeader, ProseSection } from "@/components/marketing/prose";
import { publicConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What Tzmicha It Solutions collects, why, and what you can do about it.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <article>
      <ProseHeader
        title="Privacy policy"
        summary="This explains what Tzmicha It Solutions stores about you and the people who visit your card, and the choices you have. We have kept it plain on purpose."
        updated="5 October 2026"
      />

      <ProseSection title="What we collect">
        <p>
          When you create an account we store your email address, the name and phone number you
          choose to give us, and your password (kept only as an irreversible hash — we cannot read
          it, and neither can anyone who obtains our database).
        </p>
        <p>
          The details you put on a card — your name, photo, contact information, services, prices,
          gallery and the rest — are stored so we can display them to whoever opens your link.
        </p>
      </ProseSection>

      <ProseSection title="What visitors to your card produce">
        <p>
          When someone opens a card we record that the card was viewed, and whether they tapped a
          link, called, opened WhatsApp or scanned the QR code. Visitor identity is reduced to a
          salted hash that resets daily, which lets us say &ldquo;how many people&rdquo; without
          knowing who they are. We do not store raw IP addresses, and analytics history is kept for
          30 days on the free plan.
        </p>
        <p>
          If a visitor sends an enquiry or requests an appointment, whatever they typed is stored so
          you can reply. It is visible only to you and, on a Business plan, to your team.
        </p>
      </ProseSection>

      <ProseSection title="Payments">
        <p>
          Card payments are handled by Razorpay. We receive the payment status, the amount and a
          transaction reference — never your card number, CVV or banking password, which never
          reach our servers. UPI payments go directly from the visitor to the UPI ID you entered;
          we do not process, hold or see them.
        </p>
      </ProseSection>

      <ProseSection title="What we never do">
        <p>
          We do not sell personal data, we do not share your leads with other users, and we do not
          use the contents of your card to advertise to you or to anyone else.
        </p>
      </ProseSection>

      <ProseSection title="Who can see your account data">
        <p>
          Access inside the Digital Visiting Card platform is governed by database row-level security: your rows are readable
          by your own account and by nobody else, except where a support conversation gives you
          reason to share. Our team accesses customer data only to fix a reported problem, and we
          log it when we do.
        </p>
      </ProseSection>

      <ProseSection title="Your choices">
        <p>
          You can edit your card details at any time from your dashboard. You can export or delete
          your account by writing to us — deletion removes your cards, leads and profile, and we
          honour it within 30 days. Some records, such as payment receipts, are kept for as long as
          Indian tax law requires, because deleting them early would be unlawful for us to do.
        </p>
      </ProseSection>

      <ProseSection title="Cookies">
        <p>
          We use cookies for exactly two things: keeping you signed in, and remembering whether you
          prefer the light or dark interface. There are no advertising or third-party tracking
          cookies on this site.
        </p>
      </ProseSection>

      <ProseSection title="Questions">
        <p>
          Write to{" "}
          <a href={`mailto:${publicConfig.supportEmail}`} className="text-fg underline underline-offset-2">
            {publicConfig.supportEmail}
          </a>{" "}
          or use the{" "}
          <a href="/legal/contact" className="text-fg underline underline-offset-2">
            contact page
          </a>
          . We answer every message, not just the urgent-looking ones.
        </p>
      </ProseSection>
    </article>
  );
}
