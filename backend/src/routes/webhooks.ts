import { Router, Request, Response } from "express";
import { createHmac } from "crypto";
import { prisma } from "../lib/prisma";

export const webhooksRouter = Router();

// POST /api/webhooks/razorpay
webhooksRouter.post("/razorpay", async (req: Request, res: Response) => {
  res.status(200).end(); // always ack immediately

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return;

  const rawBody = req.body as Buffer;
  const signature = req.headers["x-razorpay-signature"] as string;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected !== signature) {
    console.warn("[webhook] invalid signature");
    return;
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody.toString()) as Record<string, unknown>;
  } catch { return; }

  const eventType = event.event as string;
  const payload = (event.payload ?? {}) as Record<string, unknown>;

  try {
    if (eventType === "payment.captured") await handleCaptured(payload);
    if (eventType === "payment.failed") await handleFailed(payload);
    if (eventType === "refund.created" || eventType === "refund.processed") await handleRefund(payload);
  } catch (err) {
    console.error("[webhook] handler error", eventType, err);
  }
});

async function handleCaptured(payload: Record<string, unknown>) {
  const entity = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
  if (!entity) return;

  const orderId = entity.order_id as string;
  const paymentId = entity.id as string;
  const amount = entity.amount as number;

  const payment = await prisma.payment.findFirst({ where: { orderId } });
  if (!payment || payment.status === "captured") return;
  if (payment.amountPaise !== amount) return;

  await prisma.payment.update({
    where: { id: payment.id },
    data: { transactionId: paymentId, status: "captured", verifiedAt: new Date() },
  });

  const existing = await prisma.subscription.findFirst({
    where: { userId: payment.userId, status: { in: ["active"] } },
  });
  if (existing) return;

  await prisma.subscription.updateMany({
    where: { userId: payment.userId, status: { in: ["active", "grace", "pending"] } },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  const sub = await prisma.subscription.create({
    data: {
      userId: payment.userId,
      planId: payment.planId!,
      status: "active",
      startedAt: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      pricePaise: payment.amountPaise,
      billingPeriod: "annual",
    },
  });

  await prisma.payment.update({ where: { id: payment.id }, data: { subscriptionId: sub.id } });
}

async function handleFailed(payload: Record<string, unknown>) {
  const entity = (payload.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
  const orderId = entity?.order_id as string;
  if (!orderId) return;
  await prisma.payment.updateMany({ where: { orderId, status: "created" }, data: { status: "failed" } });
}

async function handleRefund(payload: Record<string, unknown>) {
  const entity = (payload.refund as Record<string, unknown>)?.entity as Record<string, unknown>;
  const paymentId = entity?.payment_id as string;
  if (!paymentId) return;

  const payment = await prisma.payment.findFirst({ where: { transactionId: paymentId } });
  if (!payment) return;

  await prisma.payment.update({ where: { id: payment.id }, data: { status: "refunded" } });

  if (payment.subscriptionId) {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
    await prisma.referralReward.updateMany({
      where: { subscriptionId: payment.subscriptionId, status: { in: ["qualified", "pending"] } },
      data: { status: "rejected" },
    });
  }
}
