import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../lib/prisma";
import { signToken, authenticate, AuthRequest } from "../middleware/auth";
import { nanoid } from "../lib/nanoid";

export const authRouter = Router();

const authLimit = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

const registerSchema = z.object({
  email: z.string().email("Invalid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  fullName: z.string().min(2).max(120).optional(),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
authRouter.post("/register", authLimit, async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input." });
    return;
  }

  const { email, password, fullName, phone, referralCode } = parsed.data;

  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  const code = `DVC-${nanoid(6).toUpperCase()}`;

  // Resolve referrer
  let referredById: string | undefined;
  if (referralCode) {
    const referrer = await prisma.profile.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });
    if (referrer && referrer.id !== id) referredById = referrer.id;
  }

  const profile = await prisma.profile.create({
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
    await prisma.referral.create({
      data: {
        referrerId: referredById,
        referredUserId: id,
        referralCode: code,
      },
    }).catch(() => undefined); // ignore duplicate
  }

  // Seed free plan subscription
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (freePlan) {
    await prisma.subscription.create({
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
  await prisma.referralWallet.create({
    data: { userId: id },
  }).catch(() => undefined);

  const token = signToken(profile.id, profile.role);
  res.status(201).json({ token, user: profile });
});

// POST /api/auth/login
authRouter.post("/login", authLimit, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password." });
    return;
  }

  const { email, password } = parsed.data;
  const profile = await prisma.profile.findUnique({ where: { email } });

  if (!profile?.passwordHash) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, profile.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  if (profile.status === "suspended") {
    res.status(403).json({ error: "This account has been suspended." });
    return;
  }

  const token = signToken(profile.id, profile.role);
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
authRouter.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const profile = await prisma.profile.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, fullName: true, phone: true,
      avatarUrl: true, role: true, status: true, referralCode: true,
      onboarded: true, createdAt: true,
    },
  });
  if (!profile) { res.status(404).json({ error: "User not found." }); return; }
  res.json(profile);
});

// PATCH /api/auth/me
authRouter.patch("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    fullName: z.string().max(120).optional(),
    phone: z.string().max(20).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input." }); return; }

  const updated = await prisma.profile.update({
    where: { id: req.userId },
    data: parsed.data,
    select: { id: true, email: true, fullName: true, phone: true },
  });
  res.json(updated);
});
