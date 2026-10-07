import type { Metadata } from "next";
import Link from "next/link";
import { Check, Crown, ShieldCheck, Zap } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { requireUser } from "@/lib/auth/session";
import { getSubscriptionStatus, getUserPlan } from "@/lib/cards/limits";
import { getPricingTiers } from "@/lib/marketing/pricing";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import type { SubscriptionSummary } from "@/lib/cards/limits";

export const metadata: Metadata = {
  title: "Billing",
  description: "Your plan, payment history and invoices.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function statusTone(status: string): "success" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "active":    return "success";
    case "pending":   return "warning";
    case "grace":     return "warning";
    case "expired":   return "danger";
    case "cancelled": return "danger";
    default:          return "neutral";
  }
}

function statusLine(subscription: SubscriptionSummary | null): string {
  if (!subscription) return "You are on the free plan — no active subscription.";
  const fmt = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : null;
  switch (subscription.status) {
    case "active":    return `Active${fmt(subscription.periodEnd) ? `. Renews ${fmt(subscription.periodEnd)}.` : "."}`;
    case "pending":   return "Payment pending verification.";
    case "grace":     return `Grace period until ${fmt(subscription.graceUntil ?? subscription.periodEnd) ?? "soon"}.`;
    case "expired":   return "Subscription expired — on Free limits.";
    case "cancelled": return "Subscription cancelled — on Free limits.";
  }
}

export default async function BillingPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [plan, subscription, paymentsResult, tiers] = await Promise.all([
    getUserPlan(supabase, user.id),
    getSubscriptionStatus(supabase, user.id),
    supabase
      .from("payments")
      .select("id, amount_paise, currency, status, created_at, gateway_order_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    getPricingTiers(),
  ]);

  const payments = paymentsResult.data ?? [];
  const currentSlug = plan.slug;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Billing & Plans</h1>
        <p className="mt-1 text-sm text-muted">Choose a plan that fits your needs. Upgrade anytime.</p>
      </div>

      {/* Current plan status */}
      <section aria-labelledby="plan-heading" className="mb-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="plan-heading" className="text-[15px] font-semibold text-fg">Current Plan</h2>
            <p className="mt-0.5 text-[13px] text-muted">{plan.name} plan</p>
          </div>
          <Badge tone={plan.name === "Free" ? "neutral" : "info"}>
            {plan.name === "Free" ? null : <Crown className="size-3 mr-1" aria-hidden />}
            {plan.name}
          </Badge>
        </div>
        {subscription ? (
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-[12.5px] leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            {statusLine(subscription)}
          </p>
        ) : (
          <p className="mt-3 text-[13px] text-muted">{statusLine(null)}</p>
        )}
      </section>

      {/* Plan cards */}
      <section aria-labelledby="plans-heading" className="mb-8">
        <h2 id="plans-heading" className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-muted">
          Available Plans
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {tiers.map((tier) => {
            const isCurrent = tier.slug === currentSlug;
            const isFree = tier.pricePaise === 0 && tier.slug !== "enterprise";
            const isEnterprise = tier.slug === "enterprise";

            return (
              <div
                key={tier.slug}
                style={{
                  border: isCurrent
                    ? "2px solid var(--dv-lime)"
                    : tier.highlighted
                      ? "2px solid var(--dv-black)"
                      : "1px solid var(--dv-border)",
                  borderRadius: "var(--dv-r-lg)",
                  padding: "1.5rem",
                  background: tier.highlighted ? "var(--dv-black)" : "var(--dv-white)",
                  color: tier.highlighted ? "var(--dv-white)" : "var(--dv-black)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {isCurrent && (
                  <span style={{
                    position: "absolute", top: "-0.75rem", left: "1rem",
                    background: "var(--dv-lime)", color: "var(--dv-black)",
                    fontSize: "0.6875rem", fontWeight: 900, letterSpacing: "0.1em",
                    textTransform: "uppercase", padding: "0.2rem 0.625rem",
                    borderRadius: "999px",
                  }}>
                    Current
                  </span>
                )}
                {tier.highlighted && !isCurrent && (
                  <p style={{ fontSize: "0.6875rem", fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem", color: "var(--dv-lime)" }}>
                    Most popular
                  </p>
                )}

                <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700 }}>{tier.name}</h3>
                <p style={{ margin: "0.25rem 0 1rem", fontSize: "0.8125rem", opacity: 0.6 }}>{tier.tagline}</p>

                <p style={{ margin: "0 0 1.25rem", display: "flex", alignItems: "baseline", gap: "0.375rem" }}>
                  <span style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.04em" }}>{tier.price}</span>
                  {tier.period && <span style={{ fontSize: "0.8125rem", opacity: 0.55 }}>{tier.period}</span>}
                </p>

                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.8125rem", opacity: 0.85 }}>
                      <Check style={{ width: "0.875rem", height: "0.875rem", flexShrink: 0, marginTop: "0.125rem", color: tier.highlighted ? "var(--dv-lime)" : "var(--dv-black)" }} aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div style={{
                    textAlign: "center", padding: "0.625rem",
                    border: "1.5px solid var(--dv-lime)", borderRadius: "var(--dv-r-sm)",
                    fontSize: "0.8125rem", fontWeight: 700, color: "var(--dv-black)",
                    background: "var(--dv-lime)",
                  }}>
                    ✓ Your current plan
                  </div>
                ) : isFree ? (
                  <div style={{
                    textAlign: "center", padding: "0.625rem",
                    border: "1px solid var(--dv-border)", borderRadius: "var(--dv-r-sm)",
                    fontSize: "0.8125rem", fontWeight: 600, color: "var(--dv-gray)",
                  }}>
                    Free forever
                  </div>
                ) : isEnterprise ? (
                  <Link href="/legal/contact" style={{
                    display: "block", textAlign: "center", padding: "0.75rem",
                    background: "var(--dv-off-white)", border: "1px solid var(--dv-border)",
                    borderRadius: "var(--dv-r-sm)", textDecoration: "none",
                    fontSize: "0.875rem", fontWeight: 700, color: "var(--dv-black)",
                  }}>
                    Talk to us
                  </Link>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <button
                      type="button"
                      disabled
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem",
                        padding: "0.75rem",
                        background: tier.highlighted ? "var(--dv-lime)" : "var(--dv-black)",
                        color: tier.highlighted ? "var(--dv-black)" : "var(--dv-white)",
                        border: "none", borderRadius: "var(--dv-r-sm)",
                        fontSize: "0.875rem", fontWeight: 700,
                        cursor: "not-allowed", opacity: 0.7,
                      }}
                    >
                      <Zap style={{ width: "0.875rem", height: "0.875rem" }} aria-hidden />
                      Upgrade to {tier.name}
                    </button>
                    <p style={{ margin: 0, textAlign: "center", fontSize: "0.6875rem", opacity: 0.5 }}>
                      Payments coming soon
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[12px] text-muted">
          Prices in INR per year, taxes included. Cancel any time from your dashboard.
        </p>
      </section>

      {/* Payment history */}
      <section aria-labelledby="payments-heading">
        <h2 id="payments-heading" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          Payment History
        </h2>
        {payments.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-fg">No payments yet</p>
            <p className="mt-1 text-[13px] text-muted">
              Payments appear here once you upgrade to a paid plan.
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 text-muted">
                      {new Date(payment.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-fg">
                      {formatINR(payment.amount_paise)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={statusTone(payment.status)}>{payment.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[12px] text-subtle">
                      {payment.gateway_order_id ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
