"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { requestWithdrawalAction } from "@/lib/cards/referral-actions";
import { formatINR } from "@/lib/utils";

export function WithdrawForm({
  availablePaise,
  minPaise,
}: {
  availablePaise: number;
  minPaise: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, action, pending] = useActionState(requestWithdrawalAction, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast({ variant: "success", title: "Withdrawal requested. We will process it within 3–5 business days." });
      router.push("/dashboard/referrals");
    } else {
      toast({ variant: "error", title: state.error });
    }
  }, [state, router, toast]);

  return (
    <form action={action} className="space-y-4">
      <Input
        label="Amount (₹)"
        name="amount"
        type="number"
        min={minPaise / 100}
        max={availablePaise / 100}
        step={1}
        defaultValue={Math.floor(availablePaise / 100)}
        required
        hint={`Between ₹${minPaise / 100} and ${formatINR(availablePaise)}`}
        error={state?.ok === false && state.fieldErrors?.amount ? state.fieldErrors.amount : undefined}
      />
      <Input
        label="UPI ID"
        name="upiId"
        type="text"
        placeholder="yourname@upi"
        required
        error={state?.ok === false && state.fieldErrors?.upiId ? state.fieldErrors.upiId : undefined}
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Submitting..." : "Request Withdrawal"}
      </Button>
    </form>
  );
}
