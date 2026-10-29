"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const nanoid_1 = require("../lib/nanoid");
exports.authRouter = (0, express_1.Router)();
const authLimit = (0, express_rate_limit_1.default)({ windowMs: 60000, max: 10, standardHeaders: true, legacyHeaders: false });
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email."),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters."),
    fullName: zod_1.z.string().min(2).max(120).optional(),
    phone: zod_1.z.string().optional(),
    referralCode: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// POST /api/auth/register
exports.authRouter.post("/register", authLimit, async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
        return;
    }
    const { email, password, fullName, phone, referralCode } = parsed.data;
    const existing = await prisma_1.prisma.profile.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: "An account with this email already exists." });
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const id = crypto.randomUUID();
    const code = `DVC-${(0, nanoid_1.nanoid)(6).toUpperCase()}`;
    // Resolve referrer
    let referredById;
    if (referralCode) {
        const referrer = await prisma_1.prisma.profile.findUnique({
            where: { referralCode: referralCode.toUpperCase() },
        });
        if (referrer && referrer.id !== id)
            referredById = referrer.id;
    }
    const profile = await prisma_1.prisma.profile.create({
        data: {
            id,
            email,
            passwordHash,
            fullName: fullName ?? null,
            phone: phone ?? null,
            referralCode: code,
            referredById: referredById ?? null,
        },
        select: { id: true, email: true, fullName: true, role: true, referralCode: true },
    });
    // Create referral relationship
    if (referredById) {
        await prisma_1.prisma.referral.create({
            data: {
                referrerId: referredById,
                referredUserId: id,
                referralCode: code,
            },
        }).catch(() => undefined); // ignore duplicate
    }
    // Seed free plan subscription
    const freePlan = await prisma_1.prisma.plan.findUnique({ where: { slug: "free" } });
    if (freePlan) {
        await prisma_1.prisma.subscription.create({
            data: {
                userId: id,
                planId: freePlan.id,
                status: "active",
                pricePaise: 0,
                billingPeriod: "annual",
            },
        }).catch(() => undefined);
    }
    // Seed referral wallet
    await prisma_1.prisma.referralWallet.create({
        data: { userId: id },
    }).catch(() => undefined);
    const token = (0, auth_1.signToken)(profile.id, profile.role);
    res.status(201).json({ token, user: profile });
});
// POST /api/auth/login
exports.authRouter.post("/login", authLimit, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid email or password." });
        return;
    }
    const { email, password } = parsed.data;
    const profile = await prisma_1.prisma.profile.findUnique({ where: { email } });
    if (!profile?.passwordHash) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
    }
    const valid = await bcryptjs_1.default.compare(password, profile.passwordHash);
    if (!valid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
    }
    if (profile.status === "suspended") {
        res.status(403).json({ error: "This account has been suspended." });
        return;
    }
    const token = (0, auth_1.signToken)(profile.id, profile.role);
    res.json({
        token,
        user: {
            id: profile.id,
            email: profile.email,
            fullName: profile.fullName,
            role: profile.role,
            referralCode: profile.referralCode,
        },
    });
});
// GET /api/auth/me
exports.authRouter.get("/me", auth_1.authenticate, async (req, res) => {
    const profile = await prisma_1.prisma.profile.findUnique({
        where: { id: req.userId },
        select: {
            id: true, email: true, fullName: true, phone: true,
            avatarUrl: true, role: true, status: true, referralCode: true,
            onboarded: true, createdAt: true,
        },
    });
    if (!profile) {
        res.status(404).json({ error: "User not found." });
        return;
    }
    res.json(profile);
});
// PATCH /api/auth/me
exports.authRouter.patch("/me", auth_1.authenticate, async (req, res) => {
    const schema = zod_1.z.object({
        fullName: zod_1.z.string().max(120).optional(),
        phone: zod_1.z.string().max(20).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input." });
        return;
    }
    const updated = await prisma_1.prisma.profile.update({
        where: { id: req.userId },
        data: parsed.data,
        select: { id: true, email: true, fullName: true, phone: true },
    });
    res.json(updated);
});
//# sourceMappingURL=auth.js.map