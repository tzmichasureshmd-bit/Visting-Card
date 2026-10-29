"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRouter = void 0;
const express_1 = require("express");
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
exports.webhooksRouter = (0, express_1.Router)();
// POST /api/webhooks/razorpay
exports.webhooksRouter.post("/razorpay", async (req, res) => {
    res.status(200).end(); // always ack immediately
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret)
        return;
    const rawBody = req.body;
    const signature = req.headers["x-razorpay-signature"];
    const expected = (0, crypto_1.createHmac)("sha256", secret).update(rawBody).digest("hex");
    if (expected !== signature) {
        console.warn("[webhook] invalid signature");
        return;
    }
    let event;
    try {
        event = JSON.parse(rawBody.toString());
    }
    catch {
        return;
    }
    const eventType = event.event;
    const payload = (event.payload ?? {});
    try {
        if (eventType === "payment.captured")
            await handleCaptured(payload);
        if (eventType === "payment.failed")
            await handleFailed(payload);
        if (eventType === "refund.created" || eventType === "refund.processed")
            await handleRefund(payload);
    }
    catch (err) {
        console.error("[webhook] handler error", eventType, err);
    }
});
async function handleCaptured(payload) {
    const entity = payload.payment?.entity;
    if (!entity)
        return;
    const orderId = entity.order_id;
    const paymentId = entity.id;
    const amount = entity.amount;
    const payment = await prisma_1.prisma.payment.findFirst({ where: { orderId } });
    if (!payment || payment.status === "captured")
        return;
    if (payment.amountPaise !== amount)
        return;
    await prisma_1.prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: paymentId, status: "captured", verifiedAt: new Date() },
    });
    const existing = await prisma_1.prisma.subscription.findFirst({
        where: { userId: payment.userId, status: { in: ["active"] } },
    });
    if (existing)
        return;
    await prisma_1.prisma.subscription.updateMany({
        where: { userId: payment.userId, status: { in: ["active", "grace", "pending"] } },
        data: { status: "cancelled", cancelledAt: new Date() },
    });
    const sub = await prisma_1.prisma.subscription.create({
        data: {
            userId: payment.userId,
            planId: payment.planId,
            status: "active",
            startedAt: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            pricePaise: payment.amountPaise,
            billingPeriod: "annual",
        },
    });
    await prisma_1.prisma.payment.update({ where: { id: payment.id }, data: { subscriptionId: sub.id } });
}
async function handleFailed(payload) {
    const entity = payload.payment?.entity;
    const orderId = entity?.order_id;
    if (!orderId)
        return;
    await prisma_1.prisma.payment.updateMany({ where: { orderId, status: "created" }, data: { status: "failed" } });
}
async function handleRefund(payload) {
    const entity = payload.refund?.entity;
    const paymentId = entity?.payment_id;
    if (!paymentId)
        return;
    const payment = await prisma_1.prisma.payment.findFirst({ where: { transactionId: paymentId } });
    if (!payment)
        return;
    await prisma_1.prisma.payment.update({ where: { id: payment.id }, data: { status: "refunded" } });
    if (payment.subscriptionId) {
        await prisma_1.prisma.subscription.update({
            where: { id: payment.subscriptionId },
            data: { status: "cancelled", cancelledAt: new Date() },
        });
        await prisma_1.prisma.referralReward.updateMany({
            where: { subscriptionId: payment.subscriptionId, status: { in: ["qualified", "pending"] } },
            data: { status: "rejected" },
        });
    }
}
//# sourceMappingURL=webhooks.js.map