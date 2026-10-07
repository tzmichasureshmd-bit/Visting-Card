import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownToLine, TrendingUp, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Wallet",
  description: "Your referral wallet balance and transactions.",
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

export default async function WalletPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [walletResult, rewardsResult, payoutsResult] = await Promise.all([
    supabase
      .from("referral_wallets")
      .select("available_paise, pending_paise, lifetime_earned, lifetime_paid")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("referral_rewards")
      .select("id, commission_amount, status, created_at, subscriptions(plans(name))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("payout_requests")
      .select("id, amount_paise, method, status, created_at, payout_reference")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const wallet = walletResult.data;
  const rewards = rewardsResult.data ?? [];
  const payouts = payoutsResult.data ?? [];
  const available = wallet?.available_paise ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Wallet</h1>
          <p className="mt-1 text-sm text-muted">Your referral earnings and withdrawal history.</p>
        </div>
        {available >= 50000 ? (
          <Button asChild size="sm">
            <Link href="/dashboard/referrals/withdraw">
              <Wallet className="size-3.5" aria-hidden />
              Request Withdrawal
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Balance cards */}
      <section aria-label="Wallet balances" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Available",    value: available,                      icon: Wallet,         highlight: true },
          { label: "Pending",      value: wallet?.pending_paise ?? 0,     icon: TrendingUp,     highlight: false },
          { label: "Total Earned", value: wallet?.lifetime_earned ?? 0,   icon: TrendingUp,     highlight: false },
          { label: "Withdrawn",    value: wallet?.lifetime_paid ?? 0,     icon: ArrowDownToLine, highlight: false },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-4 py-4 ${stat.highlight ? "border-brand/30 bg-brand-soft" : "border-line bg-surface"}`}
          >
            <stat.icon className={`size-4 ${stat.highlight ? "text-brand" : "text-subtle"}`} aria-hidden />
            <p className={`mt-2 text-xl font-semibold tabular-nums ${stat.highlight ? "text-brand" : "text-fg"}`}>
              {formatINR(stat.value)}
            </p>
            <p className="text-[12px] text-muted">{stat.label}</p>
          </div>
        ))}
      </section>

      {available > 0 && available < 50000 ? (
        <p className="mt-2 text-[12px] text-subtle">
          Minimum withdrawal is ₹500. You need {formatINR(50000 - available)} more.
        </p>
      ) : null}

      {/* Transactions */}
      <section aria-labelledby="transactions-heading" className="mt-10">
        <h2 id="transactions-heading" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          Transactions
        </h2>
        {rewards.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
            <p className="text-[15px] font-medium text-fg">No transactions yet</p>
            <p className="mt-1 text-[13px] text-muted">
              Commissions from referrals appear here.{" "}
              <Link href="/dashboard/referrals" className="underline underline-offset-2 hover:text-fg">
                Share your referral link
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="px-4 py-3 text-left font-medium text-muted">Plan</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Amount</th>
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
                      <td className="px-4 py-3 text-right">
                        <Badge tone={statusTone(reward.status)}>{reward.status}</Badge>
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
        <section aria-labelledby="withdrawals-heading" className="mt-8">
          <h2 id="withdrawals-heading" className="text-[13px] font-semibold uppercase tracking-wide text-muted">
            Withdrawals
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <th className="px-4 py-3 text-left font-medium text-muted">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Method</th>
                  <th className="px-4 py-3 text-left font-medium text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-4 py-3 font-semibold tabular-nums text-fg">
                      {formatINR(payout.amount_paise)}
                    </td>
                    <td className="px-4 py-3 uppercase text-[12px] text-muted">{payout.method}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(payout.status)}>{payout.status}</Badge>
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
  );
}
