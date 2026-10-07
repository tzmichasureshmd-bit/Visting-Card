import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  Gift,
  HelpCircle,
  Mail,
  MessageSquare,
  QrCode,
  Settings,
  Share2,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help & Support",
  description: "Get help with DV Card.",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Create your account, set up your first card and go live in minutes.",
    href: "#getting-started",
  },
  {
    icon: CreditCard,
    title: "Creating a Card",
    description: "Add your details, choose a design and customise every section.",
    href: "#creating-a-card",
  },
  {
    icon: Share2,
    title: "Sharing Your Card",
    description: "Share via link, WhatsApp, QR code or save as a contact.",
    href: "#sharing",
  },
  {
    icon: QrCode,
    title: "Printing",
    description: "Download a print-ready PDF or PNG for physical business cards.",
    href: "#printing",
  },
  {
    icon: CreditCard,
    title: "Payments & Plans",
    description: "Upgrade your plan, manage your subscription and view invoices.",
    href: "#payments",
  },
  {
    icon: Gift,
    title: "Referrals",
    description: "Earn commission by referring businesses to DV Card.",
    href: "#referrals",
  },
  {
    icon: Wallet,
    title: "Wallet & Withdrawals",
    description: "Check your balance and request a payout to your UPI.",
    href: "#wallet",
  },
  {
    icon: Settings,
    title: "Account & Settings",
    description: "Update your profile, change your password and manage notifications.",
    href: "#account",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">
          Help &amp; Support
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          Find answers, guides and ways to get in touch.
        </p>
      </div>

      {/* Topic grid */}
      <section aria-labelledby="topics-heading">
        <h2 id="topics-heading" className="sr-only">
          Help topics
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.title}>
              <a
                href={section.href}
                className="flex items-start gap-4 rounded-2xl border border-line bg-surface p-4 shadow-sm transition-[border-color,box-shadow] hover:border-line-strong hover:shadow-md"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-fg">
                  <section.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-fg">
                    {section.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                    {section.description}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* Contact */}
      <section
        aria-labelledby="contact-heading"
        className="mt-10 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">
            <HelpCircle className="size-5 text-muted" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="contact-heading" className="text-[15px] font-semibold text-fg">
              Still need help?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Our support team is available Monday–Saturday, 10 am–6 pm IST.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="mailto:support@dvcard.in"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-[13px] font-medium text-fg transition-colors hover:border-line-strong"
              >
                <Mail className="size-4 text-muted" aria-hidden />
                Email support
              </a>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25d366] px-4 py-2.5 text-[13px] font-medium text-white transition-[filter] hover:brightness-110"
              >
                <MessageSquare className="size-4" aria-hidden />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ stubs */}
      <section id="getting-started" aria-labelledby="gs-heading" className="mt-10">
        <h2 id="gs-heading" className="text-[17px] font-semibold text-fg">
          Getting Started
        </h2>
        <div className="mt-4 space-y-3">
          {[
            {
              q: "How do I create my first card?",
              a: 'Click "New Card" in the sidebar or dashboard. You\'ll be guided through choosing a username, entering your details and picking a design. The whole process takes about two minutes.',
            },
            {
              q: "Can I have more than one card?",
              a: "Yes. The number of cards depends on your plan. Free accounts get one card; paid plans include more. You can see your limit on the dashboard.",
            },
            {
              q: "Is my card visible immediately after I publish?",
              a: "Yes. Once you click Publish in the builder, your card is live at dvcard.in/card/your-username and anyone with the link can open it.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-[14px] font-medium text-fg">
                {item.q}
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="sharing" aria-labelledby="sharing-heading" className="mt-8">
        <h2 id="sharing-heading" className="text-[17px] font-semibold text-fg">
          Sharing Your Card
        </h2>
        <div className="mt-4 space-y-3">
          {[
            {
              q: "How do I share my card?",
              a: 'Open your card on the dashboard and click "Share". You can copy the link, send it via WhatsApp, share via the native share sheet, or show a QR code.',
            },
            {
              q: "How does the QR code work?",
              a: "The QR code encodes your card URL. Anyone who scans it is taken directly to your live card. You can download the QR as a PNG from the builder's Publish tab.",
            },
            {
              q: "Can visitors save my contact details?",
              a: "Yes. Your card includes a Save Contact button that downloads a .vcf file. On mobile, this opens directly in the Contacts app.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-[14px] font-medium text-fg">
                {item.q}
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="referrals" aria-labelledby="ref-heading" className="mt-8">
        <h2 id="ref-heading" className="text-[17px] font-semibold text-fg">
          Referrals
        </h2>
        <div className="mt-4 space-y-3">
          {[
            {
              q: "How does the referral programme work?",
              a: "Share your referral link. When someone signs up through it and buys a paid plan, you earn a commission. The commission is credited to your wallet once the payment is verified.",
            },
            {
              q: "When can I withdraw my earnings?",
              a: "You can request a withdrawal once your available balance reaches ₹500. Payouts are processed manually within 3–5 business days to your UPI ID.",
            },
            {
              q: "Where do I find my referral link?",
              a: 'Go to Referrals in the sidebar. Your unique link is shown at the top of the page with Copy and WhatsApp share buttons.',
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-line bg-surface px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-[14px] font-medium text-fg">
                {item.q}
              </summary>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mt-10 rounded-2xl border border-line bg-surface-2 px-5 py-4 text-center">
        <p className="text-[13px] text-muted">
          Didn&apos;t find what you were looking for?{" "}
          <Link
            href="mailto:support@dvcard.in"
            className="font-medium text-fg underline underline-offset-2"
          >
            Email us
          </Link>{" "}
          and we&apos;ll get back to you within one business day.
        </p>
      </div>
    </div>
  );
}
