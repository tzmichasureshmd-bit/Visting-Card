"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
exports.referralsRouter = (0, express_1.Router)();
exports.referralsRouter.use(auth_1.authenticate);
// GET /api/referrals/wallet
exports.referralsRouter.get("/wallet", async (req, res) => {
    const wallet = await prisma_1.prisma.referralWallet.findUnique({ where: { userId: req.userId } });
    res.json(wallet ?? { availablePaise: 0, pendingPaise: 0, lifetimeEarned: 0, lifetimePaid: 0 });
});
// GET /api/referrals/rewards
exports.referralsRouter.get("/rewards", async (req, res) => {
    const rewards = await prisma_1.prisma.referralReward.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { subscription: { include: { plan: { select: { name: true } } } } },
    });
    res.json(rewards);
});
// GET /api/referrals/list
exports.referralsRouter.get("/list", async (req, res) => {
    const referrals = await prisma_1.prisma.referral.findMany({
        where: { referrerId: req.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
            id: true, status: true, createdAt: true,
            referredUser: { select: { email: true, fullName: true } },
        },
    });
    res.json(referrals);
});
// GET /api/referrals/payouts
exports.referralsRouter.get("/payouts", async (req, res) => {
    const payouts = await prisma_1.prisma.payoutRequest.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, amountPaise: true, method: true, status: true, createdAt: true, payoutReference: true },
    });
    res.json(payouts);
});
// POST /api/referrals/withdraw
exports.referralsRouter.post("/withdraw", async (req, res) => {
    const schema = zod_1.z.object({
        amountPaise: zod_1.z.number().int().min(1),
        upiId: zod_1.z.string().min(5).max(100).regex(/^[\w.\-]+@[\w]+$/, "Invalid UPI ID."),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message });
        return;
    }
    const { amountPaise, upiId } = parsed.data;
    // Atomic balance check + deduction using a transaction
    const result = await prisma_1.prisma.$transaction(async (tx) => {
        const wallet = await tx.referralWallet.findUnique({
            where: { userId: req.userId },
        });
        if (!wallet || wallet.availablePaise < amountPaise) {
            throw new Error("INSUFFICIENT_BALANCE");
        }
        if (amountPaise < 50000) {
            throw new Error("BELOW_MINIMUM");
        }
        // Hold funds immediately
        await tx.referralWallet.update({
            where: { userId: req.userId },
            data: { availablePaise: { decrement: amountPaise } },
        });
        return tx.payoutRequest.create({
            data: { userId: req.userId, amountPaise, method: "upi", upiId },
            select: { id: true, amountPaise: true, status: true },
        });
    });
    res.status(201).json(result);
});
//# sourceMappingURL=referrals.js.map