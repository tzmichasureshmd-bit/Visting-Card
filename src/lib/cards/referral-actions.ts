"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/validation";
import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function limit(key: string, max: number): Promise<string | null> {
  const h = await headers();
  const result = rateLimit(`${key}:${clientIp(h)}`, max, 60_000);
  if (!result.allowed) return `Too many attempts. Please wait ${result.retryAfter} seconds.`;
  return null;
}

const withdrawSchema = z.object({
  amount: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1, "Enter a valid amount.")),
  upiId: z
    .string()
    .trim()
    .min(5, "Please enter a valid UPI ID.")
    .max(100, "UPI ID is too long.")
    .regex(/^[\w.\-]+@[\w]+$/, "Please enter a valid UPI ID (e.g. name@upi)."),
});

/**
 * Request a payout via the `request_payout` DB function.
 * The function validates balance server-side and holds funds atomically —
 * two simultaneous requests cannot both spend the same balance.
 */
export async function requestWithdrawalAction(
  _prev: ActionResult<{ requestId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ requestId: string }>> {
  const blocked = await limit("withdrawal", 5);
  if (blocked) return fail(blocked);

  await requireUser();

  const parsed = withdrawSchema.safeParse({
    amount: formData.get("amount"),
    upiId: formData.get("upiId"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fail("Please check the details below.", fieldErrors);
  }

  const { amount, upiId } = parsed.data;
  const amountPaise = amount * 100;

  const supabase = await createClient();

  // Call the DB function — it validates balance, minimum, and holds funds atomically.
  const { data, error } = await supabase.rpc("request_payout", {
    p_amount_paise: amountPaise,
    p_method: "upi",
    p_upi_id: upiId,
    p_bank_details: null,
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_BALANCE")) {
      return fail("Insufficient balance for this withdrawal.");
    }
    if (error.message.includes("BELOW_MINIMUM")) {
      return fail("Amount is below the minimum withdrawal threshold.");
    }
    console.error("[withdrawal] request_payout failed", error.message);
    return fail("We could not process your withdrawal request. Please try again.");
  }

  return { ok: true, data: { requestId: String(data) }, message: "Withdrawal requested." };
}
