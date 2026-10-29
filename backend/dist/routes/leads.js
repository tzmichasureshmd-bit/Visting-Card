"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
exports.leadsRouter = (0, express_1.Router)();
// POST /api/leads — public, submit a lead from a card
exports.leadsRouter.post("/", async (req, res) => {
    const schema = zod_1.z.object({
        cardId: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(2).max(120),
        phone: zod_1.z.string().min(10).max(15),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
        message: zod_1.z.string().max(2000).optional(),
        source: zod_1.z.string().max(40).optional(),
        website: zod_1.z.string().max(0).optional(), // honeypot
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message });
        return;
    }
    if (parsed.data.website) {
        res.status(204).end();
        return;
    } // honeypot triggered
    const card = await prisma_1.prisma.card.findFirst({
        where: { id: parsed.data.cardId, status: "published", deletedAt: null },
    });
    if (!card) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    // Duplicate suppression: one lead per phone per card per 30 days
    const recent = await prisma_1.prisma.lead.findFirst({
        where: {
            cardId: parsed.data.cardId,
            phone: parsed.data.phone,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
    });
    if (recent) {
        res.status(200).json({ ok: true });
        return;
    } // silent dedup
    const lead = await prisma_1.prisma.lead.create({
        data: {
            cardId: parsed.data.cardId,
            name: parsed.data.name,
            phone: parsed.data.phone,
            email: parsed.data.email || null,
            message: parsed.data.message || null,
            source: parsed.data.source ?? "enquiry",
        },
        select: { id: true },
    });
    // Bump lead counter
    await prisma_1.prisma.card.update({ where: { id: parsed.data.cardId }, data: { leadCount: { increment: 1 } } });
    res.status(201).json({ ok: true, leadId: lead.id });
});
// GET /api/leads/:cardId — owner reads their leads
exports.leadsRouter.get("/:cardId", auth_1.authenticate, async (req, res) => {
    const card = await prisma_1.prisma.card.findFirst({
        where: { id: req.params.cardId, userId: req.userId, deletedAt: null },
    });
    if (!card) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    const status = req.query.status;
    const leads = await prisma_1.prisma.lead.findMany({
        where: {
            cardId: req.params.cardId,
            ...(status ? { status: status } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });
    res.json(leads);
});
// PATCH /api/leads/:id/status — update lead status
exports.leadsRouter.patch("/:id/status", auth_1.authenticate, async (req, res) => {
    const { status } = zod_1.z.object({
        status: zod_1.z.enum(["new", "contacted", "interested", "converted", "lost"]),
    }).parse(req.body);
    const lead = await prisma_1.prisma.lead.findFirst({
        where: { id: req.params.id },
        include: { card: { select: { userId: true } } },
    });
    if (!lead || lead.card.userId !== req.userId) {
        res.status(404).json({ error: "Lead not found." });
        return;
    }
    const updated = await prisma_1.prisma.lead.update({
        where: { id: req.params.id },
        data: {
            status,
            convertedAt: status === "converted" && !lead.convertedAt ? new Date() : undefined,
        },
    });
    res.json(updated);
});
//# sourceMappingURL=leads.js.map