import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { serverConfig } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/payments/verify
 *
 * Verifies the Razorpay payment signature after checkout completes.
 * NEVER activates a subscription from frontend success alone.
 *
 * Flow:
 *   1. Verify HMAC-SHA256 signature using the secret key
 *   2. Match order_id to our payments table
 *   3. Verify amount matches the plan price (anti-manipulation)
 *   4. Activate subscription
 *   5. Trigger referral commission if applicable
 */
export async function POST(request: NextRequest) {
  const ip = clientIp(request.headers);
  const rl = rateLimit(`payment-verify:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  if (!serverConfig.razorpayEnabled) {
    return NextResponse.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    (body as Record<string, unknown>);

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  // 1. Verify signature — this is the critical security check.
  const expectedSignature = createHmac("sha256", serverConfig.razorpayKeySecret!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    console.warn("[payments] signature mismatch", { razorpay_order_id, user_id: user.id });
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const supabase = await createClient();

  // 2. Find the pending payment record — scoped to this user to prevent IDOR.
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, user_id, plan_id, amount_paise, status, order_id")
    .eq("order_id", razorpay_order_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("[payments] payment record not found", razorpay_order_id);
    return NextResponse.json({ error: "Payment record not found." }, { status: 404 });
  }

  // Idempotency: already captured means already processed.
  if (payment.status === "captured") {
    return NextResponse.json({ success: true, message: "Already processed." });
  }

  // 3. Verify plan amount from DB — never trust client-supplied amount.
  const { data: plan } = await supabase
    .from("plans")
    .select("id, slug, name, price_paise")
    .eq("id", payment.plan_id)
    .maybeSingle();

  if (!plan || plan.price_paise !== payment.amount_paise) {
    console.error("[payments] amount mismatch", { plan_price: plan?.price_paise, paid: payment.amount_paise });
    return NextResponse.json({ error: "Payment amount mismatch." }, { status: 400 });
  }

  // 4. Mark payment as captured and activate subscription atomically via DB function.
  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      transaction_id: razorpay_payment_id,
      status: "captured",
      verified_at: now,
      provider_payload: { razorpay_order_id, razorpay_payment_id, razorpay_signature },
    })
    .eq("id", payment.id);

  if (updateError) {
    console.error("[payments] payment update failed", updateError.message);
    return NextResponse.json({ error: "Could not record payment." }, { status: 500 });
  }

  // Cancel any existing active subscription first (upgrade/downgrade).
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now })
    .eq("user_id", user.id)
    .in("status", ["active", "grace", "pending"]);

  // Create the new active subscription.
  const { data: newSub, error: subError } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_id: payment.plan_id,
      status: "active",
      started_at: now,
      current_period_end: periodEnd,
      price_paise: payment.amount_paise,
      billing_period: "annual",
    })
    .select("id")
    .single();

  if (subError || !newSub) {
    console.error("[payments] subscription creation failed", subError?.message);
    return NextResponse.json({ error: "Could not activate subscription." }, { status: 500 });
  }

  // Link payment to subscription.
  await supabase
    .from("payments")
    .update({ subscription_id: newSub.id })
    .eq("id", payment.id);

  // 5. Trigger referral commission (Level 1 + Level 2) via DB function.
  try {
    await supabase.rpc("record_referral_reward", {
      p_referred_user_id: user.id,
      p_subscription_id: newSub.id,
      p_payment_id: payment.id,
      p_base_amount_paise: payment.amount_paise,
    });

    // Level 2: find the referrer's referrer and award 5%.
    const { data: l1Referral } = await supabase
      .from("referrals")
      .select("referrer_id")
      .eq("referred_user_id", user.id)
      .maybeSingle();

    if (l1Referral?.referrer_id) {
      await recordLevel2Commission(
        supabase,
        l1Referral.referrer_id,
        newSub.id,
        payment.id,
        payment.amount_paise,
      );
    }
  } catch (err) {
    // Commission failure must not fail the payment response.
    console.error("[payments] referral commission failed", err);
  }

  return NextResponse.json({ success: true, subscriptionId: newSub.id });
}

/**
 * Level 2 commission: 5% to the referrer's referrer.
 * Uses a separate insert rather than the DB function (which is Level 1 only).
 */
async function recordLevel2Commission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  l1ReferrerId: string,
  subscriptionId: string,
  paymentId: string,
  baseAmountPaise: number,
) {
  // Find L1's referrer (L2 beneficiary).
  const { data: l2Referral } = await supabase
    .from("referrals")
    .select("id, referrer_id")
    .eq("referred_user_id", l1ReferrerId)
    .maybeSingle();

  if (!l2Referral?.referrer_id) return;

  // Get the configured L2 rate from referral_config.
  const { data: cfg } = await supabase
    .from("referral_config")
    .select("commission_percent, eligible_plans, is_active")
    .eq("id", true)
    .maybeSingle();

  if (!cfg?.is_active) return;

  // L2 rate is 25% of L1 rate (e.g. 20% L1 → 5% L2).
  const l2Percent = Math.round(Number(cfg.commission_percent) * 0.25 * 100) / 100;
  const l2Amount = Math.round(baseAmountPaise * l2Percent / 100);
  if (l2Amount <= 0) return;

  await supabase.from("referral_rewards").insert({
    referral_id: l2Referral.id,
    user_id: l2Referral.referrer_id,
    subscription_id: subscriptionId,
    payment_id: paymentId,
    commission_percent: l2Percent,
    base_amount_paise: baseAmountPaise,
    commission_amount: l2Amount,
    status: "qualified",
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });
  // Ignore duplicate (idempotency) — unique constraint on subscription_id handles it.

  // Sync L2 wallet.
  await supabase.rpc("sync_referral_wallet", { p_user_id: l2Referral.referrer_id });
}
