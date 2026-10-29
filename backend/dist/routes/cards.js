"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const db_1 = require("../middleware/db");
exports.cardsRouter = (0, express_1.Router)();
// ── Public routes (no auth) ───────────────────────────────────────────────────
// GET /api/cards/public/:username — MUST be before /:id
exports.cardsRouter.get("/public/:username", db_1.requireDb, async (req, res) => {
    const username = req.params.username.toLowerCase().trim();
    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(username)) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    const card = await prisma_1.prisma.card.findFirst({
        where: { username, status: "published", deletedAt: null },
        include: {
            theme: true,
            sections: { where: { isEnabled: true }, orderBy: { position: "asc" } },
            socialLinks: { where: { isActive: true }, orderBy: { position: "asc" } },
            services: { where: { isActive: true }, orderBy: { position: "asc" } },
            products: { where: { isActive: true }, orderBy: { position: "asc" } },
            businessHours: { orderBy: { dayOfWeek: "asc" } },
            paymentConfig: { where: { isActive: true } },
            galleryItems: { orderBy: { position: "asc" } },
            reviews: { where: { isActive: true } },
            testimonials: { where: { isActive: true } },
            offers: { where: { isActive: true } },
        },
    });
    if (!card) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    // Bump view count fire-and-forget
    prisma_1.prisma.card.update({ where: { id: card.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
    res.json(card);
});
// ── Authenticated routes ──────────────────────────────────────────────────────
exports.cardsRouter.use(auth_1.authenticate, db_1.requireDb);
// GET /api/cards
exports.cardsRouter.get("/", async (req, res) => {
    const cards = await prisma_1.prisma.card.findMany({
        where: { userId: req.userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
            id: true, username: true, fullName: true, designation: true,
            status: true, viewCount: true, leadCount: true, updatedAt: true,
            theme: { select: { slug: true, name: true } },
        },
    });
    res.json(cards);
});
// POST /api/cards
exports.cardsRouter.post("/", async (req, res) => {
    const schema = zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(120),
        designation: zod_1.z.string().max(80).optional(),
        phone: zod_1.z.string().max(20).optional(),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
        city: zod_1.z.string().max(80).optional(),
        themeSlug: zod_1.z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message });
        return;
    }
    // Check plan card limit
    const sub = await prisma_1.prisma.subscription.findFirst({
        where: { userId: req.userId, status: { in: ["active", "grace"] } },
        include: { plan: true },
    });
    const limits = (sub?.plan.limits ?? {});
    const maxCards = typeof limits.max_cards === "number" ? limits.max_cards : 1;
    const cardCount = await prisma_1.prisma.card.count({ where: { userId: req.userId, deletedAt: null } });
    if (maxCards >= 0 && cardCount >= maxCards) {
        res.status(403).json({ error: `Your plan allows ${maxCards} card(s). Upgrade to create more.` });
        return;
    }
    const { fullName, designation, phone, email, city, themeSlug } = parsed.data;
    const base = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-card";
    const candidates = [base, `${base}-1`, `${base}-2`, `${base}-3`, `${base}-${Date.now().toString(36).slice(-4)}`];
    let card = null;
    for (const username of candidates) {
        try {
            const theme = themeSlug
                ? await prisma_1.prisma.theme.findFirst({ where: { slug: themeSlug, isActive: true } })
                : null;
            card = await prisma_1.prisma.card.create({
                data: {
                    userId: req.userId,
                    username,
                    fullName,
                    designation: designation ?? null,
                    phone: phone ?? null,
                    email: email || null,
                    city: city ?? null,
                    themeId: theme?.id ?? null,
                    sections: {
                        createMany: {
                            data: ["about", "contact", "social", "services", "products", "gallery", "location", "business_hours", "reviews", "enquiry", "payment"]
                                .map((key, i) => ({ sectionKey: key, position: (i + 1) * 10, isEnabled: true })),
                        },
                    },
                },
                select: { id: true, username: true, fullName: true, status: true },
            });
            break;
        }
        catch (e) {
            if (e.code === "P2002")
                continue;
            throw e;
        }
    }
    if (!card) {
        res.status(500).json({ error: "Could not create card. Please try again." });
        return;
    }
    res.status(201).json(card);
});
// GET /api/cards/:id
exports.cardsRouter.get("/:id", async (req, res) => {
    const card = await prisma_1.prisma.card.findFirst({
        where: { id: req.params.id, userId: req.userId, deletedAt: null },
        include: {
            theme: true,
            sections: { orderBy: { position: "asc" } },
            socialLinks: { orderBy: { position: "asc" } },
            services: { orderBy: { position: "asc" } },
            products: { orderBy: { position: "asc" } },
            businessHours: { orderBy: { dayOfWeek: "asc" } },
            paymentConfig: true,
            galleryItems: { orderBy: { position: "asc" } },
        },
    });
    if (!card) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    res.json(card);
});
// PATCH /api/cards/:id
exports.cardsRouter.patch("/:id", async (req, res) => {
    const schema = zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(120).optional(),
        username: zod_1.z.string().min(3).max(30).regex(/^[a-z0-9-]+$/).optional(),
        designation: zod_1.z.string().max(80).optional(),
        company: zod_1.z.string().max(120).optional(),
        bio: zod_1.z.string().max(600).optional(),
        phone: zod_1.z.string().max(20).optional(),
        whatsapp: zod_1.z.string().max(20).optional(),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
        website: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
        address: zod_1.z.string().max(200).optional(),
        city: zod_1.z.string().max(80).optional(),
        state: zod_1.z.string().max(80).optional(),
        pincode: zod_1.z.string().max(10).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message });
        return;
    }
    const existing = await prisma_1.prisma.card.findFirst({ where: { id: req.params.id, userId: req.userId, deletedAt: null } });
    if (!existing) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    const updated = await prisma_1.prisma.card.update({
        where: { id: req.params.id },
        data: parsed.data,
        select: { id: true, username: true, fullName: true, updatedAt: true },
    });
    res.json(updated);
});
// PATCH /api/cards/:id/publish
exports.cardsRouter.patch("/:id/publish", async (req, res) => {
    const { published } = zod_1.z.object({ published: zod_1.z.boolean() }).parse(req.body);
    const card = await prisma_1.prisma.card.findFirst({ where: { id: req.params.id, userId: req.userId, deletedAt: null } });
    if (!card) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    if (card.status === "suspended") {
        res.status(403).json({ error: "Card is suspended." });
        return;
    }
    const updated = await prisma_1.prisma.card.update({
        where: { id: req.params.id },
        data: { status: published ? "published" : "draft", publishedAt: published ? new Date() : undefined },
        select: { id: true, status: true },
    });
    res.json(updated);
});
// DELETE /api/cards/:id
exports.cardsRouter.delete("/:id", async (req, res) => {
    const card = await prisma_1.prisma.card.findFirst({ where: { id: req.params.id, userId: req.userId, deletedAt: null } });
    if (!card) {
        res.status(404).json({ error: "Card not found." });
        return;
    }
    await prisma_1.prisma.card.update({ where: { id: req.params.id }, data: { deletedAt: new Date(), status: "draft" } });
    res.json({ deleted: true });
});
//# sourceMappingURL=cards.js.map