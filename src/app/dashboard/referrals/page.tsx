import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Wallet } from "lucide-react";

import GlassCard from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { ReferralCopyButton, ReferralWhatsAppButton } from "@/components/dashboard/referral-actions";

export const metadata: Metadata = {
  title: "Referrals",
  description: "Your referral earnings and history.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function statusTone(status: string): "success" | "warning" | "neutral" | "danger" {
  switch (status) {
    case "approved": return "success";
    case "qualified": return "warning";
    case "paid": return "success";
    case "rejected": return "danger";
    default: return "neutral";
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending",
    qualified: "Pending approval",
    approved: "Available",
    paid: "Paid",
    rejected: "Rejected",
  };
  return labels[status] ?? status;
}

export default async function ReferralsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [profileResult, walletResult, rewardsResult, payoutsResult, referralsResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("referral_wallets")
        .select("available_paise, pending_paise, lifetime_earned, lifetime_paid")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("referral_rewards")
        .select("id, commission_amount, commission_percent, base_amount_paise, status, created_at, subscriptions(plans(name, slug))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("payout_requests")
        .select("id, amount_paise, method, status, created_at, payout_reference")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("referrals")
        .select("id, status, created_at, profiles!referrals_referred_user_id_fkey(email)")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const profile = profileResult.data;
  const wallet = walletResult.data;
  const rewards = rewardsResult.data ?? [];
  const payouts = payoutsResult.data ?? [];
  const referrals = referralsResult.data ?? [];

  const referralCode = profile?.referral_code ?? "";
  const referralUrl = referralCode
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/signup?ref=${referralCode}`
    : "";

  const totalReferrals = referrals.length;
  const successfulReferrals = referrals.filter((r) => r.status === "qualified" || r.status === "approved" || r.status === "paid").length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Referrals</h1>
          <p className="mt-1 text-sm text-muted">Invite businesses. Earn from every successful referral.</p>
        </div>
        {wallet && (wallet.available_paise ?? 0) >= 50000 ? (
          <Button asChild size="sm">
            <Link href="/dashboard/referrals/withdraw">
              <Wallet className="size-3.5" aria-hidden />
              Request Withdrawal
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="space-y-8">

        {/* Referral link */}
        {referralCode ? (
          <section>
            <GlassCard
              title={referralCode}
              subtitle="Your referral link"
              description="Share this link. When someone signs up and pays, you earn 20% commission."
              backgroundColor="#111722"
              containerBackground="#0a0d14"
              enableTilt
              style={{ width: "100%" }}
            >
              <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.625rem" }}>
                <p style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace", fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "0.5rem 0.75rem", borderRadius: "0.5rem" }}>
                  {referralUrl}
                </p>
                <ReferralCopyButton url={referralUrl} />
                <ReferralWhatsAppButton url={referralUrl} />
              </div>
            </GlassCard>
          </section>
        ) : null}

        {/* Wallet summary */}
        <section>
          <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">Wallet</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Available",    value: wallet?.available_paise ?? 0,  subtitle: "Ready to withdraw",  highlight: true },
              { label: "Pending",      value: wallet?.pending_paise ?? 0,    subtitle: "Awaiting approval",  highlight: false },
              { label: "Total Earned", value: wallet?.lifetime_earned ?? 0,  subtitle: "All time earnings",  highlight: false },
              { label: "Withdrawn",    value: wallet?.lifetime_paid ?? 0,    subtitle: "Paid out to you",    highlight: false },
            ].map((stat) => (
              <GlassCard
                key={stat.label}
                subtitle={stat.subtitle}
                title={formatINR(stat.value)}
                description={stat.label}
                backgroundColor={stat.highlight ? "#0f1a0a" : "#111722"}
                containerBackground="#0a0d14"
                enableTilt
                style={{ width: "100%" }}
              />
            ))}
          </div>
          {(wallet?.available_paise ?? 0) > 0 && (wallet?.available_paise ?? 0) < 50000 ? (
            <p className="mt-2 text-[12px] text-subtle">
              Minimum withdrawal is ₹500. You need {formatINR(50000 - (wallet?.available_paise ?? 0))} more.
            </p>
          ) : null}
        </section>

        {/* Stats */}
        <section>
          <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">Overview</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Total Referrals", value: totalReferrals },
              { label: "Successful Purchases", value: successfulReferrals },
              { label: "Pending", value: totalReferrals - successfulReferrals },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-line bg-surface px-4 py-4">
                <p className="text-2xl font-semibold tabular-nums text-fg">{stat.value}</p>
                <p className="text-[12px] text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reward history */}
        <section>
          <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">Commission History</h2>
          {rewards.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-line px-6 py-10 text-center">
              <Gift className="mx-auto size-6 text-subtle" aria-hidden />
              <p className="mt-3 text-[15px] font-medium text-fg">No commissions yet</p>
              <p className="mt-1 text-[13px] text-muted">
                Share your referral link. Commission is recorded when someone you referred pays.
              </p>
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="px-4 py-3 text-left font-medium text-muted">Plan</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Commission</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Rate</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rewards.map((reward) => {
                    const planName = (reward.subscriptions as { plans?: { name?: string } } | null)?.plans?.name ?? "—";
                    return (
                      <tr key={reward.id}>
                        <td className="px-4 py-3 text-fg">{planName}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-fg">
                          {formatINR(reward.commission_amount)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted">
                          {Number(reward.commission_percent).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge tone={statusTone(reward.status)}>{statusLabel(reward.status)}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-subtle">
                          {new Date(reward.created_at).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Withdrawal history */}
        {payouts.length > 0 ? (
          <section>
            <h2 className="text-[13px] font-semibold tracking-wide text-muted uppercase">Withdrawal History</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="px-4 py-3 text-left font-medium text-muted">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted">Reference</th>
                    <th className="px-4 py-3 text-right font-medium text-muted">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-4 py-3 font-semibold tabular-nums text-fg">
                        {formatINR(payout.amount_paise)}
                      </td>
                      <td className="px-4 py-3 text-muted uppercase text-[12px]">{payout.method}</td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(payout.status)}>{payout.status}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-subtle">
                        {payout.payout_reference ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-subtle">
                        {new Date(payout.created_at).toLocaleDateString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

      </div>
    </div>
  );
}
