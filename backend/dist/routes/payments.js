"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentsRouter = void 0;
const express_1 = require("express");
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const razorpay_1 = __importDefault(require("razorpay"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
exports.paymentsRouter = (0, express_1.Router)();
exports.paymentsRouter.use(auth_1.authenticate);
function getRazorpay() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)
        throw new Error("Razorpay not configured.");
    return new razorpay_1.default({ key_id: keyId, key_secret: keySecret });
}
// POST /api/payments/create-order
exports.paymentsRouter.post("/create-order", async (req, res) => {
    const { planId } = zod_1.z.object({ planId: zod_1.z.string().uuid() }).parse(req.body);
    const plan = await prisma_1.prisma.plan.findFirst({
        where: { id: planId, isActive: true, isCustom: false },
    });
    if (!plan || plan.slug === "free" || plan.pricePaise <= 0) {
        res.status(400).json({ error: "Invalid plan." });
        return;
    }
    // Prevent duplicate active subscription for same plan
    const existing = await prisma_1.prisma.subscription.findFirst({
        where: { userId: req.userId, status: { in: ["active", "grace"] }, planId },
    });
    if (existing) {
        res.status(409).json({ error: "You already have this plan active." });
        return;
    }
    let order;
    try {
        const rp = getRazorpay();
        order = await rp.orders.create({
            amount: plan.pricePaise,
            currency: "INR",
            receipt: `dvc_${req.userId.slice(0, 8)}_${Date.now()}`,
            notes: { user_id: req.userId, plan_id: planId },
        });
    }
    catch {
        res.status(502).json({ error: "Could not create payment order. Please try again." });
        return;
    }
    await prisma_1.prisma.payment.create({
        data: {
            userId: req.userId,
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
exports.paymentsRouter.post("/verify", async (req, res) => {
    const schema = zod_1.z.object({
        razorpay_order_id: zod_1.z.string(),
        razorpay_payment_id: zod_1.z.string(),
        razorpay_signature: zod_1.z.string(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Missing payment details." });
        return;
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
    // Verify HMAC signature
    const expected = (0, crypto_1.createHmac)("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
    if (expected !== razorpay_signature) {
        res.status(400).json({ error: "Payment verification failed." });
        return;
    }
    const payment = await prisma_1.prisma.payment.findFirst({
        where: { orderId: razorpay_order_id, userId: req.userId },
    });
    if (!payment) {
        res.status(404).json({ error: "Payment record not found." });
        return;
    }
    if (payment.status === "captured") {
        res.json({ success: true });
        return;
    } // idempotent
    const plan = await prisma_1.prisma.plan.findUnique({ where: { id: payment.planId } });
    if (!plan || plan.pricePaise !== payment.amountPaise) {
        res.status(400).json({ error: "Payment amount mismatch." });
        return;
    }
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    await prisma_1.prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: razorpay_payment_id, status: "captured", verifiedAt: now,
            providerPayload: { razorpay_order_id, razorpay_payment_id, razorpay_signature } },
    });
    // Cancel old subscriptions
    await prisma_1.prisma.subscription.updateMany({
        where: { userId: req.userId, status: { in: ["active", "grace", "pending"] } },
        data: { status: "cancelled", cancelledAt: now },
    });
    const sub = await prisma_1.prisma.subscription.create({
        data: {
            userId: req.userId,
            planId: payment.planId,
            status: "active",
            startedAt: now,
            currentPeriodEnd: periodEnd,
            pricePaise: payment.amountPaise,
            billingPeriod: "annual",
        },
    });
    await prisma_1.prisma.payment.update({ where: { id: payment.id }, data: { subscriptionId: sub.id } });
    res.json({ success: true, subscriptionId: sub.id });
});
// GET /api/payments — payment history
exports.paymentsRouter.get("/", async (req, res) => {
    const payments = await prisma_1.prisma.payment.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
        include: { plan: { select: { name: true, slug: true } } },
        take: 50,
    });
    res.json(payments);
});
//# sourceMappingURL=payments.js.map