import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/utils";
import { WithdrawForm } from "@/components/dashboard/withdraw-form";

export const metadata: Metadata = {
  title: "Request Withdrawal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WithdrawPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: wallet } = await supabase
    .from("referral_wallets")
    .select("available_paise")
    .eq("user_id", user.id)
    .maybeSingle();

  const available = wallet?.available_paise ?? 0;
  const MIN_PAISE = 50000; // ₹500 — matches referral_config seed

  if (available < MIN_PAISE) {
    redirect("/dashboard/referrals");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/dashboard/referrals"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Referrals
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Request Withdrawal</h1>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-[13px] text-muted">
          Available balance:{" "}
          <span className="font-semibold text-fg">{formatINR(available)}</span>
        </p>
        <p className="mt-0.5 text-[12px] text-subtle">
          Minimum withdrawal: {formatINR(MIN_PAISE)}. Payouts are processed manually within 3–5
          business days.
        </p>
        <div className="mt-5">
          <WithdrawForm availablePaise={available} minPaise={MIN_PAISE} />
        </div>
      </div>
    </div>
  );
}
