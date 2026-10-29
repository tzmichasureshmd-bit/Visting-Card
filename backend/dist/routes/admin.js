"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_1.authenticate, auth_1.requireAdmin);
// GET /api/admin/stats
exports.adminRouter.get("/stats", async (_req, res) => {
    const [users, cards, published, leads, payments] = await Promise.all([
        prisma_1.prisma.profile.count(),
        prisma_1.prisma.card.count({ where: { deletedAt: null } }),
        prisma_1.prisma.card.count({ where: { status: "published", deletedAt: null } }),
        prisma_1.prisma.lead.count(),
        prisma_1.prisma.payment.aggregate({ _sum: { amountPaise: true }, where: { status: "captured" } }),
    ]);
    res.json({
        users, cards, published, leads,
        revenueRupees: Math.floor((payments._sum.amountPaise ?? 0) / 100),
    });
});
// GET /api/admin/users
exports.adminRouter.get("/users", async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const search = req.query.search;
    const users = await prisma_1.prisma.profile.findMany({
        where: search ? { OR: [{ email: { contains: search } }, { fullName: { contains: search } }] } : undefined,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
        select: { id: true, email: true, fullName: true, role: true, status: true, createdAt: true },
    });
    res.json(users);
});
// PATCH /api/admin/users/:id — suspend/activate/change role
exports.adminRouter.patch("/users/:id", async (req, res) => {
    const schema = zod_1.z.object({
        status: zod_1.z.enum(["active", "suspended"]).optional(),
        role: zod_1.z.enum(["user", "reseller", "admin"]).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input." });
        return;
    }
    const updated = await prisma_1.prisma.profile.update({
        where: { id: req.params.id },
        data: parsed.data,
        select: { id: true, email: true, status: true, role: true },
    });
    res.json(updated);
});
// GET /api/admin/payments
exports.adminRouter.get("/payments", async (req, res) => {
    const page = Number(req.query.page ?? 1);
    const payments = await prisma_1.prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
        include: {
            user: { select: { email: true, fullName: true } },
            plan: { select: { name: true } },
        },
    });
    res.json(payments);
});
// GET /api/admin/withdrawals
exports.adminRouter.get("/withdrawals", async (req, res) => {
    const status = req.query.status;
    const payouts = await prisma_1.prisma.payoutRequest.findMany({
        where: status ? { status: status } : undefined,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { email: true, fullName: true } } },
    });
    res.json(payouts);
});
// PATCH /api/admin/withdrawals/:id — approve/reject/mark paid
exports.adminRouter.patch("/withdrawals/:id", async (req, res) => {
    const schema = zod_1.z.object({
        status: zod_1.z.enum(["approved", "rejected", "paid", "under_review"]),
        adminNote: zod_1.z.string().max(500).optional(),
        payoutReference: zod_1.z.string().max(200).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input." });
        return;
    }
    const payout = await prisma_1.prisma.payoutRequest.findUnique({ where: { id: req.params.id } });
    if (!payout) {
        res.status(404).json({ error: "Payout not found." });
        return;
    }
    const updated = await prisma_1.prisma.payoutRequest.update({
        where: { id: req.params.id },
        data: {
            status: parsed.data.status,
            adminNote: parsed.data.adminNote ?? null,
            payoutReference: parsed.data.payoutReference ?? null,
            processedAt: parsed.data.status === "paid" ? new Date() : undefined,
        },
    });
    // If rejected, refund the held balance
    if (parsed.data.status === "rejected") {
        await prisma_1.prisma.referralWallet.update({
            where: { userId: payout.userId },
            data: { availablePaise: { increment: payout.amountPaise } },
        });
    }
    // If paid, update lifetime_paid
    if (parsed.data.status === "paid") {
        await prisma_1.prisma.referralWallet.update({
            where: { userId: payout.userId },
            data: { lifetimePaid: { increment: payout.amountPaise } },
        });
    }
    res.json(updated);
});
// GET /api/admin/plans
exports.adminRouter.get("/plans", async (_req, res) => {
    const plans = await prisma_1.prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
    res.json(plans);
});
// PATCH /api/admin/plans/:id
exports.adminRouter.patch("/plans/:id", async (req, res) => {
    const schema = zod_1.z.object({
        name: zod_1.z.string().max(80).optional(),
        pricePaise: zod_1.z.number().int().min(0).optional(),
        isActive: zod_1.z.boolean().optional(),
        limits: zod_1.z.record(zod_1.z.unknown()).optional().transform(v => v),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input." });
        return;
    }
    const updated = await prisma_1.prisma.plan.update({
        where: { id: req.params.id },
        data: parsed.data,
    });
    res.json(updated);
});
//# sourceMappingURL=admin.js.map