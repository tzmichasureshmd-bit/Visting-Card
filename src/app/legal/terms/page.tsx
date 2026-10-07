import type { Metadata } from "next";

import { ProseHeader, ProseSection } from "@/components/marketing/prose";
import { publicConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The agreement that applies when you use Digital Visiting Card by Tzmicha It Solutions.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <article>
      <ProseHeader
        title="Terms of service"
        summary="These are the terms under which we provide Digital Visiting Card by Tzmicha It Solutions. By creating an account you agree to them."
        updated="5 October 2026"
      />

      <ProseSection title="Your account">
        <p>
          You are responsible for keeping your password secret and for everything that happens
          under your account. Tell us at once if you think someone else has it — we would rather
          lock an account down early than investigate a mess later.
        </p>
        <p>
          You must be at least 18 and able to enter into a contract under Indian law to use DV
          Card. One person may not hold an account on behalf of someone else without saying so.
        </p>
      </ProseSection>

      <ProseSection title="Your card, your content">
        <p>
          Everything you put on your card belongs to you. You grant us only the permission needed
          to host and display it — to run the service, we have to be able to store, cache and
          serve what you upload. That permission ends when you delete the content or your account.
        </p>
        <p>
          You are responsible for having the rights to what you upload, including photographs and
          logos, and for the accuracy of what you publish about your business.
        </p>
      </ProseSection>

      <ProseSection title="What is not allowed">
        <p>
          Do not use the Digital Visiting Card service for anything unlawful, deceptive or harmful — fraudulent offers,
          impersonation, malware, content that infringes someone else&apos;s rights, or anything
          that would get our payment provider or hosting provider into trouble. We may suspend a
          card that breaks these rules, and we will tell you when we do.
        </p>
      </ProseSection>

      <ProseSection title="Plans, billing and cancellation">
        <p>
          The free plan is free with no end date. Paid plans are billed in advance for the term you
          choose, in Indian rupees, and renew automatically until you cancel. You can cancel from
          your dashboard at any time; the card keeps working until the end of the term you have
          already paid for.
        </p>
        <p>
          If a payment fails we will try again and let you know. Cards on a paid plan that lapses
          are suspended rather than deleted, so your content is waiting when you come back.
        </p>
      </ProseSection>

      <ProseSection title="Changes to these terms">
        <p>
          We may update these terms as the product grows. If a change materially affects you, we
          will email you before it takes effect. Continuing to use the Digital Visiting Card service after that date means
          you accept the revised terms; if you do not, close your account and we will refund any
          unused prepaid period.
        </p>
      </ProseSection>

      <ProseSection title="Liability">
        <p>
          The Digital Visiting Card service is provided as it is. To the extent the law allows, we are not liable for
          indirect or consequential losses, for lost profits, or for the loss of data arising from
          use of the service. Our total liability for any claim is limited to the amount you paid
          us in the twelve months before the claim. Nothing here limits liability that cannot be
          limited under Indian law.
        </p>
      </ProseSection>

      <ProseSection title="Governing law">
        <p>
          These terms are governed by the laws of India, and disputes go to the courts having
          jurisdiction over the place where Tzmicha It Solutions operates.
        </p>
      </ProseSection>

      <ProseSection title="Contact">
        <p>
          Questions about these terms go to{" "}
          <a href={`mailto:${publicConfig.supportEmail}`} className="text-fg underline underline-offset-2">
            {publicConfig.supportEmail}
          </a>
          , or use the{" "}
          <a href="/legal/contact" className="text-fg underline underline-offset-2">
            contact page
          </a>
          .
        </p>
      </ProseSection>
    </article>
  );
}
