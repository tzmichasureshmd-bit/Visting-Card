import { Router, Response } from "express";
import { createHmac } from "crypto";
import { z } from "zod";
import Razorpay from "razorpay";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const paymentsRouter = Router();
paymentsRouter.use(authenticate);

function getRazorpay(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay not configured.");
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// POST /api/payments/create-order
paymentsRouter.post("/create-order", async (req: AuthRequest, res: Response) => {
  const { planId } = z.object({ planId: z.string().uuid() }).parse(req.body);

  const plan = await prisma.plan.findFirst({
    where: { id: planId, isActive: true, isCustom: false },
  });
  if (!plan || plan.slug === "free" || plan.pricePaise <= 0) {
    res.status(400).json({ error: "Invalid plan." }); return;
  }

  // Prevent duplicate active subscription for same plan
  const existing = await prisma.subscription.findFirst({
    where: { userId: req.userId!, status: { in: ["active", "grace"] }, planId },
  });
  if (existing) { res.status(409).json({ error: "You already have this plan active." }); return; }

  let order;
  try {
    const rp = getRazorpay();
    order = await (rp.orders.create as Function)({
      amount: plan.pricePaise,
      currency: "INR",
      receipt: `dvc_${req.userId!.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: req.userId!, plan_id: planId },
    });
  } catch {
    res.status(502).json({ error: "Could not create payment order. Please try again." }); return;
  }

  await prisma.payment.create({
    data: {
      userId: req.userId!,
      planId,
      orderId: order.id,
      amountPaise: plan.pricePaise,
      currency: "INR",
      status: "created",
    },
  }).catch(() => undefined);

  res.json({
    orderId: order.id,
    amount: plan.pricePaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
    planName: plan.name,
  });
});

// POST /api/payments/verify
paymentsRouter.post("/verify", async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Missing payment details." }); return; }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // Verify HMAC signature
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    res.status(400).json({ error: "Payment verification failed." }); return;
  }

  const payment = await prisma.payment.findFirst({
    where: { orderId: razorpay_order_id, userId: req.userId! },
  });
  if (!payment) { res.status(404).json({ error: "Payment record not found." }); return; }
  if (payment.status === "captured") { res.json({ success: true }); return; } // idempotent

  const plan = await prisma.plan.findUnique({ where: { id: payment.planId! } });
  if (!plan || plan.pricePaise !== payment.amountPaise) {
    res.status(400).json({ error: "Payment amount mismatch." }); return;
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId: razorpay_payment_id, status: "captured", verifiedAt: now,
      providerPayload: { razorpay_order_id, razorpay_payment_id, razorpay_signature } },
  });

  // Cancel old subscriptions
  await prisma.subscription.updateMany({
    where: { userId: req.userId!, status: { in: ["active", "grace", "pending"] } },
    data: { status: "cancelled", cancelledAt: now },
  });

  const sub = await prisma.subscription.create({
    data: {
      userId: req.userId!,
      planId: payment.planId!,
      status: "active",
      startedAt: now,
      currentPeriodEnd: periodEnd,
      pricePaise: payment.amountPaise,
      billingPeriod: "annual",
    },
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { subscriptionId: sub.id } });

  res.json({ success: true, subscriptionId: sub.id });
});

// GET /api/payments — payment history
paymentsRouter.get("/", async (req: AuthRequest, res: Response) => {
  const payments = await prisma.payment.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    include: { plan: { select: { name: true, slug: true } } },
    take: 50,
  });
  res.json(payments);
});
