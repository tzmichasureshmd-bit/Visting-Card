import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { serverConfig } from "@/lib/env";

export const runtime = "nodejs";

/**
 * POST /api/webhooks/razorpay
 *
 * Handles Razorpay webhook events.
 * - Verifies webhook signature using RAZORPAY_WEBHOOK_SECRET
 * - Idempotent: duplicate webhooks are safe (ON CONFLICT DO NOTHING)
 * - Never trusts client data — all amounts come from the webhook payload
 *   which is verified against the secret
 */
export async function POST(request: NextRequest) {
  if (!serverConfig.razorpayWebhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not configured");
    return new NextResponse(null, { status: 200 }); // Always 200 to Razorpay
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  // Verify webhook signature.
  const expectedSig = createHmac("sha256", serverConfig.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSig !== signature) {
    console.warn("[webhook] invalid signature");
    return new NextResponse(null, { status: 200 }); // Still 200 — don't reveal rejection
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 200 });
  }

  const eventType = typeof event.event === "string" ? event.event : "";
  const payload = (event.payload ?? {}) as Record<string, unknown>;

  try {
    switch (eventType) {
      case "payment.captured":
        await handlePaymentCaptured(payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload);
        break;
      case "refund.created":
      case "refund.processed":
        await handleRefund(payload);
        break;
      default:
        // Unknown event — log and acknowledge.
        console.log("[webhook] unhandled event", eventType);
    }
  } catch (err) {
    console.error("[webhook] handler error", eventType, err);
    // Always return 200 so Razorpay doesn't retry indefinitely.
  }

  return new NextResponse(null, { status: 200 });
}

async function handlePaymentCaptured(payload: Record<string, unknown>) {
  const payment = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;
  if (!payment) return;

  const orderId = typeof payment.order_id === "string" ? payment.order_id : null;
  const paymentId = typeof payment.id === "string" ? payment.id : null;
  const amountPaise = typeof payment.amount === "number" ? payment.amount : null;

  if (!orderId || !paymentId || !amountPaise) return;

  const supabase = await createClient();

  // Find the payment record by order_id.
  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, user_id, plan_id, amount_paise, status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!paymentRecord) {
    console.warn("[webhook] payment record not found for order", orderId);
    return;
  }

  // Idempotency: already captured.
  if (paymentRecord.status === "captured") return;

  // Verify amount matches — anti-manipulation.
  if (paymentRecord.amount_paise !== amountPaise) {
    console.error("[webhook] amount mismatch", { expected: paymentRecord.amount_paise, got: amountPaise });
    return;
  }

  const now = new Date().toISOString();
  const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  // Update payment status.
  await supabase
    .from("payments")
    .update({
      transaction_id: paymentId,
      status: "captured",
      verified_at: now,
    })
    .eq("id", paymentRecord.id);

  // Check if subscription already exists (created by /verify endpoint).
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", paymentRecord.user_id)
    .in("status", ["active"])
    .maybeSingle();

  if (existingSub) return; // Already activated via /verify.

  // Cancel old subscriptions.
  await supabase
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: now })
    .eq("user_id", paymentRecord.user_id)
    .in("status", ["active", "grace", "pending"]);

  // Create subscription.
  const { data: newSub } = await supabase
    .from("subscriptions")
    .insert({
      user_id: paymentRecord.user_id,
      plan_id: paymentRecord.plan_id,
      status: "active",
      started_at: now,
      current_period_end: periodEnd,
      price_paise: paymentRecord.amount_paise,
      billing_period: "annual",
    })
    .select("id")
    .single();

  if (newSub) {
    await supabase
      .from("payments")
      .update({ subscription_id: newSub.id })
      .eq("id", paymentRecord.id);

    // Trigger referral commission.
    await supabase.rpc("record_referral_reward", {
      p_referred_user_id: paymentRecord.user_id,
      p_subscription_id: newSub.id,
      p_payment_id: paymentRecord.id,
      p_base_amount_paise: paymentRecord.amount_paise,
    });
  }
}

async function handlePaymentFailed(payload: Record<string, unknown>) {
  const payment = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;
  if (!payment) return;

  const orderId = typeof payment.order_id === "string" ? payment.order_id : null;
  if (!orderId) return;

  const supabase = await createClient();
  await supabase
    .from("payments")
    .update({ status: "failed" })
    .eq("order_id", orderId)
    .eq("status", "created"); // Only update if still pending.
}

async function handleRefund(payload: Record<string, unknown>) {
  const refund = (payload.refund as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;
  if (!refund) return;

  const paymentId = typeof refund.payment_id === "string" ? refund.payment_id : null;
  if (!paymentId) return;

  const supabase = await createClient();

  // Find the payment.
  const { data: paymentRecord } = await supabase
    .from("payments")
    .select("id, user_id, subscription_id")
    .eq("transaction_id", paymentId)
    .maybeSingle();

  if (!paymentRecord) return;

  // Mark payment as refunded.
  await supabase
    .from("payments")
    .update({ status: "refunded" })
    .eq("id", paymentRecord.id);

  // Cancel the subscription.
  if (paymentRecord.subscription_id) {
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", paymentRecord.subscription_id);
  }

  // Reverse referral rewards for this subscription.
  if (paymentRecord.subscription_id) {
    await supabase
      .from("referral_rewards")
      .update({ status: "rejected" })
      .eq("subscription_id", paymentRecord.subscription_id)
      .in("status", ["qualified", "pending"]);

    // Re-sync affected wallets.
    const { data: rewards } = await supabase
      .from("referral_rewards")
      .select("user_id")
      .eq("subscription_id", paymentRecord.subscription_id);

    for (const reward of rewards ?? []) {
      await supabase.rpc("sync_referral_wallet", { p_user_id: reward.user_id });
    }
  }
}
