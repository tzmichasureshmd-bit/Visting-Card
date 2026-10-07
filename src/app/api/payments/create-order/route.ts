import { NextResponse, type NextRequest } from "next/server";
import Razorpay from "razorpay";

import { createClient } from "@/lib/supabase/server";
import { serverConfig } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order server-side.
 * The amount is ALWAYS read from the database plan row — never from the client.
 * This prevents amount manipulation: a client sending a lower price is ignored.
 *
 * Body: { planId: string }
 * Returns: { orderId, amount, currency, keyId }
 */
export async function POST(request: NextRequest) {
  // Rate limit: 10 order attempts per minute per IP.
  const ip = clientIp(request.headers);
  const rl = rateLimit(`payment-order:${ip}`, 10, 60_000);
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

  const planId = typeof (body as Record<string, unknown>).planId === "string"
    ? (body as Record<string, unknown>).planId as string
    : null;

  if (!planId || !/^[0-9a-f-]{36}$/i.test(planId)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const supabase = await createClient();

  // Read plan from DB — amount is authoritative here, never from client.
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, slug, name, price_paise, is_active, is_custom")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  if (plan.is_custom || plan.slug === "free") {
    return NextResponse.json({ error: "This plan cannot be purchased here." }, { status: 400 });
  }

  if (plan.price_paise <= 0) {
    return NextResponse.json({ error: "Invalid plan price." }, { status: 400 });
  }

  // Check for existing active subscription — prevent double-purchase.
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, status, plan_id")
    .eq("user_id", user.id)
    .in("status", ["active", "grace"])
    .maybeSingle();

  if (existingSub?.plan_id === planId) {
    return NextResponse.json({ error: "You already have this plan active." }, { status: 409 });
  }

  const razorpay = new Razorpay({
    key_id: serverConfig.razorpayKeyId!,
    key_secret: serverConfig.razorpayKeySecret!,
  });

  let order;
  try {
    order = await razorpay.orders.create({
      amount: plan.price_paise,
      currency: "INR",
      receipt: `dvc_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId,
        plan_slug: plan.slug,
      },
    });
  } catch (err) {
    console.error("[payments] razorpay order creation failed", err);
    return NextResponse.json({ error: "Could not create payment order. Please try again." }, { status: 502 });
  }

  // Persist the pending payment record immediately so the webhook can match it.
  const { error: insertError } = await supabase.from("payments").insert({
    user_id: user.id,
    plan_id: planId,
    order_id: order.id,
    amount_paise: plan.price_paise,
    currency: "INR",
    status: "created",
    provider: "razorpay",
  });

  if (insertError) {
    console.error("[payments] payment record insert failed", insertError.message);
    // Non-fatal: the webhook will still activate the subscription.
  }

  return NextResponse.json({
    orderId: order.id,
    amount: plan.price_paise,
    currency: "INR",
    keyId: serverConfig.razorpayKeyId,
    planName: plan.name,
  });
}
